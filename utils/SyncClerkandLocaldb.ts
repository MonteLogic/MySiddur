import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { tursoClient } from '#/db/index';
import { users } from '#/db/schema';
import { UserType } from '#/types/UserTypes';

export async function syncClerkAndLocalDb(clerkUserId: string, orgId: string) {
  const db = tursoClient();
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

  if (!userEmail) {
    throw new Error('User email not found');
  }

  // Check if user exists in local database by email
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, userEmail))
    .limit(1);

  if (existingUser.length === 0) {
    // User doesn't exist in local database, create new record
    const newUser: UserType[] = await db
      .insert(users)
      .values({
        id: clerkUserId,
        userNiceName:
          `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
          'New User',
        email: userEmail,
        organizationID: orgId,
        phone: '', // Add default value or get from Clerk if available
        dateHired: new Date().toISOString(), // Set to current date or null if not required
        dateAddedToCB: new Date().toISOString(), // Set to current date or null if not required
        // Add any other required fields with appropriate default values
      })
      .returning();

    return { isNewUser: true, localUser: newUser[0] };
  }

  // User exists, update the record with Clerk ID if necessary
  if (existingUser[0].id !== clerkUserId) {
    await db
      .update(users)
      .set({ id: clerkUserId })
      .where(eq(users.email, userEmail));
  }

  return { isNewUser: false, localUser: existingUser[0] };
}
