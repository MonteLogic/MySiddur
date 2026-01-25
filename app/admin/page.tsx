import { getHistory } from '@mysiddur/core/generation';
import AdminPageContent from './admin-content';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    // Get the current session
    const { userId } = auth();
    
    // Check if user is authenticated
    if (!userId) {
        redirect('/sign-in');
    }
    
    // Fetch user from Clerk API to check private metadata securely
    const user = await clerkClient.users.getUser(userId);
    const isAdmin = user.privateMetadata?.auth === 'admin';
    
    if (!isAdmin) {
        // Redirect non-admin users to home page
        redirect('/');
    }
    
    const history = await getHistory();

    return (
        <AdminPageContent history={history} />
    );
}
