'use client';
import { getSecondMenu, useResolveSlug, type Item } from '#/lib/second-menu';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { XIcon } from '@heroicons/react/solid';
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

interface ProfileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  subscriptionData?: any;
}

interface SearchBarProps {
  className?: string;
}

interface IconButtonProps {
  onClick?: () => void;
  'aria-label': string;
  icon: React.ReactNode;
  className?: string;
}

// Reusable Icon Button Component
function IconButton({ onClick, 'aria-label': ariaLabel, icon, className = '' }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors',
        className
      )}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}

// Search Bar Component
function SearchBar({ className = '' }: SearchBarProps) {
  return (
    <div className={clsx('relative w-full', className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search"
        className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

// Profile Avatar Component
function ProfileAvatar({ size = 36 }: { size?: number }) {
  const { user, isLoaded: isUserLoaded } = useUser();

  if (!isUserLoaded) {
    return <div className="h-full w-full bg-gray-600 animate-pulse" />;
  }

  if (user?.imageUrl) {
    return (
      <Image
        src={user.imageUrl}
        alt={user.fullName || 'User avatar'}
        width={size}
        height={size}
        className="rounded-full"
      />
    );
  }

  if (user) {
    const initial = user?.firstName?.[0] || 
                   user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 
                   'U';
    return (
      <div className="h-full w-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
        {initial}
      </div>
    );
  }

  return <div className="h-full w-full bg-gray-600 animate-pulse" />;
}

// Profile Menu Dropdown Content
function ProfileMenuContent({ subscriptionData }: { subscriptionData?: any }) {
  const { user, isLoaded: isUserLoaded } = useUser();

  return (
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
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8"
              }
            }} 
          />
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
  );
}

// Profile Menu Component
function ProfileMenu({ isOpen, onToggle, onClose, subscriptionData }: ProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { session, isLoaded } = useSession();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isLoaded) {
    return <div className="h-9 w-9 rounded-full bg-gray-800 animate-pulse" />;
  }

  if (!session) {
    return (
      <Link 
        href={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in'} 
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="flex items-center gap-x-1 h-9 px-1 rounded-lg hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        type="button"
      >
        <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors bg-gray-700 flex items-center justify-center">
          <ProfileAvatar size={36} />
        </div>
        <ChevronDown 
          className={clsx(
            'h-4 w-4 text-gray-300 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-700 bg-gray-900 shadow-lg z-50 max-h-[80vh] overflow-y-auto">
          <ProfileMenuContent subscriptionData={subscriptionData} />
        </div>
      )}
    </div>
  );
}

// Navigation Menu Component
function NavigationMenu({ 
  menu, 
  onClose, 
  resolveSlug 
}: { 
  menu: ReturnType<typeof getSecondMenu>;
  onClose: () => void;
  resolveSlug: ReturnType<typeof useResolveSlug>;
}) {
  return (
    <nav className="space-y-6 px-2 pb-24 pt-5">
      {menu.map((section) => (
        <div key={section.name}>
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400/80">
            {section.name}
          </div>
          <div className="space-y-1">
            {section.items.map((item) => (
              <GlobalNavItem
                key={item.slug}
                item={item}
                close={onClose}
                resolveSlug={resolveSlug}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function GlobalNav({ userData, subscriptionData }: GlobalNavProps): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const secondMenu = getSecondMenu(userData?.userID || '');
  const resolveSlug = useResolveSlug();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);
  const closeProfileMenu = () => setIsProfileMenuOpen(false);

  return (
    <>
      {/* Top Navigation Bar - Always horizontal, fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 bg-black border-b border-gray-800">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-x-2.5"
          onClick={closeMobileMenu}
        >
          <div className="h-8 w-8 rounded-full border border-white/30 group-hover:border-white/50 flex items-center justify-center bg-blue-600">
            <CBudLogo />
          </div>
          <h3 className="hidden sm:block font-semibold tracking-wide text-gray-400 group-hover:text-gray-50">
            {titles.title}
          </h3>
        </Link>

        {/* Center: Search Bar - Desktop only */}
        <div className="hidden lg:flex lg:flex-1 lg:max-w-md lg:mx-4">
          <SearchBar />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-x-2">
          {/* Mobile Actions */}
          <div className="flex items-center gap-x-2 lg:hidden">
            <IconButton
              onClick={() => {}}
              aria-label="Search"
              icon={<Search className="h-5 w-5 text-gray-300" />}
            />
            <IconButton
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              icon={
                isMobileMenuOpen ? (
                  <XIcon className="h-5 w-5 text-gray-300" />
                ) : (
                  <Grid3x3 className="h-5 w-5 text-gray-300" />
                )
              }
            />
            <IconButton
              onClick={() => {}}
              aria-label="Notifications"
              icon={<Bell className="h-5 w-5 text-gray-300" />}
            />
            <ProfileMenu
              isOpen={isProfileMenuOpen}
              onToggle={toggleProfileMenu}
              onClose={closeProfileMenu}
              subscriptionData={subscriptionData}
            />
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-2">
            <IconButton
              onClick={() => {}}
              aria-label="Notifications"
              icon={<Bell className="h-5 w-5 text-gray-300" />}
            />
            <ProfileMenu
              isOpen={isProfileMenuOpen}
              onToggle={toggleProfileMenu}
              onClose={closeProfileMenu}
              subscriptionData={subscriptionData}
            />
          </div>
        </div>
      </div>

      {/* Left Sidebar - Desktop only, fixed below top bar */}
      <div className="hidden lg:block lg:fixed lg:top-14 lg:left-0 lg:bottom-0 lg:z-40 lg:w-72 lg:border-r lg:border-gray-800 lg:bg-black lg:overflow-y-auto">
        <NavigationMenu
          menu={secondMenu}
          onClose={closeMobileMenu}
          resolveSlug={resolveSlug}
        />
        <Byline className="absolute hidden sm:block" />
      </div>

      {/* Mobile Navigation Overlay */}
      <div
        className={clsx('lg:hidden overflow-y-auto', {
          'fixed inset-x-0 bottom-0 top-14 mt-px bg-black z-40': isMobileMenuOpen,
          hidden: !isMobileMenuOpen,
        })}
      >
        <NavigationMenu
          menu={secondMenu}
          onClose={closeMobileMenu}
          resolveSlug={resolveSlug}
        />
      </div>
    </>
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
