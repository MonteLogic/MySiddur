/**
 * @file This file re-exports the core type definitions used for generating the Siddur PDF.
 * These types have been moved to @mysiddur/types.
 * @packageDocumentation
 */

export type {
  PdfDrawingContext,
  LineInfo,
  AshkenazContentGenerationParams,
  WordMapping,
  BasePrayer,
  SimplePrayer,
  BlessingsPrayer,
  PartsPrayer,
} from '@mysiddur/types';

import { PdfPrayer } from '@mysiddur/types';

/**
 * A union type representing any possible prayer structure that can be drawn.
 * @deprecated Use PdfPrayer from @mysiddur/types instead to avoid naming conflict with data model Prayer.
 */
export type Prayer = PdfPrayer;
