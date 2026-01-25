# @siddur/prayer

Prayer data structures, utilities, and management for the MySiddur application.

## Overview

This package contains all prayer-related data structures, types, and utilities for managing Hebrew prayers and liturgy.

## Features

- Prayer data structure definitions
- Prayer management utilities
- Prayer search and filtering
- Prayer metadata handling

## Installation & Usage

### Importing from the Prayer Package

```typescript
import * from '@siddur/prayer';
```

## Directory Structure

```
packages/prayer/
├── prayer/
│   └── [prayer data and utilities]
├── prayer-data-private/
│   └── [private prayer data]
├── index.ts                        # Main exports
└── package.json
```

## Types & Interfaces

Prayer package exports prayer-related interfaces and types. Check the source files for specific type definitions.

## Development

### Type Checking
```bash
pnpm run type-check
```

### Building
```bash
pnpm run build
```

## Contributing

When working with prayer data:

1. Maintain consistency with existing data structures
2. Document new prayer types and metadata fields
3. Ensure backward compatibility with existing prayer data
4. Add tests for new utilities and data transformations
5. Update this README with new features

## Notes

- Prayer data should be carefully maintained for accuracy and religious correctness
- The `prayer-data-private` directory contains sensitive or proprietary prayer data
- All prayer transformations should preserve Hebrew text integrity
