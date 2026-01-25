# @siddur/network

Network utilities, API functions, and HTTP helpers for the MySiddur application.

## Overview

This package contains network-related utilities and API helper functions used throughout the MySiddur application.

## Features

- API utility functions
- Network request helpers
- Response formatting utilities
- Error handling for network operations

## Installation & Usage

### Importing from the Network Package

```typescript
import * from '@siddur/network';
```

## Directory Structure

```
packages/network/
├── network-fns/
│   └── [network utilities]
├── index.ts                        # Main exports
└── package.json
```

## Common Functions

Check the `network-fns` directory for available utility functions and their documentation.

## Development

### Type Checking
```bash
pnpm run type-check
```

### Building
```bash
pnpm run build
```

## Error Handling

All network functions should include proper error handling and type safety:

```typescript
try {
  const result = await someNetworkFunction();
  // Handle success
} catch (error) {
  // Handle error appropriately
}
```

## Contributing

When adding network utilities:

1. Keep functions focused on specific network concerns
2. Include proper TypeScript types
3. Add error handling and validation
4. Create tests for new functions
5. Document function signatures and return types
6. Update this README with usage examples

## Best Practices

- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Implement request/response validation
- Handle timeouts and network errors gracefully
- Use environment variables for API endpoints
- Implement proper logging for debugging
- Cache responses where appropriate
