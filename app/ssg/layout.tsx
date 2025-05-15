import { Tab } from '#/ui/tab';
import React from 'react';
import { RandomPostTab } from './random-post-tab';

const title = 'Static Data';

export const metadata = {
  title,
  openGraph: {
    title,
    images: [`/api/og?title=${title}`],
  },
};

// We need to keep this file going due to the face that we would like ISR or some sort of Static Generation
// for the blog area and Landing Pages.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-center gap-2">
        {/* Has TS errors. */}
        {/* <Tab path="/ssg" item={{ text: 'Home' }} />
        <Tab path="/ssg" item={{ text: 'Post 1', slug: '1' }} />
        <Tab path="/ssg" item={{ text: 'Post 2', slug: '2' }} /> */}
        <RandomPostTab path="/ssg" />
      </div>

      <div>{children}</div>
    </div>
  );
}
