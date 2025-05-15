import { Tab } from '#/ui/vercel-tab';
import React from 'react';

const title = 'Settings';

export const metadata = {
  title,
  openGraph: {
    title,
    images: [`/api/og?title=${title}`],
  },
};

// We need to keep this file going due to the face that we would like ISR or some sort of Static Generation
// for the blog area and Landing Pages.
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-center gap-2">
        {/* Has TS errors. */}
        <Tab path="/settings" item={{ text: 'Main Settings' }} />
        <Tab path="/settings" item={{ text: 'Plans', slug: 'plans' }} />
      </div>

      <div>{children}</div>
    </div>
  );
}
