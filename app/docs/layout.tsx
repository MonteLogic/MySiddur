import { Tab } from '#/ui/vercel-tab';
import React from 'react';
import { RandomPostTab } from './random-post-tab';

const title = 'Documentation';

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
        <Tab path="/docs" item={{ text: 'Home' }} />
        <Tab path="/docs" item={{ text: 'Plans', slug: 'plans' }} />
        <RandomPostTab path="/docs" />
      </div>

      <div>{children}</div>
    </div>
  );
}
