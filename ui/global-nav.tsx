'use client';
import { getSecondMenu, useResolveSlug, type Item } from '#/lib/second-menu';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { MenuAlt2Icon, XIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import { useState, useRef, useEffect } from 'react';
import Byline from './byline';
import { UserData } from '#/app/utils/getUserID';
import { CBudLogo } from './cbud-logo';
import titles from '#/strings.json';
import { ClerkLoading, useSession, useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { Search, Grid3x3, Bell, ChevronDown } from 'lucide-react';
import TaskBar from './task-bar';
import Image from 'next/image';

interface GlobalNavProps {
  userData?: UserData;
  subscriptionData?: any;
}

export function GlobalNav({ userData, subscriptionData }: GlobalNavProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { session, isLoaded } = useSession();
  const { user, isLoaded: isUserLoaded } = useUser();
  const close = () => setIsOpen(false);

  const secondMenu = getSecondMenu(userData?.userID || '');
  const resolveSlug = useResolveSlug();

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <div className="fixed top-0 z-10 flex w-full flex-col border-b border-gray-800 bg-black lg:bottom-0 lg:z-auto lg:w-72 lg:border-b-0 lg:border-r lg:border-gray-800">
      {/* Top Bar - Facebook mobile style */}
      <div className="flex h-14 items-center justify-between px-4 bg-black border-b border-gray-800 lg:border-b-0">
        {/* Left: Logo */}
        <Link
          href="/"
          className="group flex items-center gap-x-2.5"
          onClick={close}
        >
          <div className="h-8 w-8 rounded-full border border-white/30 group-hover:border-white/50 flex items-center justify-center bg-blue-600">
            <CBudLogo />
          </div>
          <h3 className="hidden sm:block font-semibold tracking-wide text-gray-400 group-hover:text-gray-50">
            {titles.title}
          </h3>
        </Link>

        {/* Right: Icon Buttons - Only show on mobile, hide on desktop where sidebar exists */}
        <div className="flex items-center gap-x-2 lg:hidden">
          {/* Search Icon */}
          <button 
            className="h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-gray-300" />
          </button>

          {/* Grid/Menu Icon - Toggles navigation menu */}
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
            aria-label="Menu"
          >
            {isOpen ? (
              <XIcon className="h-5 w-5 text-gray-300" />
            ) : (
              <Grid3x3 className="h-5 w-5 text-gray-300" />
            )}
          </button>

          {/* Notifications Icon */}
          <button 
            className="h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-300" />
            {/* Optional: Add notification badge */}
          </button>

          {/* Profile Button with Popout Menu */}
          {isLoaded && session ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                className="flex items-center gap-x-1 h-9 px-1 rounded-lg hover:bg-gray-800 transition-colors"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="dialog"
                type="button"
              >
                <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors bg-gray-700 flex items-center justify-center">
                  {isUserLoaded && user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={user.fullName || 'User avatar'}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : isUserLoaded && user ? (
                    <div className="h-full w-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
                      {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                    </div>
                  ) : (
                    <div className="h-full w-full bg-gray-600 animate-pulse"></div>
                  )}
                </div>
                <ChevronDown 
                  className={`h-4 w-4 text-gray-300 transition-transform ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Popout Menu with Business Logic */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-700 bg-gray-900 shadow-lg z-50 max-h-[80vh] overflow-y-auto">
                  <div className="p-4">
                    {isUserLoaded && user && (
                      <div className="mb-4 pb-4 border-b border-gray-700 flex items-center gap-x-3">
                        {user?.imageUrl ? (
                          <Image
                            src={user.imageUrl}
                            alt={user.fullName || 'User avatar'}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-medium">
                            {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">
                            {user?.fullName || user?.firstName || 'User'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user?.emailAddresses[0]?.emailAddress}
                          </p>
                        </div>
                        <UserButton afterSignOutUrl="/" appearance={{
                          elements: {
                            avatarBox: "h-8 w-8"
                          }
                        }} />
                      </div>
                    )}
                    <ClerkLoading>Loading ...</ClerkLoading>
                    <TaskBar
                      embedded={true}
                      paymentInfo={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && subscriptionData ? {
                        status: {
                          isActive: subscriptionData.status.isActive,
                          planId: subscriptionData.status.planId,
                          expiresAt: subscriptionData.status.expiresAt,
                          planName: subscriptionData.status.planName,
                          recentTransactions: [],
                        },
                      } : undefined}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : isLoaded && !session ? (
            <Link 
              href={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in'} 
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Sign In
            </Link>
          ) : (
            <div className="h-9 w-9 rounded-full bg-gray-800 animate-pulse"></div>
          )}
        </div>

        {/* Desktop: Show UserButton and TaskBar in sidebar header */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-2 lg:ml-auto lg:pr-4">
          {isLoaded && session && (
            <>
              <UserButton afterSignOutUrl="/" />
              <div className="text-white">
                <TaskBar
                  paymentInfo={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && subscriptionData ? {
                    status: {
                      isActive: subscriptionData.status.isActive,
                      planId: subscriptionData.status.planId,
                      expiresAt: subscriptionData.status.expiresAt,
                      planName: subscriptionData.status.planName,
                      recentTransactions: [],
                    },
                  } : undefined}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div
        className={clsx('overflow-y-auto lg:static lg:block', {
          'fixed inset-x-0 bottom-0 top-14 mt-px bg-black': isOpen,
          hidden: !isOpen,
        })}
      >
        <nav className="space-y-6 px-2 pb-24 pt-5">
          {secondMenu.map((section) => {
            return (
              <div key={section.name}>
                <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400/80">
                  <div>{section.name}</div>
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <GlobalNavItem
                      key={item.slug}
                      item={item}
                      close={close}
                      resolveSlug={resolveSlug}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <Byline className="absolute hidden sm:block" />
      </div>
    </div>
  );
}

function GlobalNavItem({
  item,
  close,
  resolveSlug,
}: {
  item: Item;
  close: () => false | void;
  resolveSlug: (item: Item) => string;
}) {
  const segment = useSelectedLayoutSegment();
  const isActive = item.slug === segment;
  const href = `/${resolveSlug(item)}`;

  return (
    <Link
      onClick={close}
      href={href}
      className={clsx(
        'block rounded-md px-3 py-2 text-sm font-medium hover:text-gray-300',
        {
          'text-gray-400 hover:bg-gray-800': !isActive,
          'text-white': isActive,
        },
      )}
    >
      {item.name}
    </Link>
  );
}
