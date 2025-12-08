import '#/styles/globals.css';
import Byline from '#/ui/byline';
import { GlobalNav } from '#/ui/global-nav';
import { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { cache } from 'react';
import { Analytics } from '@vercel/analytics/next';
import titles from '#/strings.json';

export const metadata: Metadata = {
  title: {
    default: titles.title,
    template: '%s | MonteLogic',
  },
  description:
    titles.title +
    ' is an online system for managing contractors concerns. These concerns include scheduling, timecards, route management and time management. This easy to use app will make truck drivers and route managers working lives much easier.',
  openGraph: {
    title: titles.title,
    description: titles.description,
    images: [`/api/og?title=Next.js App Router`],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const getUserData = cache(async () => {
  try {
    const { userId: clerkUserId } = auth();

    if (!clerkUserId) {
      return {
        title: 'No user logged in',
        description: 'This description comes from the server',
        userID: '',
        dbUserId: null,
        isAdmin: false,
      };
    }

    // Fetch the user directly from Clerk API to get guaranteed access to privateMetadata
    const user = await clerkClient.users.getUser(clerkUserId);
    
    // Check admin status from private metadata
    const privateMetadata = user.privateMetadata;
    const isAdmin = privateMetadata?.auth === 'admin';

    console.log('[getUserData] Admin check:', {
      userId: clerkUserId,
      auth: privateMetadata?.auth,
      isAdmin
    });

    return {
      title: 'User logged in',
      description: 'This description comes from the server',
      userID: clerkUserId,
      dbUserId: clerkUserId,
      isAdmin,
    };
  } catch (error) {
    // Clerk not configured or failed to load
    console.error('[getUserData] Error:', error);
    return {
      title: 'No user logged in',
      description: 'This description comes from the server',
      userID: '',
      dbUserId: null,
      isAdmin: false,
    };
  }
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userData = await getUserData();

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;


  const content = (
    <html lang="en" className="dark [color-scheme:dark]">
      <body 
        className="bg-gray-1100 overflow-y-scroll bg-[url('/grid.svg')] pb-36"
        suppressHydrationWarning
      >
        <GlobalNav userData={userData} />
        <div className="pt-14 lg:pl-72">
          <div className="mx-auto max-w-4xl space-y-8 px-2 pt-6 lg:px-8 lg:py-8">
            <div className="bg-vc-border-gradient rounded-lg p-px shadow-lg shadow-black/20">
              <div className="rounded-lg bg-black p-3.5 lg:p-6">
                {children}
                <Analytics />
              </div>
            </div>
            <Byline className="fixed sm:hidden" />
          </div>
        </div>
      </body>
    </html>
  );

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {content}
    </ClerkProvider>
  );
}
