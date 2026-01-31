'use client';
import type { Item } from '#/ui/components/tab-group';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Tab = ({
  path,
  item,
  isActive: isActiveProp,
  onClick,
}: {
  path: string;
  parallelRoutesKey?: string;
  item: Item;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  const href = item.slug ? path + '/' + item.slug : path;
  const pathname = usePathname();
  // Use prop if provided, otherwise determine from pathname
  const isActive = isActiveProp ?? pathname === href;

  const handleClick = onClick
    ? (e: React.MouseEvent) => {
        e.preventDefault();
        onClick();
      }
    : undefined;

  return (
    <Link
      href={href}
      onClick={handleClick}
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
