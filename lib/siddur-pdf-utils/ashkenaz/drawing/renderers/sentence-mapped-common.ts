import { rgb } from 'pdf-lib';
import siddurConfig from '../../siddur-formatting-config.json';
import { toSubscript, toSuperscript } from '../helpers/sentence-mapping';

/**
 * Represents a segment of an underline for bracket notation.
 */
export interface UnderlineSegment {
  /** Starting X coordinate of the segment */
  startX: number;
  /** Ending X coordinate of the segment */
  endX: number;
  /** Y coordinate of the segment */
  y: number;
  /** Whether this is the first segment in a series */
  isFirst: boolean;
  /** Whether this is the last segment in a series */
  isLast: boolean;
}

/**
 * Tracks the current position and column boundaries for text rendering.
 */
export interface ColumnPositionState {
  /** Current X coordinate */
  x: number;
  /** Current Y coordinate */
  y: number;
  /** Starting X coordinate of the column */
  columnStart: number;
  /** Ending X coordinate of the column */
  columnEnd: number;
}

/**
 * Core rendering context with PDF document references.
 */
export interface RenderContext {
  /** PDF page object */
  page: any;
  /** Font objects for different scripts */
  fonts: any;
  /** PDF document object */
  pdfDoc: any;
  /** Page height */
  height: number;
  /** Page margin */
  margin: number;
}

/**
 * Context for processing a sentence in two-column layout.
 */
export interface SentenceProcessingContext {
  page: any;
  fonts: any;
  pdfDoc: any;
  height: number;
  margin: number;
  englishFontSize: number;
  englishLineHeight: number;
  hebrewFontSize: number;
  hebrewLineHeight: number;
  showSubscripts: boolean;
}

/**
 * Context for processing a sentence in three-column layout.
 */
export interface ThreeColumnSentenceProcessingContext
  extends SentenceProcessingContext {
  translitFontSize: number;
  translitLineHeight: number;
}

/**
 * State for two-column sentence processing.
 */
export interface SentenceState {
  currentEnglishX: number;
  englishY: number;
  currentHebrewX: number;
  hebrewY: number;
  page: any;
}

/**
 * State for three-column sentence processing.
 */
export interface ThreeColumnState extends SentenceState {
  currentTranslitX: number;
  translitY: number;
}

/**
 * Checks if a page break is needed for two-column layout and handles it.
 * @param context - Rendering context
 * @param state - Current position state
 * @param layout - Layout boundaries
 */
export const checkPageBreak = (
  context: SentenceProcessingContext,
  state: SentenceState,
  layout: {
    englishColumnStart: number;
    englishColumnEnd: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
) => {
  if (
    state.englishY < siddurConfig.pdfMargins.bottom ||
    state.hebrewY < siddurConfig.pdfMargins.bottom
  ) {
    state.page = context.pdfDoc.addPage();
    const topY = context.height - siddurConfig.pdfMargins.top;
    state.englishY = topY;
    state.hebrewY = topY;
    state.currentEnglishX = layout.englishColumnStart;
    state.currentHebrewX = layout.hebrewColumnEnd;
  }
};

/**
 * Checks if a page break is needed for three-column layout and handles it.
 * @param context - Rendering context
 * @param state - Current position state
 * @param layout - Layout boundaries
 */
export const checkPageBreakThreeColumn = (
  context: ThreeColumnSentenceProcessingContext,
  state: ThreeColumnState,
  layout: {
    englishColumnStart: number;
    transliterationColumnStart: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
) => {
  if (
    state.englishY < siddurConfig.pdfMargins.bottom ||
    state.translitY < siddurConfig.pdfMargins.bottom ||
    state.hebrewY < siddurConfig.pdfMargins.bottom
  ) {
    state.page = context.pdfDoc.addPage();
    const topY = context.height - siddurConfig.pdfMargins.top;
    state.englishY = topY;
    state.translitY = topY;
    state.hebrewY = topY;
    state.currentEnglishX = layout.englishColumnStart;
    state.currentTranslitX = layout.transliterationColumnStart;
    state.currentHebrewX = layout.hebrewColumnEnd;
  }
};

/**
 * Draws bracket-style underlines for phrase segments.
 * @param page - PDF page object
 * @param segments - Array of underline segments to draw
 * @param color - Color of the underlines
 */
export const drawBracketUnderlines = (
  page: any,
  segments: UnderlineSegment[],
  color: any,
) => {
  const tickHeight = 3.36; // 3 * 1.12
  segments.forEach((seg) => {
    const underlineY = seg.y - 2;
    // Horizontal line
    page.drawLine({
      start: { x: seg.startX, y: underlineY },
      end: { x: seg.endX, y: underlineY },
      thickness: 1,
      color,
    });
    // Start tick (only if this is the first segment)
    if (seg.isFirst) {
      page.drawLine({
        start: { x: seg.startX, y: underlineY },
        end: { x: seg.startX, y: underlineY + tickHeight },
        thickness: 1,
        color,
      });
    }
    // End tick (only if this is the last segment)
    if (seg.isLast) {
      page.drawLine({
        start: { x: seg.endX, y: underlineY },
        end: { x: seg.endX, y: underlineY + tickHeight },
        thickness: 1,
        color,
      });
    }
  });
};

/**
 * Draws Hebrew line notation showing sentence and phrase indices.
 * @param page - PDF page object
 * @param lineIndices - Map of Y coordinates to phrase indices
 * @param sentenceNum - Current sentence number
 * @param x - X coordinate for the notation
 * @param fonts - Font objects
 * @param fontSize - Base font size
 */
export const drawHebrewLineNotation = (
  page: any,
  lineIndices: Map<number, number[]>,
  sentenceNum: number,
  x: number,
  fonts: any,
  fontSize: number,
) => {
  const sortedYs = Array.from(lineIndices.keys()).sort((a, b) => b - a);
  sortedYs.forEach((y) => {
    const indices = lineIndices.get(y)!.sort((a, b) => a - b);
    if (indices.length === 0) return;

    const min = indices[0];
    const max = indices[indices.length - 1];
    const rangeStr =
      min === max ? toSubscript(min) : `${toSubscript(min)}-${toSubscript(max)}`;
    const notation = `ts${rangeStr}⁽${toSuperscript(sentenceNum)}⁾`;

    page.drawText(notation, {
      x,
      y: y + 2,
      font: fonts.english,
      size: fontSize * 0.6,
      color: rgb(0, 0, 0),
    });
  });
};

/**
 * Renders notation text (e.g. "ts1(2)") with proper positioning and wrapping.
 * @param context - Rendering context
 * @param positionState - Current position state
 * @param notationValue - The notation string to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated position state
 */
export const renderNotation = (
  context: RenderContext,
  positionState: ColumnPositionState,
  notationValue: string,
  fontSize: number,
  lineHeight: number,
  checkPageBreak: () => void,
): ColumnPositionState => {
  const { page, fonts } = context;
  let { x, y, columnStart, columnEnd } = positionState;
  const notationSize = fontSize * 0.6;
  const colorLetter = notationValue.charAt(0);
  const restOfNotation = notationValue.substring(1);

  const colorLetterWidth = fonts.english.widthOfTextAtSize(
    colorLetter,
    notationSize,
  );
  if (x + colorLetterWidth > columnEnd) {
    x = columnStart;
    y -= lineHeight;
    checkPageBreak();
  }
  page.drawText(colorLetter, {
    x,
    y: y - (fontSize - notationSize) * 0.5,
    font: fonts.english,
    size: notationSize,
    color: rgb(0, 0, 0),
  });
  x += colorLetterWidth;

  const restWidth = fonts.english.widthOfTextAtSize(
    restOfNotation,
    notationSize,
  );
  if (x + restWidth > columnEnd) {
    x = columnStart;
    y -= lineHeight;
    checkPageBreak();
  }
  page.drawText(restOfNotation, {
    x,
    y: y - (fontSize - notationSize) * 0.5,
    font: fonts.english,
    size: notationSize,
    color: rgb(0, 0, 0),
  });
  x += restWidth;

  return { x, y, columnStart, columnEnd };
};

/**
 * Renders an English phrase with word wrapping and underline tracking.
 * @param context - Rendering context
 * @param positionState - Current position state
 * @param text - English text to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param color - Text color
 * @param notationValue - Optional notation to render before text
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated position state
 */
export const processEnglishColumn = (
  context: RenderContext,
  positionState: ColumnPositionState,
  text: string,
  fontSize: number,
  lineHeight: number,
  color: any,
  notationValue: string | undefined,
  checkPageBreak: () => void,
): ColumnPositionState => {
  const { page, fonts } = context;
  let { x, y, columnStart, columnEnd } = positionState;
  const parts = text.split(/( )/);
  const segments: UnderlineSegment[] = [];
  let segmentStartX = x;
  let segmentY = y;
  let isFirst = true;

  // Removed local renderNotation definition

  parts.forEach((part: string) => {

    if (part === '') return;

    if (part === ' ') {
      const spaceWidth = fonts.english.widthOfTextAtSize(' ', fontSize);
      if (x + spaceWidth > columnEnd) {
        if (x > segmentStartX) {
          segments.push({
            startX: segmentStartX,
            endX: x,
            y: segmentY,
            isFirst,
            isLast: false,
          });
          isFirst = false;
        }
        x = columnStart;
        y -= lineHeight;
        checkPageBreak();
        segmentStartX = x;
        segmentY = y;
      }
      x += spaceWidth;
      return;
    }

    const wordWidth = fonts.english.widthOfTextAtSize(part, fontSize);
    if (x + wordWidth > columnEnd) {
      if (x > segmentStartX) {
        segments.push({
          startX: segmentStartX,
          endX: x,
          y: segmentY,
          isFirst,
          isLast: false,
        });
        isFirst = false;
      }
      x = columnStart;
      y -= lineHeight;
      checkPageBreak();
      segmentStartX = x;
      segmentY = y;
    }
    page.drawText(part, { x, y, font: fonts.english, size: fontSize, color });
    x += wordWidth;
  });

  if (x > segmentStartX) {
    segments.push({
      startX: segmentStartX,
      endX: x,
      y: segmentY,
      isFirst,
      isLast: true,
    });
  }

  drawBracketUnderlines(page, segments, color);

  if (notationValue) {
    const newState = renderNotation(
      context,
      { x, y, columnStart, columnEnd },
      notationValue,
      fontSize,
      lineHeight,
      checkPageBreak,
    );
    x = newState.x;
    y = newState.y;
  }

  const enSpaceWidth = fonts.english.widthOfTextAtSize(' ', fontSize);
  if (x + enSpaceWidth > columnEnd) {
    x = columnStart;
    y -= lineHeight;
    checkPageBreak();
  }
  x += enSpaceWidth;

  return { x, y, columnStart, columnEnd };
};

/**
 * Renders a Hebrew phrase with right-to-left layout, word wrapping, and line index tracking.
 * @param context - Rendering context
 * @param positionState - Current position state
 * @param text - Hebrew text to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param color - Text color
 * @param phraseIndex - Index of the current phrase
 * @param sentenceLineIndices - Map tracking which phrases appear on which lines
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated position state
 */
export const processHebrewColumn = (
  context: RenderContext,
  positionState: ColumnPositionState,
  text: string,
  fontSize: number,
  lineHeight: number,
  color: any,
  phraseIndex: number,
  sentenceLineIndices: Map<number, number[]>,
  checkPageBreak: () => void,
): ColumnPositionState => {
  const { page, fonts } = context;
  let { x, y, columnStart, columnEnd } = positionState;
  const words = text.split(/( )/).filter((w: string) => w !== '');
  const segments: UnderlineSegment[] = [];
  let segmentStartX = x;
  let segmentY = y;
  let isFirst = true;

  const trackPhraseIndex = () => {
    if (!sentenceLineIndices.has(y)) {
      sentenceLineIndices.set(y, []);
    }
    if (!sentenceLineIndices.get(y)!.includes(phraseIndex)) {
      sentenceLineIndices.get(y)!.push(phraseIndex);
    }
  };

  const hebrewWordCount =
    text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  if (hebrewWordCount > 1) {
    console.warn(
      `[SentenceMapping Warning] Hebrew phrase contains multiple words: "${text}"`,
    );
  }

  words.forEach((word: string) => {
    if (word === '') return;

    trackPhraseIndex();

    const wordWidth = fonts.hebrew.widthOfTextAtSize(word, fontSize);
    if (x - wordWidth < columnStart) {
      if (x < segmentStartX) {
        segments.push({
          startX: x,
          endX: segmentStartX,
          y: segmentY,
          isFirst,
          isLast: false,
        });
        isFirst = false;
      }
      x = columnEnd;
      y -= lineHeight;
      checkPageBreak();
      segmentStartX = x;
      segmentY = y;
      trackPhraseIndex();
    }
    x -= wordWidth;
    page.drawText(word, { x, y, font: fonts.hebrew, size: fontSize, color });
  });

  if (x < segmentStartX) {
    segments.push({
      startX: x,
      endX: segmentStartX,
      y: segmentY,
      isFirst,
      isLast: true,
    });
  }

  drawBracketUnderlines(page, segments, color);

  const heSpaceWidth = fonts.hebrew.widthOfTextAtSize(' ', fontSize);
  if (x - heSpaceWidth < columnStart) {
    x = columnEnd;
    y -= lineHeight;
    checkPageBreak();
  }
  x -= heSpaceWidth;

  return { x, y, columnStart, columnEnd };
};

/**
 * Renders a transliteration phrase with word wrapping and underline tracking.
 * @param context - Rendering context
 * @param positionState - Current position state
 * @param text - Transliteration text to render
 * @param fontSize - Font size
 * @param lineHeight - Line height
 * @param color - Text color
 * @param notationValue - Optional notation to render before text
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated position state
 */
export const processTransliterationColumn = (
  context: RenderContext,
  positionState: ColumnPositionState,
  text: string,
  fontSize: number,
  lineHeight: number,
  color: any,
  notationValue: string | undefined,
  checkPageBreak: () => void,
): ColumnPositionState => {
  const { page, fonts } = context;
  let { x, y, columnStart, columnEnd } = positionState;
  const parts = text.split(/( )/);
  const segments: UnderlineSegment[] = [];
  let segmentStartX = x;
  let segmentY = y;
  let isFirst = true;

  parts.forEach((part: string) => {
    if (part === '') return;
    if (part === ' ') {
      const spaceWidth = fonts.english.widthOfTextAtSize(' ', fontSize);
      if (x + spaceWidth > columnEnd) {
        if (x > segmentStartX) {
          segments.push({
            startX: segmentStartX,
            endX: x,
            y: segmentY,
            isFirst,
            isLast: false,
          });
          isFirst = false;
        }
        x = columnStart;
        y -= lineHeight;
        checkPageBreak();
        segmentStartX = x;
        segmentY = y;
      }
      x += spaceWidth;
      return;
    }
    const wordWidth = fonts.english.widthOfTextAtSize(part, fontSize);
    if (x + wordWidth > columnEnd) {
      if (x > segmentStartX) {
        segments.push({
          startX: segmentStartX,
          endX: x,
          y: segmentY,
          isFirst,
          isLast: false,
        });
        isFirst = false;
      }
      x = columnStart;
      y -= lineHeight;
      checkPageBreak();
      segmentStartX = x;
      segmentY = y;
    }
    page.drawText(part, { x, y, font: fonts.english, size: fontSize, color });
    x += wordWidth;
  });

  if (x > segmentStartX) {
    segments.push({
      startX: segmentStartX,
      endX: x,
      y: segmentY,
      isFirst,
      isLast: true,
    });
  }

  drawBracketUnderlines(page, segments, color);

  if (notationValue) {
    const newState = renderNotation(
      context,
      { x, y, columnStart, columnEnd },
      notationValue,
      fontSize,
      lineHeight,
      checkPageBreak,
    );
    x = newState.x;
    y = newState.y;
  }

  const spaceWidth = fonts.hebrew.widthOfTextAtSize(' ', fontSize);
  if (x - spaceWidth < columnStart) {
    x = columnEnd;
    y -= lineHeight;
    checkPageBreak();
  }
  x -= spaceWidth;

  return { x, y, columnStart, columnEnd };
};

/**
 * Processes a single phrase mapping in two-column layout (English + Hebrew).
 * @param mapping - Phrase mapping data
 * @param phraseIndex - Index of the current phrase
 * @param displaySentenceNum - Display number for the sentence
 * @param context - Rendering context with all formatting parameters
 * @param state - Current position state for both columns
 * @param sentenceLineIndices - Map tracking phrase positions
 * @param color - Color for rendering
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated positions for both columns
 */
export const processPhraseMapping = (
  mapping: any,
  phraseIndex: number,
  displaySentenceNum: number,
  context: SentenceProcessingContext & {
    englishColumnStart: number;
    englishColumnEnd: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
  state: {
    currentEnglishX: number;
    englishY: number;
    currentHebrewX: number;
    hebrewY: number;
  },
  sentenceLineIndices: Map<number, number[]>,
  color: any,
  checkPageBreak: () => void,
): { englishX: number; englishY: number; hebrewX: number; hebrewY: number } => {
  const renderContext = { page: context.page, fonts: context.fonts, pdfDoc: context.pdfDoc, height: context.height, margin: context.margin };
  
  const notationValue =
    context.showSubscripts && phraseIndex
      ? `ts${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
      : undefined;
  const englishNotation = phraseIndex === 1 ? notationValue : undefined;

  // English rendering
  const englishState = processEnglishColumn(
    renderContext,
    { x: state.currentEnglishX, y: state.englishY, columnStart: context.englishColumnStart, columnEnd: context.englishColumnEnd },
    mapping.english,
    context.englishFontSize,
    context.englishLineHeight,
    color,
    englishNotation,
    checkPageBreak,
  );

  // Hebrew rendering
  const hebrewState = processHebrewColumn(
    renderContext,
    { x: state.currentHebrewX, y: state.hebrewY, columnStart: context.hebrewColumnStart, columnEnd: context.hebrewColumnEnd },
    mapping.hebrew,
    context.hebrewFontSize,
    context.hebrewLineHeight,
    color,
    phraseIndex,
    sentenceLineIndices,
    checkPageBreak,
  );

  return { englishX: englishState.x, englishY: englishState.y, hebrewX: hebrewState.x, hebrewY: hebrewState.y };
};

/**
 * Processes a single phrase mapping in three-column layout (English + Transliteration + Hebrew).
 * @param mapping - Phrase mapping data
 * @param phraseIndex - Index of the current phrase
 * @param displaySentenceNum - Display number for the sentence
 * @param context - Rendering context with all formatting parameters
 * @param state - Current position state for all three columns
 * @param sentenceLineIndices - Map tracking phrase positions
 * @param color - Color for rendering
 * @param checkPageBreak - Callback to check if page break is needed
 * @returns Updated positions for all three columns
 */
export const processPhraseMappingThreeColumn = (
  mapping: any,
  phraseIndex: number,
  displaySentenceNum: number,
  context: ThreeColumnSentenceProcessingContext & {
    englishColumnStart: number;
    transliterationColumnStart: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
    columnWidth: number;
  },
  state: {
    currentEnglishX: number;
    englishY: number;
    currentTranslitX: number;
    translitY: number;
    currentHebrewX: number;
    hebrewY: number;
  },
  sentenceLineIndices: Map<number, number[]>,
  color: any,
  checkPageBreak: () => void,
): { englishX: number; englishY: number; translitX: number; translitY: number; hebrewX: number; hebrewY: number } => {
  const renderContext = { page: context.page, fonts: context.fonts, pdfDoc: context.pdfDoc, height: context.height, margin: context.margin };
  
  const notationValue =
    context.showSubscripts && phraseIndex
      ? `ts${toSubscript(phraseIndex)}⁽${toSuperscript(displaySentenceNum)}⁾`
      : undefined;
  const englishNotation = phraseIndex === 1 ? notationValue : undefined;

  const englishColumnEnd = context.englishColumnStart + context.columnWidth;
  const translitColumnEnd = context.transliterationColumnStart + context.columnWidth;

  // English rendering
  const englishState = processEnglishColumn(
    renderContext,
    { x: state.currentEnglishX, y: state.englishY, columnStart: context.englishColumnStart, columnEnd: englishColumnEnd },
    mapping.english,
    context.englishFontSize,
    context.englishLineHeight,
    color,
    englishNotation,
    checkPageBreak,
  );

  // Transliteration rendering
  const translitText = mapping.transliteration || mapping.Transliteration || '';
  const translitState = processTransliterationColumn(
    renderContext,
    { x: state.currentTranslitX, y: state.translitY, columnStart: context.transliterationColumnStart, columnEnd: translitColumnEnd },
    translitText,
    context.translitFontSize,
    context.translitLineHeight,
    color,
    notationValue,
    checkPageBreak,
  );

  // Hebrew rendering
  const hebrewState = processHebrewColumn(
    renderContext,
    { x: state.currentHebrewX, y: state.hebrewY, columnStart: context.hebrewColumnStart, columnEnd: context.hebrewColumnEnd },
    mapping.hebrew,
    context.hebrewFontSize,
    context.hebrewLineHeight,
    color,
    phraseIndex,
    sentenceLineIndices,
    checkPageBreak,
  );

  return {
    englishX: englishState.x,
    englishY: englishState.y,
    translitX: translitState.x,
    translitY: translitState.y,
    hebrewX: hebrewState.x,
    hebrewY: hebrewState.y
  };
};

/**
 * Retrieves the mapped colors for word mapping from the configuration.
 * @returns An array of objects containing the ID and RGB color for each mapping.
 */
export const getMappedColors = () => {
  return Object.entries(siddurConfig.colors.wordMappingColors).map(
    ([key, value]) => ({
      id: key.charAt(0),
      color: rgb(value[0], value[1], value[2]),
    }),
  );
};

/**
 * Processes and draws a single sentence for the two-column layout.
 * @param context - The PDF drawing context.
 * @param sentenceNum - The index of the sentence being processed.
 * @param phrases - The list of phrases in the sentence.
 * @param mappedColors - The list of colors to use for mapping.
 * @param layout - Layout configuration including column boundaries.
 * @param state - Current drawing state (positions).
 * @param transformColor - Callback to transform the color (e.g. to grayscale).
 * @returns The updated drawing state.
 */
export const processSentence = (
  context: SentenceProcessingContext,
  sentenceNum: number,
  phrases: { mapping: any; phraseIndex: number }[],
  mappedColors: { id: string; color: any }[],
  layout: {
    englishColumnStart: number;
    englishColumnEnd: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
  },
  state: SentenceState,
  transformColor: (color: any) => any,
): SentenceState => {
  const displaySentenceNum = sentenceNum + 1;
  const sentenceLineIndices = new Map<number, number[]>();
  let colorIndex = 0;

  const phraseContext = {
    ...context,
    englishColumnStart: layout.englishColumnStart,
    englishColumnEnd: layout.englishColumnEnd,
    hebrewColumnStart: layout.hebrewColumnStart,
    hebrewColumnEnd: layout.hebrewColumnEnd,
  };

  phrases.forEach(({ mapping, phraseIndex }) => {
    const colorData = mappedColors[colorIndex % mappedColors.length];
    const color = transformColor(colorData.color);
    colorIndex++;

    const checkAndHandlePageBreak = () => {
      checkPageBreak(context, state, layout);
    };

    phraseContext.page = state.page;

    const result = processPhraseMapping(
      mapping,
      phraseIndex,
      displaySentenceNum,
      phraseContext,
      {
        currentEnglishX: state.currentEnglishX,
        englishY: state.englishY,
        currentHebrewX: state.currentHebrewX,
        hebrewY: state.hebrewY,
      },
      sentenceLineIndices,
      color,
      checkAndHandlePageBreak,
    );

    state.currentEnglishX = result.englishX;
    state.englishY = result.englishY;
    state.currentHebrewX = result.hebrewX;
    state.hebrewY = result.hebrewY;
  });

  // Draw side notation for this sentence
  if (context.showSubscripts) {
    drawHebrewLineNotation(
      state.page,
      sentenceLineIndices,
      displaySentenceNum,
      layout.hebrewColumnEnd + 5,
      context.fonts,
      context.englishFontSize,
    );
  }

  return state;
};

/**
 * Processes and draws a single sentence for the three-column layout.
 * @param context - The PDF drawing context.
 * @param sentenceNum - The index of the sentence being processed.
 * @param phrases - The list of phrases in the sentence.
 * @param mappedColors - The list of colors to use for mapping.
 * @param layout - Layout configuration including column boundaries.
 * @param state - Current drawing state (positions).
 * @param transformColor - Callback to transform the color (e.g. to grayscale).
 * @returns The updated drawing state.
 */
export const processSentenceThreeColumn = (
  context: ThreeColumnSentenceProcessingContext,
  sentenceNum: number,
  phrases: { mapping: any; phraseIndex: number }[],
  mappedColors: { id: string; color: any }[],
  layout: {
    englishColumnStart: number;
    transliterationColumnStart: number;
    hebrewColumnStart: number;
    hebrewColumnEnd: number;
    columnWidth: number;
  },
  state: ThreeColumnState,
  transformColor: (color: any) => any,
): ThreeColumnState => {
  const displaySentenceNum = sentenceNum + 1;
  const sentenceLineIndices = new Map<number, number[]>();
  let colorIndex = 0;

  const phraseContext = {
    ...context,
    englishColumnStart: layout.englishColumnStart,
    transliterationColumnStart: layout.transliterationColumnStart,
    hebrewColumnStart: layout.hebrewColumnStart,
    hebrewColumnEnd: layout.hebrewColumnEnd,
    columnWidth: layout.columnWidth,
  };

  phrases.forEach(({ mapping, phraseIndex }) => {
    const colorData = mappedColors[colorIndex % mappedColors.length];
    const color = transformColor(colorData.color);
    colorIndex++;

    const checkAndHandlePageBreak = () => {
      checkPageBreakThreeColumn(context, state, layout);
    };

    phraseContext.page = state.page;

    const result = processPhraseMappingThreeColumn(
      mapping,
      phraseIndex,
      displaySentenceNum,
      phraseContext,
      {
        currentEnglishX: state.currentEnglishX,
        englishY: state.englishY,
        currentTranslitX: state.currentTranslitX,
        translitY: state.translitY,
        currentHebrewX: state.currentHebrewX,
        hebrewY: state.hebrewY,
      },
      sentenceLineIndices,
      color,
      checkAndHandlePageBreak,
    );

    state.currentEnglishX = result.englishX;
    state.englishY = result.englishY;
    state.currentTranslitX = result.translitX;
    state.translitY = result.translitY;
    state.currentHebrewX = result.hebrewX;
    state.hebrewY = result.hebrewY;
  });

  // Draw side notation for this sentence
  if (context.showSubscripts) {
    drawHebrewLineNotation(
      state.page,
      sentenceLineIndices,
      displaySentenceNum,
      layout.hebrewColumnEnd + 5,
      context.fonts,
      context.englishFontSize,
    );
  }

  return state;
};
