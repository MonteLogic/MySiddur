# @siddur/core

Core business logic, PDF generation, and Siddur utilities for the MySiddur application.

## Overview

This package contains the fundamental components for generating, validating, and managing Siddur PDFs. It serves as the backbone of the entire application.

## Exports

### Main Exports
- `generateAndUploadSiddurLogic(token?, options?)` - Main function to generate and upload Siddur PDFs
- `SiddurFormat` - Enum for different Siddur formats (NusachAshkenaz, etc.)
- `GenerationResult` - Interface for PDF generation results
- `SiddurHistoryItem` - Interface for generation history tracking

### Sub-packages

#### PDF Generation (`./generation`)
```typescript
import { generateAndUploadSiddurLogic } from '@siddur/core/generation';

const result = await generateAndUploadSiddurLogic(token, {
  printBlackAndWhite: true,
  style: 'Recommended'
});
```

#### PDF Utilities (`./pdf`)
```typescript
import { generateSiddurPDF, SiddurFormat } from '@siddur/core/pdf';
```

#### Calendar (`./calendar`)
```typescript
import * from '@siddur/core/calendar';
```

#### Validation (`./validation`)
```typescript
import { validatePdfWhitespace } from '@siddur/core/validation';
```

#### Custom Date Generation (`./custom-date-gen`)
```typescript
import * from '@siddur/core/custom-date-gen';
```

#### Utilities (`./utils`)
```typescript
import * from '@siddur/core/utils';
```

## Usage in Applications

### From Next.js Routes
```typescript
import { generateAndUploadSiddurLogic } from '@siddur/core/generation';

export async function GET(request: NextRequest) {
  const result = await generateAndUploadSiddurLogic(undefined, {
    printBlackAndWhite: false
  });
  
  return NextResponse.json(result);
}
```

### From Server Actions
```typescript
import { generateAndUploadSiddurLogic } from '@siddur/core/generation';

export async function triggerGeneration() {
  const result = await generateAndUploadSiddurLogic();
  return result;
}
```

### From Scripts
```typescript
import { generateAndUploadSiddurLogic } from '@siddur/core/generation';

const result = await generateAndUploadSiddurLogic();
console.log('Generated:', result.url);
```

## Configuration

### Environment Variables
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token for uploading PDFs
- `my_siddur_1_READ_WRITE_TOKEN` - Fallback Vercel Blob token

## Dependencies

- `pdf-lib` - PDF manipulation library
- `@pdf-lib/fontkit` - Font support for PDF generation
- `@vercel/blob` - File storage and serving

## Directory Structure

```
packages/core/
├── lib/
│   ├── siddur-generation.ts       # Main generation logic
│   ├── siddur-pdf-utils/          # PDF drawing and layout
│   │   └── ashkenaz/
│   │       ├── siddurMainFile.ts
│   │       └── drawing/
│   ├── calendar/                   # Calendar utilities
│   ├── custom-siddur-date-gen/    # Date generation logic
│   ├── pdf-validation.ts          # PDF validation logic
│   ├── utils.ts                    # Shared utilities
│   ├── clerk-metadata-service.ts  # Clerk integration
│   ├── functions.ts               # Helper functions
│   └── index.ts                   # Main exports
└── package.json
```

## Type Definitions

All TypeScript types are defined within the respective modules. Key interfaces:

```typescript
interface GenerationResult {
  success: boolean;
  url?: string;
  error?: string;
  validationErrors?: string[];
}

interface SiddurHistoryItem {
  date: string;
  url: string;
  timestamp: string;
  status: 'success' | 'failed';
  error?: string;
  layout?: string;
  colorScheme?: string;
}
```

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

When adding new utilities or functions to this package:

1. Create the implementation in the appropriate module
2. Export it from the module's `index.ts`
3. Re-export from the main `lib/index.ts` if it's part of the public API
4. Update this README with usage examples
5. Add TypeScript types for all public exports

## Notes

- This package handles server-side PDF generation and is not meant for client-side usage
- All async operations should properly handle errors and cleanup (temp files, etc.)
- PDF validation is crucial for production deployments
