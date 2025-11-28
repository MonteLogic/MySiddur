import { rgb, PDFPage, PDFFont, Color, PDFDocument } from 'pdf-lib';

import {
  AshkenazContentGenerationParams,
  PdfDrawingContext,
  Prayer,
  WordMapping,
} from '../types';
import { drawSourceIfPresent } from '../drawing-helpers';
import siddurConfig from '../../siddur-formatting-config.json';

/**
 * Represents the state of the text flow on the page.
 */
interface FlowState {
  /** The current PDF page. */
  page: PDFPage;
  /** The current x-coordinate. */
  x: number;
  /** The current y-coordinate. */
  y: number;
}

/**
 * Context required for drawing flowing text.
 */
interface FlowContext {
  /** The PDF document. */
  pdfDoc: PDFDocument;
  /** The page height. */
  height: number;
  /** The page margin. */
  margin: number;
  /** The starting x-coordinate of the column. */
  columnStart: number;
  /** The ending x-coordinate of the column. */
  columnEnd: number;
  /** The line height for the text. */
  lineHeight: number;
  /** The font to use. */
  font: PDFFont;
  /** The font size. */
  fontSize: number;
  /** The color of the text. */
  color: Color;
  /** Whether the text is right-to-left (Hebrew). */
  isRtl?: boolean;
  /** Function to check and handle page breaks. */
  checkPageBreak: (state: FlowState) => FlowState;
}

/**
 * Extended context for drawing flowing text with an optional Y offset.
 */
interface ExtendedFlowContext extends FlowContext {
  /** Optional vertical offset for the text (e.g., for subscripts). */
  yOffset?: number;
}

/**
 * Draws text that flows within a column, handling wrapping and page breaks.
 *
 * @param state - The current flow state (page, x, y).
 * @param text - The text to draw.
 * @param context - The drawing context (font, size, bounds, etc.).
 * @returns The updated flow state.
 */
const drawFlowingTextWithOffset = (
  state: FlowState,
  text: string,
  context: ExtendedFlowContext,
): FlowState => {
  let { x, y, page } = state;
  const {
    columnStart,
    columnEnd,
    lineHeight,
    font,
    fontSize,
    color,
    isRtl,
    checkPageBreak,
    yOffset = 0,
  } = context;

  const parts = text.split(/( )/);

  parts.forEach((part) => {
    if (part === '') return;

    const width = font.widthOfTextAtSize(part, fontSize);

    let shouldWrap = false;
    if (isRtl) {
      if (x - width < columnStart) {
        shouldWrap = true;
      }
    } else {
      if (x + width > columnEnd) {
        shouldWrap = true;
      }
    }

    if (shouldWrap) {
      x = isRtl ? columnEnd : columnStart;
      y -= lineHeight;
      const newState = checkPageBreak({ page, x, y });
      page = newState.page;
      x = newState.x;
      y = newState.y;
    }

    if (isRtl) {
      x -= width;
    }

    page.drawText(part, {
      x,
      y: y + yOffset,
      font,
      size: fontSize,
      color,
    });

    if (!isRtl) {
      x += width;
    }
  });

  return { page, x, y };
};

/**
 * Context for drawing a two-column row (English and Hebrew).
 */
interface TwoColumnContext {
  /** Fonts for English and Hebrew. */
  fonts: { english: PDFFont; hebrew: PDFFont };
  /** Font sizes for English and Hebrew. */
  sizes: { english: number; hebrew: number };
  /** Line heights for English and Hebrew. */
  lineHeights: { english: number; hebrew: number };
  /** Column bounds for English and Hebrew. */
  bounds: {
    english: { start: number; end: number };
    hebrew: { start: number; end: number };
  };
  /** The PDF document. */
  pdfDoc: PDFDocument;
  /** The page height. */
  height: number;
  /** The page margin. */
  margin: number;
  /** Function to check and handle page breaks. */
  checkPageBreak: (state: FlowState, isHebrew: boolean) => FlowState;
}

/**
 * State for a two-column row.
 */
interface TwoColumnRowState {
  /** The current PDF page. */
  page: PDFPage;
  /** State for the English column. */
  english: { x: number; y: number };
  /** State for the Hebrew column. */
  hebrew: { x: number; y: number };
}

/**
 * Draws a single row of mapped words in two columns.
 *
 * @param mapping - The word mapping data.
 * @param color - The color to use for this word/phrase.
 * @param subscriptText - Optional subscript text to display.
 * @param state - The current state of the row.
 * @param ctx - The drawing context.
 * @returns The updated state of the row.
 */
const drawTwoColumnRow = (
  mapping: WordMapping[string],
  color: Color,
  subscriptText: string | undefined,
  state: TwoColumnRowState,
  ctx: TwoColumnContext,
): TwoColumnRowState => {
  let { page, english, hebrew } = state;

  // Draw English
  let enState: FlowState = { page, x: english.x, y: english.y };
  const enContext: ExtendedFlowContext = {
    pdfDoc: ctx.pdfDoc,
    height: ctx.height,
    margin: ctx.margin,
    columnStart: ctx.bounds.english.start,
    columnEnd: ctx.bounds.english.end,
    lineHeight: ctx.lineHeights.english,
    font: ctx.fonts.english,
    fontSize: ctx.sizes.english,
    color,
    checkPageBreak: (s) => ctx.checkPageBreak(s, false),
  };

  enState = drawFlowingTextWithOffset(enState, mapping.english, enContext);

  if (subscriptText) {
    const enSubscriptSize = ctx.sizes.english * 0.6;
    enState = drawFlowingTextWithOffset(enState, subscriptText, {
      ...enContext,
      fontSize: enSubscriptSize,
      color: rgb(0, 0, 0),
      yOffset: -(ctx.sizes.english - enSubscriptSize) * 0.5,
    });
  }

  enState = drawFlowingTextWithOffset(enState, ' ', enContext);
  page = enState.page;
  english = { x: enState.x, y: enState.y };

  // Draw Hebrew
  let heState: FlowState = { page, x: hebrew.x, y: hebrew.y };
  const heContext: ExtendedFlowContext = {
    pdfDoc: ctx.pdfDoc,
    height: ctx.height,
    margin: ctx.margin,
    columnStart: ctx.bounds.hebrew.start,
    columnEnd: ctx.bounds.hebrew.end,
    lineHeight: ctx.lineHeights.hebrew,
    font: ctx.fonts.hebrew,
    fontSize: ctx.sizes.hebrew,
    color,
    isRtl: true,
    checkPageBreak: (s) => ctx.checkPageBreak(s, true),
  };

  heState = drawFlowingTextWithOffset(heState, mapping.hebrew, heContext);

  if (subscriptText) {
    const heSubscriptSize = ctx.sizes.hebrew * 0.6;
    heState = drawFlowingTextWithOffset(heState, subscriptText, {
      ...heContext,
      font: ctx.fonts.english,
      fontSize: heSubscriptSize,
      color: rgb(0, 0, 0),
      yOffset: -(ctx.sizes.hebrew - heSubscriptSize) * 0.5,
    });
  }

  heState = drawFlowingTextWithOffset(heState, ' ', heContext);
  page = heState.page;
  hebrew = { x: heState.x, y: heState.y };

  return { page, english, hebrew };
};

const createTwoColumnContext = (
  fonts: { english: PDFFont; hebrew: PDFFont },
  sizes: { english: number; hebrew: number },
  lineHeights: { english: number; hebrew: number },
  bounds: {
    english: { start: number; end: number };
    hebrew: { start: number; end: number };
  },
  pdfDoc: PDFDocument,
  height: number,
  margin: number,
  checkPageBreak: (state: FlowState, isHebrew: boolean) => FlowState,
): TwoColumnContext => ({
  fonts,
  sizes,
  lineHeights,
  bounds,
  pdfDoc,
  height,
  margin,
  checkPageBreak,
});

/**
 * Draws a prayer with word-by-word color mapping in two columns (English and Hebrew).
 *
 * @param context - The PDF drawing context.
 * @param prayer - The prayer to draw.
 * @param wordMappings - The mapping of words/phrases.
 * @param params - Generation parameters.
 * @param columnWidth - The width of the English column.
 * @returns The updated PDF drawing context.
 */
export const drawTwoColumnColorMappedPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  params: AshkenazContentGenerationParams,
  columnWidth: number,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;
  const colors = Object.values(siddurConfig.colors.wordMappingColors).map((c) =>
    rgb(c[0], c[1], c[2]),
  );

  const wordMappingInterval = params.wordMappingInterval ?? 1;
  const wordMappingStartIndex = params.wordMappingStartIndex ?? 0;
  const showSubscripts = params.showWordMappingSubscripts !== false;
  const fontSizeMultiplier = params.fontSizeMultiplier ?? 1.0;
  const printBlackAndWhite = params.printBlackAndWhite ?? false;

  const hebrewFontSize = siddurConfig.fontSizes.blessingHebrew * fontSizeMultiplier;
  const hebrewLineHeight =
    siddurConfig.lineSpacing.defaultHebrewPrayer * fontSizeMultiplier;
  const englishFontSize = siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier;
  const englishLineHeight =
    siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier;

  const hebrewColumnStart = width / 2 + siddurConfig.layout.hebrewColumnXOffset;
  const hebrewColumnEnd = width - margin;
  const englishColumnStart = margin;
  const englishColumnEnd = margin + columnWidth;

  let hebrewY = y;
  let englishY = y;
  let currentHebrewX = hebrewColumnEnd;
  let currentEnglishX = englishColumnStart;

  const allMappings = Object.entries(wordMappings).sort(
    ([a], [b]) => parseInt(a) - parseInt(b),
  );
  let colorIndex = 0;

  const checkAndHandlePageBreak = (
    state: FlowState,
    isHebrew: boolean,
  ): FlowState => {
    if (isHebrew) {
      hebrewY = state.y;
      currentHebrewX = state.x;
    } else {
      englishY = state.y;
      currentEnglishX = state.x;
    }

    if (
      englishY < siddurConfig.pdfMargins.bottom ||
      hebrewY < siddurConfig.pdfMargins.bottom
    ) {
      page = pdfDoc.addPage();
      const topY = height - siddurConfig.pdfMargins.top;
      englishY = topY;
      hebrewY = topY;
      currentEnglishX = englishColumnStart;
      currentHebrewX = hebrewColumnEnd;
      return {
        page,
        y: topY,
        x: isHebrew ? currentHebrewX : currentEnglishX,
      };
    }
    return state;
  };

  const ctx = createTwoColumnContext(
    { english: fonts.english, hebrew: fonts.hebrew },
    { english: englishFontSize, hebrew: hebrewFontSize },
    { english: englishLineHeight, hebrew: hebrewLineHeight },
    {
      english: { start: englishColumnStart, end: englishColumnEnd },
      hebrew: { start: hebrewColumnStart, end: hebrewColumnEnd },
    },
    pdfDoc,
    height,
    margin,
    checkAndHandlePageBreak,
  );

  allMappings.forEach(([key, mapping]) => {
    const numericKey = parseInt(key);
    const shouldMap =
      numericKey >= wordMappingStartIndex &&
      (numericKey - wordMappingStartIndex) % wordMappingInterval === 0;
    const subscriptValue = numericKey === 0 ? 1 : numericKey;
    const subscriptText = showSubscripts && shouldMap ? `${subscriptValue}` : undefined;
    const color = printBlackAndWhite ? rgb(0, 0, 0) : colors[colorIndex % colors.length];
    colorIndex++;

    const newState = drawTwoColumnRow(
      mapping,
      color,
      subscriptText,
      {
        page,
        english: { x: currentEnglishX, y: englishY },
        hebrew: { x: currentHebrewX, y: hebrewY },
      },
      ctx,
    );

    page = newState.page;
    currentEnglishX = newState.english.x;
    englishY = newState.english.y;
    currentHebrewX = newState.hebrew.x;
    hebrewY = newState.hebrew.y;
  });

  let updatedContext = {
    ...context,
    page,
    y: Math.min(englishY, hebrewY),
  };
  updatedContext = drawSourceIfPresent(
    updatedContext,
    prayer,
    params,
    width - margin * 2,
  );
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;

  return updatedContext;
};

/**
 * Context for drawing a three-column row (English, Transliteration, Hebrew).
 */
interface ThreeColumnContext {
  /** Fonts for English and Hebrew. */
  fonts: { english: PDFFont; hebrew: PDFFont };
  /** Font sizes for English, Transliteration, and Hebrew. */
  sizes: { english: number; translit: number; hebrew: number };
  /** Line heights for English, Transliteration, and Hebrew. */
  lineHeights: { english: number; translit: number; hebrew: number };
  /** Column bounds for English, Transliteration, and Hebrew. */
  bounds: {
    english: { start: number; end: number };
    translit: { start: number; end: number };
    hebrew: { start: number; end: number };
  };
  /** The PDF document. */
  pdfDoc: PDFDocument;
  /** The page height. */
  height: number;
  /** The page margin. */
  margin: number;
  /** Function to check and handle page breaks. */
  checkPageBreak: (
    state: FlowState,
    column: 'english' | 'translit' | 'hebrew',
  ) => FlowState;
}

/**
 * State for a three-column row.
 */
interface ThreeColumnRowState {
  /** The current PDF page. */
  page: PDFPage;
  /** State for the English column. */
  english: { x: number; y: number };
  /** State for the Transliteration column. */
  translit: { x: number; y: number };
  /** State for the Hebrew column. */
  hebrew: { x: number; y: number };
}

/**
 * Draws a single row of mapped words in three columns.
 *
 * @param mapping - The word mapping data.
 * @param color - The color to use for this word/phrase.
 * @param englishSubscript - Optional subscript for the English column.
 * @param fullColumnSubscript - Optional subscript for Transliteration and Hebrew columns.
 * @param state - The current state of the row.
 * @param ctx - The drawing context.
 * @returns The updated state of the row.
 */
const drawThreeColumnRow = (
  mapping: WordMapping[string],
  color: Color,
  englishSubscript: string | undefined,
  fullColumnSubscript: string | undefined,
  state: ThreeColumnRowState,
  ctx: ThreeColumnContext,
): ThreeColumnRowState => {
  let { page, english, translit, hebrew } = state;

  // Draw English
  let enState: FlowState = { page, x: english.x, y: english.y };
  const enContext: ExtendedFlowContext = {
    pdfDoc: ctx.pdfDoc,
    height: ctx.height,
    margin: ctx.margin,
    columnStart: ctx.bounds.english.start,
    columnEnd: ctx.bounds.english.end,
    lineHeight: ctx.lineHeights.english,
    font: ctx.fonts.english,
    fontSize: ctx.sizes.english,
    color,
    checkPageBreak: (s) => ctx.checkPageBreak(s, 'english'),
  };

  enState = drawFlowingTextWithOffset(enState, mapping.english, enContext);

  if (englishSubscript) {
    const enSubscriptSize = ctx.sizes.english * 0.6;
    enState = drawFlowingTextWithOffset(enState, englishSubscript, {
      ...enContext,
      fontSize: enSubscriptSize,
      color: rgb(0, 0, 0),
      yOffset: -(ctx.sizes.english - enSubscriptSize) * 0.5,
    });
  }

  enState = drawFlowingTextWithOffset(enState, ' ', enContext);
  page = enState.page;
  english = { x: enState.x, y: enState.y };

  // Draw Transliteration
  let trState: FlowState = { page, x: translit.x, y: translit.y };
  const trContext: ExtendedFlowContext = {
    pdfDoc: ctx.pdfDoc,
    height: ctx.height,
    margin: ctx.margin,
    columnStart: ctx.bounds.translit.start,
    columnEnd: ctx.bounds.translit.end,
    lineHeight: ctx.lineHeights.translit,
    font: ctx.fonts.english,
    fontSize: ctx.sizes.translit,
    color,
    checkPageBreak: (s) => ctx.checkPageBreak(s, 'translit'),
  };

  const translitText = mapping.transliteration || mapping.Transliteration || '';
  trState = drawFlowingTextWithOffset(trState, translitText, trContext);

  if (fullColumnSubscript) {
    const trSubscriptSize = ctx.sizes.translit * 0.6;
    trState = drawFlowingTextWithOffset(trState, fullColumnSubscript, {
      ...trContext,
      fontSize: trSubscriptSize,
      color: rgb(0, 0, 0),
      yOffset: -(ctx.sizes.translit - trSubscriptSize) * 0.5,
    });
  }

  trState = drawFlowingTextWithOffset(trState, ' ', trContext);
  page = trState.page;
  translit = { x: trState.x, y: trState.y };

  // Draw Hebrew
  let heState: FlowState = { page, x: hebrew.x, y: hebrew.y };
  const heContext: ExtendedFlowContext = {
    pdfDoc: ctx.pdfDoc,
    height: ctx.height,
    margin: ctx.margin,
    columnStart: ctx.bounds.hebrew.start,
    columnEnd: ctx.bounds.hebrew.end,
    lineHeight: ctx.lineHeights.hebrew,
    font: ctx.fonts.hebrew,
    fontSize: ctx.sizes.hebrew,
    color,
    isRtl: true,
    checkPageBreak: (s) => ctx.checkPageBreak(s, 'hebrew'),
  };

  heState = drawFlowingTextWithOffset(heState, mapping.hebrew, heContext);

  if (fullColumnSubscript) {
    const heSubscriptSize = ctx.sizes.hebrew * 0.6;
    heState = drawFlowingTextWithOffset(heState, fullColumnSubscript, {
      ...heContext,
      font: ctx.fonts.english,
      fontSize: heSubscriptSize,
      color: rgb(0, 0, 0),
      yOffset: -(ctx.sizes.hebrew - heSubscriptSize) * 0.5,
    });
  }

  heState = drawFlowingTextWithOffset(heState, ' ', heContext);
  page = heState.page;
  hebrew = { x: heState.x, y: heState.y };

  return { page, english, translit, hebrew };
};

/**
 * Calculates the layout parameters for a three-column prayer.
 *
 * @param width - The total page width.
 * @param margin - The page margin.
 * @param params - Generation parameters.
 * @returns The layout configuration.
 */
const getThreeColumnLayout = (
  width: number,
  margin: number,
  params: AshkenazContentGenerationParams,
) => {
  const fontSizeMultiplier = params.fontSizeMultiplier ?? 1.0;
  const columnGutter = 15;
  const totalContentWidth = width - margin * 2;
  const columnWidth = (totalContentWidth - 2 * columnGutter) / 3;

  return {
    columnWidth,
    englishColumnStart: margin,
    transliterationColumnStart: margin + columnWidth + columnGutter,
    hebrewColumnStart: margin + 2 * columnWidth + 2 * columnGutter,
    hebrewColumnEnd: width - margin,
    englishFontSize: siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier,
    englishLineHeight:
      siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier,
    translitFontSize: siddurConfig.fontSizes.blessingEnglish * fontSizeMultiplier,
    translitLineHeight:
      siddurConfig.lineSpacing.defaultEnglishPrayer * fontSizeMultiplier,
    hebrewFontSize: siddurConfig.fontSizes.blessingHebrew * fontSizeMultiplier,
    hebrewLineHeight:
      siddurConfig.lineSpacing.defaultHebrewPrayer * fontSizeMultiplier,
  };
};

const createThreeColumnContext = (
  fonts: { english: PDFFont; hebrew: PDFFont },
  sizes: { english: number; translit: number; hebrew: number },
  lineHeights: { english: number; translit: number; hebrew: number },
  bounds: {
    english: { start: number; end: number };
    translit: { start: number; end: number };
    hebrew: { start: number; end: number };
  },
  pdfDoc: PDFDocument,
  height: number,
  margin: number,
  checkPageBreak: (
    state: FlowState,
    column: 'english' | 'translit' | 'hebrew',
  ) => FlowState,
): ThreeColumnContext => ({
  fonts,
  sizes,
  lineHeights,
  bounds,
  pdfDoc,
  height,
  margin,
  checkPageBreak,
});

/**
 * Manages color cycling and subscript generation for three-column layout.
 */
class ColorManager {
  private colors: { id: string; color: Color }[];
  private numColors: number;
  private colorIndex: number = 0;
  private cycleCount: number = 1;
  private hasShownEnglishSubscriptThisCycle: boolean = false;
  private showSubscripts: boolean;
  private printBlackAndWhite: boolean;

  constructor(showSubscripts: boolean, printBlackAndWhite: boolean) {
    this.colors = Object.entries(siddurConfig.colors.wordMappingColors).map(
      ([key, value]) => ({
        id: key.charAt(0),
        color: rgb(value[0], value[1], value[2]),
      }),
    );
    this.numColors = this.colors.length;
    this.showSubscripts = showSubscripts;
    this.printBlackAndWhite = printBlackAndWhite;
  }

  /**
   * Gets the color and subscripts for the next word mapping.
   * @returns Object containing color, englishSubscript, and fullColumnSubscript.
   */
  getNext() {
    const colorData = this.colors[this.colorIndex];
    const color = this.printBlackAndWhite ? rgb(0, 0, 0) : colorData.color;

    const isFirstOfCycle = this.colorIndex === 0;
    const asterisk = isFirstOfCycle && this.showSubscripts ? '*' : '';
    const fullSubscript = `${colorData.id}${this.cycleCount}${asterisk}`;

    let englishSubscript: string | undefined;
    if (this.showSubscripts && !this.hasShownEnglishSubscriptThisCycle) {
      englishSubscript = fullSubscript;
      this.hasShownEnglishSubscriptThisCycle = true;
    }

    const fullColumnSubscript = this.showSubscripts ? fullSubscript : undefined;

    this.colorIndex++;
    if (this.colorIndex >= this.numColors) {
      this.colorIndex = 0;
      this.cycleCount++;
      this.hasShownEnglishSubscriptThisCycle = false;
    }

    return { color, englishSubscript, fullColumnSubscript };
  }
}

/**
 * Draws a prayer with word-by-word color mapping in three columns (English, Transliteration, Hebrew).
 *
 * @param context - The PDF drawing context.
 * @param prayer - The prayer to draw.
 * @param wordMappings - The mapping of words/phrases.
 * @param params - Generation parameters.
 * @returns The updated PDF drawing context.
 */
// oxlint-disable-next-line max-lines-per-function
export const drawThreeColumnColorMappedPrayer = (
  context: PdfDrawingContext,
  prayer: Prayer,
  wordMappings: WordMapping,
  params: AshkenazContentGenerationParams,
): PdfDrawingContext => {
  let { page, y, margin, fonts, width, pdfDoc, height } = context;

  const showSubscripts = params.showWordMappingSubscripts !== false;
  const printBlackAndWhite = params.printBlackAndWhite ?? false;

  const layout = getThreeColumnLayout(width, margin, params);
  const colorManager = new ColorManager(showSubscripts, printBlackAndWhite);

  let englishY = y,
    translitY = y,
    hebrewY = y;
  let currentEnglishX = layout.englishColumnStart;
  let currentTranslitX = layout.transliterationColumnStart;
  let currentHebrewX = layout.hebrewColumnEnd;

  const allMappings = Object.entries(wordMappings).sort(
    ([a], [b]) => parseInt(a) - parseInt(b),
  );

  const checkAndHandlePageBreak = (
    state: FlowState,
    column: 'english' | 'translit' | 'hebrew',
  ): FlowState => {
    if (column === 'english') {
      englishY = state.y;
      currentEnglishX = state.x;
    } else if (column === 'translit') {
      translitY = state.y;
      currentTranslitX = state.x;
    } else {
      hebrewY = state.y;
      currentHebrewX = state.x;
    }

    if (
      englishY < siddurConfig.pdfMargins.bottom ||
      translitY < siddurConfig.pdfMargins.bottom ||
      hebrewY < siddurConfig.pdfMargins.bottom
    ) {
      page = pdfDoc.addPage();
      const topY = height - siddurConfig.pdfMargins.top;
      englishY = topY;
      translitY = topY;
      hebrewY = topY;
      currentEnglishX = layout.englishColumnStart;
      currentTranslitX = layout.transliterationColumnStart;
      currentHebrewX = layout.hebrewColumnEnd;

      return {
        page,
        y: topY,
        x:
          column === 'english'
            ? currentEnglishX
            : column === 'translit'
            ? currentTranslitX
            : currentHebrewX,
      };
    }
    return state;
  };

  const ctx = createThreeColumnContext(
    { english: fonts.english, hebrew: fonts.hebrew },
    {
      english: layout.englishFontSize,
      translit: layout.translitFontSize,
      hebrew: layout.hebrewFontSize,
    },
    {
      english: layout.englishLineHeight,
      translit: layout.translitLineHeight,
      hebrew: layout.hebrewLineHeight,
    },
    {
      english: {
        start: layout.englishColumnStart,
        end: layout.englishColumnStart + layout.columnWidth,
      },
      translit: {
        start: layout.transliterationColumnStart,
        end: layout.transliterationColumnStart + layout.columnWidth,
      },
      hebrew: {
        start: layout.hebrewColumnStart,
        end: layout.hebrewColumnEnd,
      },
    },
    pdfDoc,
    height,
    margin,
    checkAndHandlePageBreak,
  );

  allMappings.forEach(([, mapping]) => {
    const { color, englishSubscript, fullColumnSubscript } = colorManager.getNext();

    const newState = drawThreeColumnRow(
      mapping,
      color,
      englishSubscript,
      fullColumnSubscript,
      {
        page,
        english: { x: currentEnglishX, y: englishY },
        translit: { x: currentTranslitX, y: translitY },
        hebrew: { x: currentHebrewX, y: hebrewY },
      },
      ctx,
    );

    page = newState.page;
    currentEnglishX = newState.english.x;
    englishY = newState.english.y;
    currentTranslitX = newState.translit.x;
    translitY = newState.translit.y;
    currentHebrewX = newState.hebrew.x;
    hebrewY = newState.hebrew.y;
  });

  let updatedContext = {
    ...context,
    page,
    y: Math.min(englishY, translitY, hebrewY),
  };
  updatedContext = drawSourceIfPresent(
    updatedContext,
    prayer,
    params,
    width - margin * 2,
  );
  updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;
  return updatedContext;
};
