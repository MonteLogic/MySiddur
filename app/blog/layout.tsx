// app/blog/layout.tsx
import { TabGroupBlog } from '#/ui/tab-group-blog';
import React from 'react';
import { getBlogCategoryTabs } from '#/utils/blog'; // Adjust the import path

const title = 'MonteLogic Blog';

export const metadata = {
  title,
  openGraph: {
    title,
    images: [`/api/og?title=${title}`],
  },
};

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categoryTabs = await getBlogCategoryTabs();
  console.log('categoryTabs in layout:', categoryTabs); // Add this line

  return (
    <div className="space-y-9">
      <TabGroupBlog
        path="/blog"
        items={categoryTabs}
      />
      <div>{children}</div>
    </div>
  );
}