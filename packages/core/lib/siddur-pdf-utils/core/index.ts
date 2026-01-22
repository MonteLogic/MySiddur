/**
 * @file Barrel export for core PDF utilities.
 */
export { SiddurDocument } from './siddur-document';
export { loadFonts, clearFontCache } from './font-loader';
export { calculateTextLines, ensureSpaceAndDraw } from './text-utils';
export type {
  FontSet,
  DocumentOptions,
  PageState,
  TextLine,
  StyledTextLine,
  DrawResult,
  SiddurConfig,
} from './types';
