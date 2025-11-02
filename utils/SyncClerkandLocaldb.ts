// Updated to use Clerk metadata instead of database
import { ClerkMetadataService } from '#/lib/clerk-metadata-service';
import { UserData } from '#/lib/clerk-metadata-service';

export async function syncClerkAndLocalDb(clerkUserId: string, orgId: string) {
  try {
    const result = await ClerkMetadataService.syncClerkAndMetadata(clerkUserId, orgId);
    return result;
  } catch (error) {
    console.error('Error syncing user with metadata:', error);
    throw error;
  }
}