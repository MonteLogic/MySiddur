import { PDFDocument, rgb, PDFFont, PDFPage, Color } from 'pdf-lib';
import ashPrayerInfo from 'prayer/prayer-content/ashkenazi-prayer-info.json';
import siddurConfig from './siddur-formatting-config.json';

//================================================================================
// TYPE DEFINITIONS
//================================================================================

/**
 * @typedef {object} Prayer
 * Represents a single prayer object, inferred from the structure of `ashPrayerInfo.json`.
 * It can contain blessings, parts, or simple Hebrew/English text.
 */
type Prayer = (typeof ashPrayerInfo.services.shacharis.sections)[0]['prayers'][0];

/**
 * @interface PdfDrawingContext
 * Holds the core objects and state needed for drawing on the PDF.
 * This context is passed between functions to maintain the current state.
 */
interface PdfDrawingContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number; // Current vertical position on the page
  width: number;
  height: number;
  margin: number;
  fonts: {
    english: PDFFont;
    englishBold: PDFFont;
    hebrew: PDFFont;
  };
}

/**
 * @interface AshkenazContentGenerationParams
 * The parameters required for the main content generation function, including helper functions.
 */
interface AshkenazContentGenerationParams {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
  width: number;
  height: number;
  margin: number;
  englishFont: PDFFont;
  englishBoldFont: PDFFont;
  hebrewFont: PDFFont;
  calculateTextLines: (
    textBlock: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
    lineHeight: number
  ) => { text: string; yOffset: number }[];
  ensureSpaceAndDraw: (
    context: PdfDrawingContext,
    textLines: { text: string; yOffset: number; font: PDFFont; size: number; color?: Color; lineHeight: number }[],
    contentLabel: string
  ) => { page: PDFPage; y: number };
}

//================================================================================
// HELPER FUNCTIONS FOR DRAWING CONTENT
//================================================================================

/**
 * Draws a horizontal divider line across the page.
 * @param context - The current PDF drawing context.
 * @returns The updated PDF drawing context.
 * @private
 */
const drawDividerLine = (
    context: PdfDrawingContext
): PdfDrawingContext => {
    let { page, y, width, margin, pdfDoc, height } = context;

    console.log(`--- [DEBUG] Drawing Divider Line at y: ${y.toFixed(2)} ---`);

    const dividerSpacing = siddurConfig.verticalSpacing.afterSectionDescription;
    const dividerThickness = 1.5;
    const neededSpace = dividerSpacing * 2 + dividerThickness;

    // Check if there is enough space for the divider and its padding, otherwise start a new page.
    if (y - neededSpace < siddurConfig.pdfMargins.bottom) {
        console.warn(`[DEBUG] Page break triggered for divider line.`);
        page = pdfDoc.addPage();
        y = height - siddurConfig.pdfMargins.top;
        console.warn(`[DEBUG] NEW PAGE CREATED for divider. Y is now ${y.toFixed(2)}.`);
    }

    // Add vertical space before drawing the line
    y -= dividerSpacing;

    // Draw the actual line
    page.drawLine({
        start: { x: margin, y: y },
        end: { x: width - margin, y: y },
        thickness: dividerThickness,
        // Assuming a color for the divider is defined in the config, e.g., a subtle gray
        color: rgb(...(siddurConfig.colors.dividerLine || [0.7, 0.7, 0.7]) as [number, number, number]),
    });

    // Move the y-coordinate down to be below the line, accounting for its thickness
    y -= dividerThickness;

    // Add vertical space after the line for clear separation
    y -= dividerSpacing;

    console.log(`[DEBUG] Divider line drawn. New y is ${y.toFixed(2)}`);

    return { ...context, page, y };
};


/**
 * Checks for a 'source' property on a prayer or prayer part and draws it if present.
 * This is intended to be called AFTER the main text of the prayer/part has been drawn.
 * @param context - The current PDF drawing context.
 * @param prayerObject - The prayer or part object, which might have a 'source' property and any other properties.
 * @param params - The main generation parameters.
 * @param columnWidth - The calculated width for the text column.
 * @returns The updated PDF drawing context, potentially with a new page and y-coordinate.
 * @private
 */
const drawSourceIfPresent = (
    context: PdfDrawingContext,
    // Intersect with an index signature to allow any other properties, resolving the "no properties in common" error.
    prayerObject: { source?: unknown } & { [key: string]: any },
    params: AshkenazContentGenerationParams,
    columnWidth: number
): PdfDrawingContext => {
    // Check if the source property exists and is a non-empty string
    if (!prayerObject.source || typeof prayerObject.source !== 'string') {
        return context;
    }

    let { page, y, height, margin, fonts, pdfDoc } = context;
    const { calculateTextLines } = params;

    console.log(`    --- [DEBUG] Found source: "${prayerObject.source}". Drawing it now.`);

    // Add a small gap before the source text
    y -= siddurConfig.verticalSpacing.afterPrayerText / 2;

    // From this point on, TypeScript knows `prayerObject.source` is a string because of the check above.
    const sourceText = `Source: ${prayerObject.source}`;
    const sourceLineInfos = calculateTextLines(sourceText, fonts.english, siddurConfig.fontSizes.prayerPartSource, columnWidth, siddurConfig.lineSpacing.prayerPartSource);

    const estimatedHeight = sourceLineInfos.length * siddurConfig.lineSpacing.prayerPartSource;

    // Check if we need a new page for the source text
    if (y - estimatedHeight < siddurConfig.pdfMargins.bottom) {
        console.warn(`    [DEBUG] Page break triggered for source text.`);
        page = pdfDoc.addPage();
        y = height - siddurConfig.pdfMargins.top;
        console.warn(`    [DEBUG] NEW PAGE CREATED for source. Y is now ${y.toFixed(2)}.`);
    }

    // Draw the source lines in the left (English) column
    let tempY = y;
    console.log(`    [DEBUG] Drawing ${sourceLineInfos.length} source lines.`);
    for (const lineInfo of sourceLineInfos) {
        page.drawText(lineInfo.text, {
            x: margin,
            y: tempY + lineInfo.yOffset,
            font: fonts.english,
            size: siddurConfig.fontSizes.prayerPartSource,
            color: rgb(...siddurConfig.colors.sourceText as [number, number, number]),
            lineHeight: siddurConfig.lineSpacing.prayerPartSource,
        });
    }

    // Update the final y position to be after the source text
    const finalY = tempY + (sourceLineInfos.length > 0 ? sourceLineInfos[sourceLineInfos.length - 1].yOffset : 0);

    return { ...context, page, y: finalY };
};


/**
 * Draws the content for a prayer composed of blessings.
 * @param context - The current PDF drawing context.
 * @param prayer - The prayer object containing the blessings.
 * @param params - The main generation parameters.
 * @param columnWidth - The calculated width for each text column.
 * @returns The updated PDF drawing context.
 * @private
 */
const drawBlessingsPrayer = (
    context: PdfDrawingContext,
    prayer: Extract<Prayer, { blessings: any[] }>,
    params: AshkenazContentGenerationParams,
    columnWidth: number
): PdfDrawingContext => {
    let { page, y, height, margin, fonts } = context;
    const { calculateTextLines } = params;
    let blessingY = y;

    for (const blessing of prayer.blessings) {
        console.log(`    --- [DEBUG] Processing blessing: "${blessing.english.substring(0,30)}..." at y: ${blessingY.toFixed(2)}`);
        const englishLineInfos = calculateTextLines(blessing.english, fonts.english, siddurConfig.fontSizes.blessingEnglish, columnWidth, siddurConfig.lineSpacing.blessingEnglish);
        const hebrewLineInfos = calculateTextLines(blessing.hebrew, fonts.hebrew, siddurConfig.fontSizes.blessingHebrew, columnWidth, siddurConfig.lineSpacing.blessingHebrew);

        const estimatedBlessingHeight = Math.max(
            englishLineInfos.length * siddurConfig.lineSpacing.blessingEnglish,
            hebrewLineInfos.length * siddurConfig.lineSpacing.blessingHebrew
        ) + siddurConfig.verticalSpacing.afterBlessingGroup;
        
        const innerPageBreakThreshold = siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer;
        console.log(`    [DEBUG] Checking for inner blessing page break: Is blessingY (${blessingY.toFixed(2)}) - estHeight (${estimatedBlessingHeight.toFixed(2)}) < threshold (${innerPageBreakThreshold.toFixed(2)})?`);

        if (blessingY - estimatedBlessingHeight < innerPageBreakThreshold) {
            console.warn(`    [DEBUG] YES. Inner page break triggered for blessing.`);
            page = context.pdfDoc.addPage();
            blessingY = height - siddurConfig.pdfMargins.top;
            console.warn(`    [DEBUG] NEW PAGE CREATED. BlessingY is now ${blessingY.toFixed(2)}.`);
        }
        
        console.log(`    [DEBUG] Drawing ${englishLineInfos.length} English lines.`);
        for (const lineInfo of englishLineInfos) {
            page.drawText(lineInfo.text, {
                x: margin, y: blessingY + lineInfo.yOffset, font: fonts.english,
                size: siddurConfig.fontSizes.blessingEnglish, color: rgb(...siddurConfig.colors.defaultText as [number, number, number]),
                lineHeight: siddurConfig.lineSpacing.blessingEnglish
            });
        }

        console.log(`    [DEBUG] Drawing ${hebrewLineInfos.length} Hebrew lines.`);
        for (const lineInfo of hebrewLineInfos) {
            page.drawText(lineInfo.text, {
                x: context.width / 2 + siddurConfig.layout.hebrewColumnXOffset, y: blessingY + lineInfo.yOffset, font: fonts.hebrew,
                size: siddurConfig.fontSizes.blessingHebrew, color: rgb(...siddurConfig.colors.defaultText as [number, number, number]),
                lineHeight: siddurConfig.lineSpacing.blessingHebrew
            });
        }
        
        blessingY = Math.min(
            blessingY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
            blessingY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
        ) - siddurConfig.verticalSpacing.afterBlessingGroup;
        console.log(`    [DEBUG] Y for next blessing is now: ${blessingY.toFixed(2)}`);
    }
    return { ...context, page, y: blessingY };
};

/**
 * Draws the content for a prayer composed of parts, which may include sources.
 * The source for each part is now drawn AFTER its text.
 * @param context - The current PDF drawing context.
 * @param prayer - The prayer object containing the parts.
 * @param params - The main generation parameters.
 * @param columnWidth - The calculated width for each text column.
 * @returns The updated PDF drawing context.
 * @private
 */
const drawPartsPrayer = (
    context: PdfDrawingContext,
    prayer: Extract<Prayer, { parts: any[] }>,
    params: AshkenazContentGenerationParams,
    columnWidth: number
): PdfDrawingContext => {
    let { page, y, height, margin, fonts } = context;
    const { calculateTextLines } = params;
    let partY = y;

    for (const part of prayer.parts) {
        console.log(`    --- [DEBUG] Processing part: "${part.english.substring(0,30)}..." at y: ${partY.toFixed(2)}`);
        
        // Calculate lines for all text blocks first
        const englishLineInfos = calculateTextLines(part.english, fonts.english, siddurConfig.fontSizes.prayerPartEnglish, columnWidth, siddurConfig.lineSpacing.prayerPartEnglish);
        const hebrewLineInfos = calculateTextLines(part.hebrew, fonts.hebrew, siddurConfig.fontSizes.prayerPartHebrew, columnWidth, siddurConfig.lineSpacing.prayerPartHebrew);

        const estimatedPartHeight = Math.max(
                englishLineInfos.length * siddurConfig.lineSpacing.prayerPartEnglish,
                hebrewLineInfos.length * siddurConfig.lineSpacing.prayerPartHebrew
            ) + siddurConfig.verticalSpacing.afterPartGroup;

        const innerPageBreakThreshold = siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer;
        console.log(`    [DEBUG] Checking for inner part page break: Is partY (${partY.toFixed(2)}) - estHeight (${estimatedPartHeight.toFixed(2)}) < threshold (${innerPageBreakThreshold.toFixed(2)})?`);
        if (partY - estimatedPartHeight < innerPageBreakThreshold) {
            console.warn(`    [DEBUG] YES. Inner page break triggered for part.`);
            page = context.pdfDoc.addPage();
            partY = height - siddurConfig.pdfMargins.top;
            console.warn(`    [DEBUG] NEW PAGE CREATED. PartY is now ${partY.toFixed(2)}.`);
        }
        
        // Draw English text
        let tempEnglishY = partY;
        console.log(`    [DEBUG] Drawing ${englishLineInfos.length} English lines.`);
        for (const lineInfo of englishLineInfos) {
            page.drawText(lineInfo.text, {
                x: margin, y: tempEnglishY + lineInfo.yOffset, font: fonts.english,
                size: siddurConfig.fontSizes.prayerPartEnglish, color: rgb(...siddurConfig.colors.defaultText as [number, number, number]),
                lineHeight: siddurConfig.lineSpacing.prayerPartEnglish
            });
        }

        // Draw Hebrew text
        let tempHebrewY = partY;
        console.log(`    [DEBUG] Drawing ${hebrewLineInfos.length} Hebrew lines.`);
        for (const lineInfo of hebrewLineInfos) {
            page.drawText(lineInfo.text, {
                x: context.width / 2 + siddurConfig.layout.hebrewColumnXOffset, y: tempHebrewY + lineInfo.yOffset, font: fonts.hebrew,
                size: siddurConfig.fontSizes.prayerPartHebrew, color: rgb(...siddurConfig.colors.defaultText as [number, number, number]),
                lineHeight: siddurConfig.lineSpacing.prayerPartHebrew
            });
        }
        
        // Calculate where the main text ends.
        const endOfTextY = Math.min(
            tempEnglishY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
            tempHebrewY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
        );

        // Create a temporary context for the helper function
        let partContext = { ...context, page, y: endOfTextY };

        // Call the helper to draw the source for the current 'part'
        partContext = drawSourceIfPresent(partContext, part, params, columnWidth);

        // Update page and y from the helper's result
        page = partContext.page;
        
        // Apply spacing for the next part in the group
        partY = partContext.y - siddurConfig.verticalSpacing.afterPartGroup;
        console.log(`    [DEBUG] Y for next part is now: ${partY.toFixed(2)}`);
    }
    return { ...context, page, y: partY };
};


/**
 * Draws a simple prayer with one block of English and one block of Hebrew text.
 * It now also handles drawing an optional source attribution after the text.
 * @param context - The current PDF drawing context.
 * @param prayer - The prayer data containing `english` and `hebrew` properties.
 * @param params - The main generation parameters.
 * @param columnWidth - The calculated width for each text column.
 * @returns The updated PDF drawing context.
 * @private
 */
const drawSimplePrayerText = (
    context: PdfDrawingContext,
    prayer: Extract<Prayer, { hebrew: string, english: string }>,
    params: AshkenazContentGenerationParams,
    columnWidth: number
): PdfDrawingContext => {
    let { page, y, margin, fonts, width } = context;
    const { calculateTextLines } = params;

    console.log(`    --- [DEBUG] line 281: Processing Prayer Text at y: ${y.toFixed(2)}`);
    const englishLineInfos = calculateTextLines(prayer.english, fonts.english, siddurConfig.fontSizes.blessingEnglish, columnWidth, siddurConfig.lineSpacing.defaultEnglishPrayer);
    const hebrewLineInfos = calculateTextLines(prayer.hebrew, fonts.hebrew, siddurConfig.fontSizes.blessingHebrew, columnWidth, siddurConfig.lineSpacing.defaultHebrewPrayer);

    console.log(`    [DEBUG] Drawing ${englishLineInfos.length} English lines.`);
    let tempEnglishY = y;
    for (const lineInfo of englishLineInfos) {
        page.drawText(lineInfo.text, {
            x: margin, y: tempEnglishY + lineInfo.yOffset, font: fonts.english,
            size: siddurConfig.fontSizes.blessingEnglish, color: rgb(...siddurConfig.colors.defaultText as [number, number, number]),
            lineHeight: siddurConfig.lineSpacing.defaultEnglishPrayer
        });
    }

    console.log(`    [DEBUG] Drawing ${hebrewLineInfos.length} Hebrew lines.`);
    let tempHebrewY = y;
    for (const lineInfo of hebrewLineInfos) {
        page.drawText(lineInfo.text, {
            x: width / 2 + siddurConfig.layout.hebrewColumnXOffset, y: tempHebrewY + lineInfo.yOffset, font: fonts.hebrew,
            size: siddurConfig.fontSizes.blessingHebrew, color: rgb(...siddurConfig.colors.defaultText as [number, number, number]),
            lineHeight: siddurConfig.lineSpacing.defaultHebrewPrayer
        });
    }

    // Calculate y position after the main text, but DON'T apply final spacing yet.
    const currentY = Math.min(
        tempEnglishY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
        tempHebrewY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
    );

    // Create an updated context to pass to the helper
    let updatedContext = { ...context, page, y: currentY };

    // Call the new helper function to draw the source if it exists
    updatedContext = drawSourceIfPresent(updatedContext, prayer, params, columnWidth);

    // Apply the final spacing for after the prayer content (text and source)
    updatedContext.y -= siddurConfig.verticalSpacing.afterPrayerText;
    console.log(`  [DEBUG] line 315: Y after Prayer Text and Source is now: ${updatedContext.y.toFixed(2)}`);

    return updatedContext;
};

//================================================================================
// CORE LOGIC FUNCTIONS
//================================================================================

/**
 * Draws a single prayer, handling page breaks and delegating to specific drawing functions.
 * @param context - The current PDF drawing context.
 * @param prayer - The prayer data to be drawn.
 * @param params - The main generation parameters.
 * @returns The updated PDF drawing context.
 * @private
 */
const drawPrayer = (
    context: PdfDrawingContext,
    prayer: Prayer,
    params: AshkenazContentGenerationParams
): PdfDrawingContext => {
    let { page, y, pdfDoc, height, width, margin, fonts } = context;
    const { calculateTextLines, ensureSpaceAndDraw } = params;

    console.log(`\n  --- [DEBUG] Starting Prayer: "${prayer.title}" ---`);
    const prayerTitleTextHeight = fonts.englishBold.heightAtSize(siddurConfig.fontSizes.prayerTitle) + siddurConfig.verticalSpacing.beforePrayerTitle;
    let estimatedPrayerContentHeight = 0;
    const columnWidth = width / 2 - margin - siddurConfig.layout.hebrewColumnXOffset;

    if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
        estimatedPrayerContentHeight = prayer.blessings.length * Math.max(siddurConfig.lineSpacing.blessingEnglish, siddurConfig.lineSpacing.blessingHebrew) + (prayer.blessings.length * siddurConfig.verticalSpacing.afterBlessingGroup);
        console.log(`  [DEBUG] Prayer has 'blessings'. Estimated content height: ${estimatedPrayerContentHeight.toFixed(2)}`);
    } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
        estimatedPrayerContentHeight = prayer.parts.length * Math.max(siddurConfig.lineSpacing.prayerPartEnglish, siddurConfig.lineSpacing.prayerPartHebrew) + (prayer.parts.length * siddurConfig.verticalSpacing.afterPartGroup);
         console.log(`  [DEBUG] Prayer has 'parts'. Estimated content height: ${estimatedPrayerContentHeight.toFixed(2)}`);
    } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
        const englishLines = Math.ceil(fonts.english.widthOfTextAtSize(prayer.english ?? '', siddurConfig.fontSizes.blessingEnglish) / columnWidth);
        const hebrewLines = Math.ceil(fonts.hebrew.widthOfTextAtSize(prayer.hebrew ?? '', siddurConfig.fontSizes.blessingHebrew) / columnWidth);
        estimatedPrayerContentHeight = Math.max(englishLines * siddurConfig.lineSpacing.defaultEnglishPrayer, hebrewLines * siddurConfig.lineSpacing.defaultHebrewPrayer) + siddurConfig.verticalSpacing.afterPrayerText;
        console.log(`  [DEBUG] Prayer is 'simple'. Estimated content height: ${estimatedPrayerContentHeight.toFixed(2)}`);
    }

    const prayerPageBreakThreshold = siddurConfig.pdfMargins.bottom + prayerTitleTextHeight + estimatedPrayerContentHeight + siddurConfig.verticalSpacing.pageBuffer;
    console.log(`  [DEBUG] Checking for prayer page break: Is y (${y.toFixed(2)}) < threshold (${prayerPageBreakThreshold.toFixed(2)})?`);
    if (y < prayerPageBreakThreshold) {
        console.warn(`  [DEBUG] YES. Page break triggered for prayer content.`);
        page = pdfDoc.addPage();
        y = height - siddurConfig.pdfMargins.top;
        console.warn(`  [DEBUG] NEW PAGE CREATED. Y is now ${y.toFixed(2)}.`);
    } else {
        console.log(`  [DEBUG] NO. No page break needed for this prayer.`);
    }

    let currentContext = { ...context, page, y };

    // Draw Prayer Title
    const lines = calculateTextLines(prayer.title, fonts.englishBold, siddurConfig.fontSizes.prayerTitle, width - margin * 2, siddurConfig.lineSpacing.prayerTitle);
    ({ page, y } = ensureSpaceAndDraw(currentContext, lines.map(l => ({ ...l, font: fonts.englishBold, size: siddurConfig.fontSizes.prayerTitle, lineHeight: siddurConfig.lineSpacing.prayerTitle })), `Prayer Title: ${prayer.title}`));
    
    y -= siddurConfig.verticalSpacing.beforePrayerTitle;
    const columnStartY = y;
    console.log(`  [DEBUG] Y for column start: ${columnStartY.toFixed(2)}`);
    currentContext = { ...context, page, y: columnStartY };

    if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
        currentContext = drawBlessingsPrayer(currentContext, prayer as Extract<Prayer, { blessings: any[] }>, params, columnWidth);
    } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
        currentContext = drawPartsPrayer(currentContext, prayer as Extract<Prayer, { parts: any[] }>, params, columnWidth);
    } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
        currentContext = drawSimplePrayerText(currentContext, prayer as Extract<Prayer, { hebrew: string, english: string }>, params, columnWidth);
    }
    
    return currentContext;
};

//================================================================================
// MAIN EXPORTED FUNCTION
//================================================================================

/**
 * Generates the main content of the Ashkenaz siddur PDF.
 * It iterates through services and sections from the JSON data,
 * formatting and drawing them onto the PDF pages. A divider is added between services.
 *
 * @param params - The core parameters needed for content generation,
 * including PDF objects, fonts, and layout information.
 * @returns An object containing the last used PDF page and the final y-coordinate.
 */
export const generateAshkenazContent = (
    params: AshkenazContentGenerationParams
): { page: PDFPage; y: number } => {
    let { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont, calculateTextLines, ensureSpaceAndDraw } = params;

    let context: PdfDrawingContext = {
        pdfDoc, page, y, width, height, margin, 
        fonts: { english: englishFont, englishBold: englishBoldFont, hebrew: hebrewFont }
    };

    console.log('--- [DEBUG] STARTING generateAshkenazContent ---');
    
    // Combine all services into an array to ensure order and allow for dividers.
    const allServices = [
        ashPrayerInfo.services['waking-prayers'],
        ashPrayerInfo.services.shacharis
    ];

    for (const [serviceIndex, service] of allServices.entries()) {
        if (!service || !Array.isArray(service.sections)) {
            console.error(`[DEBUG] Service at index ${serviceIndex} is invalid or has no sections.`);
            continue;
        }

        for (const section of service.sections) {
            console.log(`\n--- [DEBUG] Starting Section: "${section.sectionTitle}" ---`);
            console.log(`[DEBUG] Y at start of section: ${context.y.toFixed(2)}`);

            // Calculate and check for page break for the section header
            const sectionTitleTextHeight = context.fonts.englishBold.heightAtSize(siddurConfig.fontSizes.sectionTitle) * (section.sectionTitle.length > siddurConfig.layout.sectionTitleLengthThreshold ? 2 : 1);
            const sectionDescTextHeight = context.fonts.english.heightAtSize(siddurConfig.fontSizes.sectionDescription) * (section.description.length > siddurConfig.layout.sectionDescriptionLengthThreshold ? 3 : 1);
            const estimatedSectionHeaderHeight = sectionTitleTextHeight + siddurConfig.verticalSpacing.afterSectionTitleText + sectionDescTextHeight + siddurConfig.lineSpacing.sectionDescription + siddurConfig.verticalSpacing.afterSectionDescription;
            
            console.log(`[DEBUG] Calculated estimated section header height: ${estimatedSectionHeaderHeight.toFixed(2)}`);

            const pageBreakThreshold = siddurConfig.pdfMargins.bottom + estimatedSectionHeaderHeight + siddurConfig.verticalSpacing.pageBuffer;
            console.log(`[DEBUG] Checking for section header page break: Is y (${context.y.toFixed(2)}) < threshold (${pageBreakThreshold.toFixed(2)})?`);
            if (context.y < pageBreakThreshold) {
                console.warn(`[DEBUG] YES. Page break triggered for section header.`);
                context.page = context.pdfDoc.addPage();
                context.y = context.height - siddurConfig.pdfMargins.top;
                console.warn(`[DEBUG] NEW PAGE CREATED. Y is now ${context.y.toFixed(2)}.`);
            } else {
                console.log(`[DEBUG] NO. No page break needed for section header.`);
            }

            // Draw Section Title
            let lines = calculateTextLines(section.sectionTitle, context.fonts.englishBold, siddurConfig.fontSizes.sectionTitle, context.width - context.margin * 2, siddurConfig.lineSpacing.sectionTitle);
            ({ page: context.page, y: context.y } = ensureSpaceAndDraw(context, lines.map(l => ({ ...l, font: context.fonts.englishBold, size: siddurConfig.fontSizes.sectionTitle, color: rgb(...siddurConfig.colors.sectionTitle as [number, number, number]), lineHeight: siddurConfig.lineSpacing.sectionTitle })), `Section Title: ${section.sectionTitle}`));
            context.y -= siddurConfig.verticalSpacing.afterSectionTitleText; 
            console.log(`[DEBUG] Y after title spacing: ${context.y.toFixed(2)}`);

            // Draw Section Description
            lines = calculateTextLines(section.description, context.fonts.english, siddurConfig.fontSizes.sectionDescription, context.width - context.margin * 2, siddurConfig.lineSpacing.sectionDescription);
            ({ page: context.page, y: context.y } = ensureSpaceAndDraw(context, lines.map(l => ({ ...l, font: context.fonts.english, size: siddurConfig.fontSizes.sectionDescription, color: rgb(...siddurConfig.colors.sectionDescription as [number, number, number]), lineHeight: siddurConfig.lineSpacing.sectionDescription })), `Section Description: ${section.sectionTitle}`));
            context.y -= siddurConfig.verticalSpacing.afterSectionDescription;
            console.log(`[DEBUG] Y after description spacing: ${context.y.toFixed(2)}`);

            for (const prayer of section.prayers as Prayer[]) {
                context = drawPrayer(context, prayer, params);
            }
        }

        // After processing all sections of a service, draw a divider if it's not the last one.
        if (serviceIndex < allServices.length - 1) {
            context = drawDividerLine(context);
        }
    }

    console.log(`\n--- [DEBUG] FINISHED generateAshkenazContent ---`);
    return { page: context.page, y: context.y };
};