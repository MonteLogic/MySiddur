# MySiddur Packages

This directory contains the internal package modules for the MySiddur monorepo, following a structure similar to production monorepos like cal.com.

## Package Structure

### @siddur/core
Core business logic, PDF generation, and Siddur utilities.
- PDF generation and validation
- Siddur format management
- Calendar integration
- Storage and upload functionality

**Location**: `packages/core/`  
**Main Entry**: `packages/core/lib/index.ts`

### @siddur/prayer
Prayer data structures and utilities for Hebrew liturgy.
- Prayer data management
- Prayer metadata
- Prayer search utilities

**Location**: `packages/prayer/`  
**Main Entry**: `packages/prayer/index.ts`

### @siddur/network
Network utilities and API helper functions.
- API utilities
- HTTP request helpers
- Response formatting

**Location**: `packages/network/`  
**Main Entry**: `packages/network/index.ts`

### @siddur/ui
Reusable React UI components.
- Layout and navigation components
- Common UI elements
- Product and e-commerce components
- Blog components
- Clerk authentication components

**Location**: `packages/ui/`  
**Main Entry**: `packages/ui/index.ts`

### @siddur/scripts
Build and development scripts.
- PDF generation scripts
- Data processing scripts
- Layout generation

**Location**: `packages/scripts/`

## Usage

### In Next.js App (Main Application)

```typescript
// Using path aliases from tsconfig.json
import { generateAndUploadSiddurLogic } from '@siddur/core/generation';
import { Button, Modal } from '@siddur/ui';
```

### In Scripts

```typescript
import { generateAndUploadSiddurLogic } from '@siddur/core/generation';
```

## Path Aliases

The following TypeScript path aliases are configured in `tsconfig.json`:

```json
{
  "@siddur/core": "./packages/core/lib/index.ts",
  "@siddur/core/*": "./packages/core/lib/*",
  "@siddur/prayer": "./packages/prayer/index.ts",
  "@siddur/prayer/*": "./packages/prayer/*",
  "@siddur/network": "./packages/network/index.ts",
  "@siddur/network/*": "./packages/network/*",
  "@siddur/ui": "./packages/ui/index.ts",
  "@siddur/ui/*": "./packages/ui/*",
  "@siddur/scripts": "./packages/scripts/index.ts",
  "@siddur/scripts/*": "./packages/scripts/*"
}
```

## pnpm Workspace Configuration

Packages are configured as a pnpm workspace in `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - '.'  # The Next.js app itself
```

## Package.json Structure

Each package includes:

```json
{
  "name": "@siddur/<package-name>",
  "version": "1.0.0",
  "description": "...",
  "private": true,
  "type": "module",
  "main": "./lib/index.ts",
  "exports": {
    ".": "./lib/index.ts",
    "./<submodule>": "./lib/<submodule>/index.ts"
  },
  "files": ["lib"],
  "scripts": {
    "build": "tsc --noEmit",
    "type-check": "tsc --noEmit"
  }
}
```

## Development Workflow

### Type Checking All Packages
```bash
pnpm run type-check
```

### Building All Packages
```bash
pnpm run build
```

### Running Development Server
```bash
pnpm run dev
```

## Adding a New Package

To add a new internal package:

1. Create a directory under `packages/`
2. Add a `package.json` with proper exports
3. Create an `index.ts` entry point
4. Add TypeScript path aliases to `tsconfig.json`
5. Create a `README.md` with documentation
6. Update this file with the new package information

### Example: Adding @siddur/newpkg

```bash
# Create directory
mkdir packages/newpkg

# Create package.json
cat > packages/newpkg/package.json << 'EOF'
{
  "name": "@siddur/newpkg",
  "version": "1.0.0",
  "private": true,
  "main": "./index.ts",
  "exports": { ".": "./index.ts" }
}
EOF

# Create entry point
touch packages/newpkg/index.ts
```

## Best Practices

### Package Independence
- Packages should be largely self-contained
- Minimize circular dependencies
- Use clear public APIs via exports

### Type Safety
- All packages are TypeScript
- Export types and interfaces
- Use strict TypeScript configuration

### Documentation
- Each package includes a detailed README.md
- Document public APIs with examples
- Include usage patterns and best practices

### Testing
- Add unit tests for package utilities
- Place tests near source files or in __tests__ directory
- Run tests as part of CI/CD

## Migration from Direct App Imports

### Old Pattern (Anti-pattern)
```typescript
import { generateAndUploadSiddurLogic } from '@/lib/siddur-generation';
import { Button } from '@/packages/ui/button';
```

### New Pattern (Recommended)
```typescript
import { generateAndUploadSiddurLogic } from '@siddur/core/generation';
import { Button } from '@siddur/ui';
```

## Monorepo Benefits

Organizing code into packages provides:

- **Clear separation of concerns** - Each package has a specific responsibility
- **Dependency management** - Each package declares its dependencies
- **Type safety** - Explicit package exports with TypeScript
- **Scalability** - Easy to add new packages or features
- **Reusability** - Packages can be referenced from multiple places
- **Maintainability** - Clear boundaries and interfaces

## References

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [cal.com Monorepo Structure](https://github.com/calcom/cal.com)
- [TypeScript Monorepo Patterns](https://www.typescriptlang.org/docs/handbook/project-references.html)
