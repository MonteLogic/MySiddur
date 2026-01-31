# @siddur/ui

Reusable React UI components for the MySiddur application.

## Overview

This package contains all shared React components used across the MySiddur application. Components are organized by category and designed to be composable and reusable.

## Component Categories

### Layout & Navigation
- `GlobalNav` - Main navigation component
- `Header` - Page header component
- `Footer` - Page footer component
- `MobileNavToggle` - Mobile navigation toggle button

### Common Components
- `Button` - Base button component
- `Boundary` - React error boundary wrapper
- `DropDown` - Dropdown menu component
- `TabGroup` - Tab navigation component
- `Modal` - Modal dialog component

### Product & E-commerce
- `ProductRating` - Product rating display
- `ProductLowStockWarning` - Low stock warning badge
- `PaymentStatus` - Payment status indicator
- `UpgradePrompt` - Subscription upgrade prompt

### Interactive Components
- `ImageSlider` - Image carousel component
- `ConfirmingButton` - Button with confirmation state
- `StripeSubscriptionSection` - Stripe subscription management UI
- `FAQAccordion` - Expandable FAQ section

### Skeleton & Loading
- `RenderingPageSkeleton` - Page loading skeleton
- `SkeletonCard` - Card loading skeleton

### Blog Components
- `WarningBox` - Warning callout for blog posts
- `TipBox` - Tip/note callout for blog posts
- `InfoBox` - Info callout for blog posts

### Clerk Integration
- Clerk authentication components
- User profile components
- Organization management components

### Utility Components
- `Ping` - Status indicator component
- `CBudLogo` - CBUD branding logo
- `VercelLogo` - Vercel logo

## Installation & Usage

### Installation
This package is part of the MySiddur monorepo. Components are automatically available through the workspace.

### Importing Components

#### Individual Component Import
```typescript
import { Button } from '@siddur/ui';

export default function MyComponent() {
  return <Button>Click me</Button>;
}
```

#### Namespace Import
```typescript
import * as UI from '@siddur/ui';

export default function MyComponent() {
  return <UI.Button>Click me</UI.Button>;
}
```

### Example Usage

```typescript
import { Button, Modal, TabGroup } from '@siddur/ui';
import { useState } from 'react';

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2>Modal Title</h2>
        <p>Modal content goes here</p>
      </Modal>

      <TabGroup>
        <tab label="Tab 1">Content 1</tab>
        <tab label="Tab 2">Content 2</tab>
      </TabGroup>
    </div>
  );
}
```

## Dependencies

- `react` - ^19.0.0
- `react-dom` - ^19.0.0
- `clsx` - ^2.1.0 - Conditional className utility
- `@headlessui/react` - 1.7.17 - Unstyled accessible components
- `@heroicons/react` - 1.0.6 - Heroicon SVG components

## Directory Structure

```
packages/ui/
├── *.tsx                           # Individual component files
├── blog-components/
│   ├── warning-box.tsx
│   ├── tip-box.tsx
│   ├── info-box.tsx
│   └── index.ts
├── clerk/
│   ├── index.ts
│   └── [clerk-related components]
├── data/
│   └── [data files for components]
├── __tests__/
│   └── [component tests]
├── index.ts                        # Main exports
└── package.json
```

## Styling

Components are built with Tailwind CSS and styled-components. All components accept standard HTML props and additional className/style props for customization.

### Tailwind Configuration
Components use the project's main Tailwind configuration located at the root `tailwind.config.ts`.

## Component Development Guide

### Creating a New Component

1. Create a new `.tsx` file in the root or appropriate subdirectory
2. Export the component as the default export
3. Add the component to `index.ts`
4. Add usage documentation to this README
5. Create tests in `__tests__/`

### Example Component Template
```typescript
'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface MyComponentProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function MyComponent({
  children,
  variant = 'primary',
  className,
}: MyComponentProps) {
  return (
    <div
      className={clsx(
        'rounded-lg p-4',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        className,
      )}
    >
      {children}
    </div>
  );
}
```

### Component Best Practices

- Use TypeScript interfaces for props
- Accept standard HTML element props via `{...rest}`
- Use `clsx` for conditional className management
- Mark client components with `'use client'` directive
- Keep components focused on a single responsibility
- Export prop interfaces for external type usage
- Use memoization for performance-critical components

## Testing

Components should have corresponding test files in `__tests__/`.

```bash
pnpm run test
```

## Type Definitions

All components are fully typed with TypeScript. Export component prop types for consumers:

```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}
```

## Contributing

When adding new components:

1. Follow the component template and best practices
2. Add TypeScript types for all props
3. Create tests for the component
4. Update this README with component documentation and examples
5. Ensure components work with both dark and light themes
6. Test responsive behavior on mobile, tablet, and desktop

## Breaking Changes

This package maintains semantic versioning. Major version bumps indicate breaking changes that may require updates in consuming applications.
