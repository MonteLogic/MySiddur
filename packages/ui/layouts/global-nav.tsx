'use client';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { XIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import { useState, useRef, useEffect, JSX } from 'react';
import Byline from '../shared/byline';
import { UserData } from '#/app/utils/getUserID';
import { CBudLogo } from '../shared/cbud-logo';
import titles from '#/strings.json';
import { ClerkLoading, useClerk } from '@clerk/nextjs';
import { useSession, useUser } from '@clerk/nextjs';
import { Search, Grid3x3, Bell, ChevronDown } from 'lucide-react';
import TaskBar from './task-bar';
import Image from 'next/image';
import { getSecondMenu, Item, useResolveSlug } from '#/packages/core/lib/second-menu';

/**
 * Props for the GlobalNav component.
 */
interface GlobalNavProps {
  /** The current user's data */
  userData?: UserData;
  /** Subscription details passed down to the TaskBar */
  subscriptionData?: any;
}

/**
 * Props for the ProfileMenu component.
 */
interface ProfileMenuProps {
  /** Indicates if the menu is currently open */
  isOpen: boolean;
  /** Callback to toggle the open/closed state */
  onToggle: () => void;
  /** Callback to explicitly close the menu */
  onClose: () => void;
  /** Subscription data passed from the parent for the TaskBar */
  subscriptionData?: any;
}

/**
 * Props for the SearchBar component.
 */
interface SearchBarProps {
  /** Optional custom class names */
  className?: string;
}

/**
 * Props for the reusable IconButton component.
 */
interface IconButtonProps {
  /** Function to handle button clicks */
  onClick?: () => void;
  /** Accessible label for screen readers */
  'aria-label': string;
  /** The icon element to display */
  icon: React.ReactNode;
  /** Optional custom class names */
  className?: string;
}

/**
 * A reusable, rounded icon button component used in the top navigation bar.
 */
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

/**
 * A search input component with an integrated search icon.
 */
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

/**
 * Renders the user's profile image or initials.
 * Handles loading states and missing user data gracefully.
 * * @param props - Component props
 * @param props.size - The width/height of the avatar in pixels (default: 36)
 */
function ProfileAvatar({ size = 36 }: { size?: number }) {
  const { user, isLoaded: isUserLoaded } = useUser();

  if (!isUserLoaded) {
    return <div className="h-full w-full bg-gray-600 animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="h-full w-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
        U
      </div>
    );
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

  const initial = user?.firstName?.[0] || 
                 user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 
                 'U';
  return (
    <div className="h-full w-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
      {initial}
    </div>
  );
}

/**
 * The internal content of the Profile Menu.
 * Displays user details, the TaskBar, and the Sign Out button.
 */
function ProfileMenuContent({ subscriptionData, onClose }: { subscriptionData?: any; onClose: () => void }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();

  /**
   * Handles the sign-out process.
   * Closes the menu immediately to prevent UI flicker, then triggers Clerk sign-out.
   */
  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    <div className="p-4 pointer-events-auto">
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
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

/**
 * The main Profile Menu trigger and dropdown container.
 * Uses an invisible backdrop to handle 'click outside' logic reliably.
 */
function ProfileMenu({ isOpen, onToggle, onClose, subscriptionData }: ProfileMenuProps) {
  const { session, isLoaded } = useSession();

  // We no longer need the useEffect document listener!
  // The Backdrop div handles the closing logic now.

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
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        className="flex items-center gap-x-1 h-9 px-1 rounded-lg hover:bg-gray-800 transition-colors z-[101] relative"
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
        <>
          {/* INVISIBLE BACKDROP 
            This fixed div covers the entire screen behind the modal.
            Clicking it triggers onClose. 
          */}
          <div 
            className="fixed inset-0 z-[90] cursor-default" 
            onClick={onClose}
          />

          {/* MODAL CONTENT
            Z-Index [100] ensures it sits ON TOP of the backdrop [90].
            We stop propagation just in case, but the backdrop naturally isolates it.
          */}
          <div 
            className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-700 bg-gray-900 shadow-lg z-[100] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ProfileMenuContent subscriptionData={subscriptionData} onClose={onClose} />
          </div>
        </>
      )}
    </div>
  );
}
/**
 * Renders the side navigation menu containing categories and links.
 */
function NavigationMenu({ 
  menu, 
  onClose, 
  resolveSlug 
}: { 
  /** The menu structure to render */
  menu: ReturnType<typeof getSecondMenu>;
  /** Callback to close the mobile menu on selection */
  onClose: () => void;
  /** Helper to resolve item slugs to URLs */
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

/**
 * The main Global Navigation component.
 * Manages the top bar, sidebar (on desktop), and mobile drawer.
 */
export function GlobalNav({ userData, subscriptionData }: GlobalNavProps): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
   
  // Use admin status from server-side userData
  const isAdmin = userData?.isAdmin ?? false;
  
  console.log('[GlobalNav] userData:', userData, 'isAdmin:', isAdmin);
  
  const secondMenu = getSecondMenu(userData?.userID || '', isAdmin);
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

/**
 * A single navigation item link.
 * Handles active state styling based on the current URL segment.
 */
function GlobalNavItem({
  item,
  close,
  resolveSlug,
}: {
  /** The navigation item data */
  item: Item;
  /** Callback to close the menu (used for mobile) */
  close: () => false | void;
  /** Helper function to generate the item's HREF */
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