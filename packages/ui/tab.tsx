'use client';
import type { Item } from '#/ui/tab-group';
import clsx from 'clsx';
import Link from 'next/link';

export const Tab = ({
  path,
  parallelRoutesKey,
  item,
  isActive,
  onClick,
}: {
  path: string;
  parallelRoutesKey?: string;
  item: Item;
  isActive: boolean;
  onClick: () => void;
}) => {
  const href = item.slug ? path + '/' + item.slug : path;

  return (
    <Link
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={clsx('rounded-lg px-3 py-1 text-sm font-medium', {
        'bg-gray-700 text-gray-100 hover:bg-gray-500 hover:text-white':
          !isActive,
        'bg-vercel-blue text-white': isActive,
      })}
    >
      {item.text}
    </Link>
  );
};
