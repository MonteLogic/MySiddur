import { ArrowRightIcon } from '@heroicons/react/outline';
import Link from 'next/link';

export const InternalLink = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <Link
      href={href}
      className="inline-flex gap-x-2 rounded-lg bg-gray-700 px-3 py-1 text-sm font-medium text-gray-100 no-underline hover:bg-gray-500 hover:text-white"
    >
      <div>{children}</div>

      <ArrowRightIcon className="block w-4" />
    </Link>
  );
};
