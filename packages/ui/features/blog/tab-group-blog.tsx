'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Use usePathname instead of useRouter
import React from 'react';

interface TabItem {
  text: string;
  slug?: string; // Optional slug for dynamic routes (will be prioritized if provided)
  href?: string; // Optional explicit href
}

interface TabGroupBlogProps {
  path: string; // Base path for the tabs (only used if href is not provided)
  items: TabItem[];
}

export const TabGroupBlog: React.FC<TabGroupBlogProps> = ({ path, items }) => {
  const pathname = usePathname(); // Get the pathname

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {items.map((item, index) => {
          // Use the explicit href if provided, otherwise generate based on slug and path
          const href = item.href ? item.href : (item.slug ? `${path}/${item.slug}` : path);

          const isActive =
            pathname === href ||
            (pathname?.startsWith(path + '/') &&
              item.slug &&
              pathname?.split('/')[2] === item.slug);

          return (
            <Link
              key={index}
              href={href}
              className={`inline-block rounded-t-lg px-4 py-2 font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 ${
                isActive
                  ? 'border-b-2 border-indigo-500 font-semibold text-indigo-700'
                  : ''
              }`}
            >
              {item.text}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};