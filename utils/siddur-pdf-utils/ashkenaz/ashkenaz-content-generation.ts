// utils/siddur-pdf-utils/ashkenaz/ashkenaz-content-generation.ts

import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import ashPrayerInfo from 'prayer-content/ashkenazi-prayer-info.json';
import siddurConfig from './siddur-formatting-config.json';

// Type alias for a single prayer object, inferred from the structure of `ashPrayerInfo`.
type Prayer = (typeof ashPrayerInfo.sections)[0]['prayers'][0];

interface AshkenazContentGenerationParams {
    pdfDoc: PDFDocument;
    page: any; // PDFPage
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
    ) => { text: string, yOffset: number }[];
    ensureSpaceAndDraw: (
        currentParams: {
            pdfDoc: PDFDocument;
            page: any;
            y: number;
            width: number;
            height: number;
            margin: number;
            englishFont: PDFFont;
            englishBoldFont: PDFFont;
            hebrewFont: PDFFont;
        },
        textLines: { text: string, yOffset: number, font: PDFFont, size: number, color?: ReturnType<typeof rgb>, xOffset?: number, lineHeight: number }[],
        // Added label for the few places this function is used, to make logs clearer
        contentLabel: string
    ) => { page: any, y: number };
}

export const generateAshkenazContent = (params: AshkenazContentGenerationParams): { page: any, y: number } => {
    let { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont, calculateTextLines, ensureSpaceAndDraw } = params;

    // Helper for passing common PDF generation parameters within this function
    let commonPdfParams = { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont };

    console.log('--- [DEBUG] STARTING generateAshkenazContent ---');

    for (const section of ashPrayerInfo.sections) {
        console.log(`\n--- [DEBUG] Starting Section: "${section.sectionTitle}" ---`);
        console.log(`[DEBUG] Y at start of section: ${y.toFixed(2)}`);

        // Calculate approximate height needed for section title and description
        const sectionTitleTextHeight = englishBoldFont.heightAtSize(siddurConfig.fontSizes.sectionTitle) * (section.sectionTitle.length > siddurConfig.layout.sectionTitleLengthThreshold ? 2 : 1);
        const sectionDescTextHeight = englishFont.heightAtSize(siddurConfig.fontSizes.sectionDescription) * (section.description.length > siddurConfig.layout.sectionDescriptionLengthThreshold ? 3 : 1);
        const estimatedSectionHeaderHeight = sectionTitleTextHeight + siddurConfig.verticalSpacing.afterSectionTitleText + sectionDescTextHeight + siddurConfig.lineSpacing.sectionDescription + siddurConfig.verticalSpacing.afterSectionDescription;
        
        console.log(`[DEBUG] Calculated estimated section header height: ${estimatedSectionHeaderHeight.toFixed(2)}`);

        // Check for page break for the section header
        const pageBreakThreshold = siddurConfig.pdfMargins.bottom + estimatedSectionHeaderHeight + siddurConfig.verticalSpacing.pageBuffer;
        console.log(`[DEBUG] Checking for section header page break: Is y (${y.toFixed(2)}) < threshold (${pageBreakThreshold.toFixed(2)})?`);
        if (y < pageBreakThreshold) {
            console.warn(`[DEBUG] YES. Page break triggered for section header.`);
            page = pdfDoc.addPage();
            y = height - siddurConfig.pdfMargins.top;
            commonPdfParams = { ...commonPdfParams, page, y };
            console.warn(`[DEBUG] NEW PAGE CREATED. Y is now ${y.toFixed(2)}.`);
        } else {
            console.log(`[DEBUG] NO. No page break needed for section header.`);
        }

        let lines = calculateTextLines(section.sectionTitle, englishBoldFont, siddurConfig.fontSizes.sectionTitle, width - margin * 2, siddurConfig.lineSpacing.sectionTitle);
        ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ 
            ...l, 
            font: englishBoldFont, 
            size: siddurConfig.fontSizes.sectionTitle, 
            color: rgb(siddurConfig.colors.sectionTitle[0], siddurConfig.colors.sectionTitle[1], siddurConfig.colors.sectionTitle[2]), 
            lineHeight: siddurConfig.lineSpacing.sectionTitle 
        })), `Section Title: ${section.sectionTitle}`)); // Added label
        commonPdfParams = { ...commonPdfParams, page, y };

        y -= siddurConfig.verticalSpacing.afterSectionTitleText; 
        console.log(`[DEBUG] Y after title spacing: ${y.toFixed(2)}`);

        lines = calculateTextLines(section.description, englishFont, siddurConfig.fontSizes.sectionDescription, width - margin * 2, siddurConfig.lineSpacing.sectionDescription);
        ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ 
            ...l, 
            font: englishFont, 
            size: siddurConfig.fontSizes.sectionDescription, 
            color: rgb(siddurConfig.colors.sectionDescription[0], siddurConfig.colors.sectionDescription[1], siddurConfig.colors.sectionDescription[2]), 
            lineHeight: siddurConfig.lineSpacing.sectionDescription 
        })), `Section Description: ${section.sectionTitle}`)); // Added label
        commonPdfParams = { ...commonPdfParams, page, y };
        y -= siddurConfig.verticalSpacing.afterSectionDescription;
        console.log(`[DEBUG] Y after description spacing: ${y.toFixed(2)}`);

        for (const prayer of section.prayers as Prayer[]) {
            console.log(`\n  --- [DEBUG] Starting Prayer: "${prayer.title}" ---`);
            const prayerTitleTextHeight = englishBoldFont.heightAtSize(siddurConfig.fontSizes.prayerTitle) + siddurConfig.verticalSpacing.beforePrayerTitle;
            let estimatedPrayerContentHeight = 0;
            const columnWidth = width / 2 - margin - siddurConfig.layout.hebrewColumnXOffset;

            if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
                estimatedPrayerContentHeight = prayer.blessings.length * Math.max(siddurConfig.lineSpacing.blessingEnglish, siddurConfig.lineSpacing.blessingHebrew) + (prayer.blessings.length * siddurConfig.verticalSpacing.afterBlessingGroup);
                console.log(`  [DEBUG] Prayer has 'blessings'. Estimated content height: ${estimatedPrayerContentHeight.toFixed(2)}`);
            } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
                estimatedPrayerContentHeight = prayer.parts.length * Math.max(siddurConfig.lineSpacing.prayerPartEnglish, siddurConfig.lineSpacing.prayerPartHebrew) + (prayer.parts.length * siddurConfig.verticalSpacing.afterPartGroup);
                 console.log(`  [DEBUG] Prayer has 'parts'. Estimated content height: ${estimatedPrayerContentHeight.toFixed(2)}`);
            } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
                const englishText = prayer.english ?? '';
                const hebrewText = prayer.hebrew ?? '';
                const englishLines = Math.ceil(englishFont.widthOfTextAtSize(englishText, siddurConfig.fontSizes.blessingEnglish) / columnWidth);
                const hebrewLines = Math.ceil(hebrewFont.widthOfTextAtSize(hebrewText, siddurConfig.fontSizes.blessingHebrew) / columnWidth);
                estimatedPrayerContentHeight = Math.max(englishLines * siddurConfig.lineSpacing.defaultEnglishPrayer, hebrewLines * siddurConfig.lineSpacing.defaultHebrewPrayer) + siddurConfig.verticalSpacing.afterPrayerText;
                console.log(`  [DEBUG] Prayer is 'simple'. Estimated content height: ${estimatedPrayerContentHeight.toFixed(2)}`);
            }

            const prayerPageBreakThreshold = siddurConfig.pdfMargins.bottom + prayerTitleTextHeight + estimatedPrayerContentHeight + siddurConfig.verticalSpacing.pageBuffer;
            console.log(`  [DEBUG] Checking for prayer page break: Is y (${y.toFixed(2)}) < threshold (${prayerPageBreakThreshold.toFixed(2)})?`);
            if (y < prayerPageBreakThreshold) {
                console.warn(`  [DEBUG] YES. Page break triggered for prayer content.`);
                page = pdfDoc.addPage();
                y = height - siddurConfig.pdfMargins.top;
                commonPdfParams = { ...commonPdfParams, page, y };
                console.warn(`  [DEBUG] NEW PAGE CREATED. Y is now ${y.toFixed(2)}.`);
            } else {
                console.log(`  [DEBUG] NO. No page break needed for this prayer.`);
            }

            lines = calculateTextLines(prayer.title, englishBoldFont, siddurConfig.fontSizes.prayerTitle, width - margin * 2, siddurConfig.lineSpacing.prayerTitle);
            ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ 
                ...l, 
                font: englishBoldFont, 
                size: siddurConfig.fontSizes.prayerTitle, 
                lineHeight: siddurConfig.lineSpacing.prayerTitle 
            })), `Prayer Title: ${prayer.title}`)); // Added label
            commonPdfParams = { ...commonPdfParams, page, y };
            y -= siddurConfig.verticalSpacing.beforePrayerTitle;

            const columnStartY = y;
            console.log(`  [DEBUG] Y for column start: ${columnStartY.toFixed(2)}`);

            if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
                let blessingY = columnStartY;
                for (const blessing of prayer.blessings) {
                    console.log(`    --- [DEBUG] Processing blessing: "${blessing.english.substring(0,30)}..." at y: ${blessingY.toFixed(2)}`);
                    const englishLineInfos = calculateTextLines(blessing.english, englishFont, siddurConfig.fontSizes.blessingEnglish, columnWidth, siddurConfig.lineSpacing.blessingEnglish);
                    const hebrewLineInfos = calculateTextLines(blessing.hebrew, hebrewFont, siddurConfig.fontSizes.blessingHebrew, columnWidth, siddurConfig.lineSpacing.blessingHebrew);

                    const estimatedBlessingHeight = Math.max(
                        englishLineInfos.length * siddurConfig.lineSpacing.blessingEnglish,
                        hebrewLineInfos.length * siddurConfig.lineSpacing.blessingHebrew
                    ) + siddurConfig.verticalSpacing.afterBlessingGroup;
                    
                    const innerPageBreakThreshold = siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer;
                    console.log(`    [DEBUG] Checking for inner blessing page break: Is blessingY (${blessingY.toFixed(2)}) - estHeight (${estimatedBlessingHeight.toFixed(2)}) < threshold (${innerPageBreakThreshold.toFixed(2)})?`);

                    if (blessingY - estimatedBlessingHeight < innerPageBreakThreshold) {
                        console.warn(`    [DEBUG] YES. Inner page break triggered for blessing.`);
                        page = pdfDoc.addPage();
                        blessingY = height - siddurConfig.pdfMargins.top;
                        commonPdfParams = { ...commonPdfParams, page, y: blessingY };
                        console.warn(`    [DEBUG] NEW PAGE CREATED. BlessingY is now ${blessingY.toFixed(2)}.`);
                    }
                    
                    console.log(`    [DEBUG] Drawing ${englishLineInfos.length} English lines.`);
                    for (const lineInfo of englishLineInfos) {
                        page.drawText(lineInfo.text, {
                            x: margin,
                            y: blessingY + lineInfo.yOffset,
                            font: englishFont,
                            size: siddurConfig.fontSizes.blessingEnglish,
                            color: rgb(siddurConfig.colors.defaultText[0], siddurConfig.colors.defaultText[1], siddurConfig.colors.defaultText[2]),
                            lineHeight: siddurConfig.lineSpacing.blessingEnglish
                        });
                    }

                    console.log(`    [DEBUG] Drawing ${hebrewLineInfos.length} Hebrew lines.`);
                    for (const lineInfo of hebrewLineInfos) {
                        page.drawText(lineInfo.text, {
                            x: width / 2 + siddurConfig.layout.hebrewColumnXOffset,
                            y: blessingY + lineInfo.yOffset,
                            font: hebrewFont,
                            size: siddurConfig.fontSizes.blessingHebrew,
                            color: rgb(siddurConfig.colors.defaultText[0], siddurConfig.colors.defaultText[1], siddurConfig.colors.defaultText[2]),
                            lineHeight: siddurConfig.lineSpacing.blessingHebrew
                        });
                    }
                    
                    blessingY = Math.min(
                        blessingY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
                        blessingY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
                    ) - siddurConfig.verticalSpacing.afterBlessingGroup;
                    console.log(`    [DEBUG] Y for next blessing is now: ${blessingY.toFixed(2)}`);
                }
                y = blessingY;
                commonPdfParams = { ...commonPdfParams, page, y };
            } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
                let partY = columnStartY;
                for (const part of prayer.parts) {
                    console.log(`    --- [DEBUG] Processing part: "${part.english.substring(0,30)}..." at y: ${partY.toFixed(2)}`);
                    let sourceLines: { text: string, yOffset: number }[] = [];
                    if (part.source) {
                        sourceLines = calculateTextLines(`Source: ${part.source}`, englishFont, siddurConfig.fontSizes.prayerPartSource, columnWidth, siddurConfig.lineSpacing.prayerPartSource);
                    }
                    const englishLineInfos = calculateTextLines(part.english, englishFont, siddurConfig.fontSizes.prayerPartEnglish, columnWidth, siddurConfig.lineSpacing.prayerPartEnglish);
                    const hebrewLineInfos = calculateTextLines(part.hebrew, hebrewFont, siddurConfig.fontSizes.prayerPartHebrew, columnWidth, siddurConfig.lineSpacing.prayerPartHebrew);

                    const estimatedPartHeight = (sourceLines.length * siddurConfig.lineSpacing.prayerPartSource) +
                        Math.max(
                            englishLineInfos.length * siddurConfig.lineSpacing.prayerPartEnglish,
                            hebrewLineInfos.length * siddurConfig.lineSpacing.prayerPartHebrew
                        ) + siddurConfig.verticalSpacing.afterPartGroup;

                    const innerPageBreakThreshold = siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer;
                    console.log(`    [DEBUG] Checking for inner part page break: Is partY (${partY.toFixed(2)}) - estHeight (${estimatedPartHeight.toFixed(2)}) < threshold (${innerPageBreakThreshold.toFixed(2)})?`);
                    if (partY - estimatedPartHeight < innerPageBreakThreshold) {
                        console.warn(`    [DEBUG] YES. Inner page break triggered for part.`);
                        page = pdfDoc.addPage();
                        partY = height - siddurConfig.pdfMargins.top;
                        commonPdfParams = { ...commonPdfParams, page, y: partY };
                        console.warn(`    [DEBUG] NEW PAGE CREATED. PartY is now ${partY.toFixed(2)}.`);
                    }
                    
                    if (part.source) {
                        console.log(`    [DEBUG] Drawing ${sourceLines.length} source lines.`);
                        let currentLineY = partY;
                        for (const lineInfo of sourceLines) {
                            page.drawText(lineInfo.text, {
                                x: margin,
                                y: currentLineY + lineInfo.yOffset,
                                font: englishFont,
                                size: siddurConfig.fontSizes.prayerPartSource,
                                color: rgb(siddurConfig.colors.sourceText[0], siddurConfig.colors.sourceText[1], siddurConfig.colors.sourceText[2]),
                                lineHeight: siddurConfig.lineSpacing.prayerPartSource
                            });
                        }
                        partY += (sourceLines.length > 0 ? sourceLines[sourceLines.length - 1].yOffset : 0);
                        console.log(`    [DEBUG] Y after drawing source: ${partY.toFixed(2)}`);
                    }

                    console.log(`    [DEBUG] Drawing ${englishLineInfos.length} English lines.`);
                    let tempEnglishY = partY;
                    for (const lineInfo of englishLineInfos) {
                        page.drawText(lineInfo.text, {
                            x: margin,
                            y: tempEnglishY + lineInfo.yOffset,
                            font: englishFont,
                            size: siddurConfig.fontSizes.prayerPartEnglish,
                            color: rgb(siddurConfig.colors.defaultText[0], siddurConfig.colors.defaultText[1], siddurConfig.colors.defaultText[2]),
                            lineHeight: siddurConfig.lineSpacing.prayerPartEnglish
                        });
                    }

                    console.log(`    [DEBUG] Drawing ${hebrewLineInfos.length} Hebrew lines.`);
                    let tempHebrewY = partY;
                    for (const lineInfo of hebrewLineInfos) {
                        page.drawText(lineInfo.text, {
                            x: width / 2 + siddurConfig.layout.hebrewColumnXOffset,
                            y: tempHebrewY + lineInfo.yOffset,
                            font: hebrewFont,
                            size: siddurConfig.fontSizes.prayerPartHebrew,
                            color: rgb(siddurConfig.colors.defaultText[0], siddurConfig.colors.defaultText[1], siddurConfig.colors.defaultText[2]),
                            lineHeight: siddurConfig.lineSpacing.prayerPartHebrew
                        });
                    }
                    partY = Math.min(
                        tempEnglishY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
                        tempHebrewY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
                    ) - siddurConfig.verticalSpacing.afterPartGroup;
                    console.log(`    [DEBUG] Y for next part is now: ${partY.toFixed(2)}`);
                }
                y = partY;
                commonPdfParams = { ...commonPdfParams, page, y };
            } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
                console.log(`    --- [DEBUG] line 281: Processing Prayer Text at y: ${columnStartY.toFixed(2)}`);
                const englishLineInfos = calculateTextLines(prayer.english, englishFont, siddurConfig.fontSizes.blessingEnglish, columnWidth, siddurConfig.lineSpacing.defaultEnglishPrayer);
                const hebrewLineInfos = calculateTextLines(prayer.hebrew, hebrewFont, siddurConfig.fontSizes.blessingHebrew, columnWidth, siddurConfig.lineSpacing.defaultHebrewPrayer);

                console.log(`    [DEBUG] Drawing ${englishLineInfos.length} English lines.`);
                let tempEnglishY = columnStartY;
                for (const lineInfo of englishLineInfos) {
                    page.drawText(lineInfo.text, {
                        x: margin,
                        y: tempEnglishY + lineInfo.yOffset,
                        font: englishFont,
                        size: siddurConfig.fontSizes.blessingEnglish,
                        color: rgb(siddurConfig.colors.defaultText[0], siddurConfig.colors.defaultText[1], siddurConfig.colors.defaultText[2]),
                        lineHeight: siddurConfig.lineSpacing.defaultEnglishPrayer
                    });
                }

                console.log(`    [DEBUG] Drawing ${hebrewLineInfos.length} Hebrew lines.`);
                let tempHebrewY = columnStartY;
                for (const lineInfo of hebrewLineInfos) {
                    page.drawText(lineInfo.text, {
                        x: width / 2 + siddurConfig.layout.hebrewColumnXOffset,
                        y: tempHebrewY + lineInfo.yOffset,
                        font: hebrewFont,
                        size: siddurConfig.fontSizes.blessingHebrew,
                        color: rgb(siddurConfig.colors.defaultText[0], siddurConfig.colors.defaultText[1], siddurConfig.colors.defaultText[2]),
                        lineHeight: siddurConfig.lineSpacing.defaultHebrewPrayer
                    });
                }
                // I wonder if this is the good one
                y = Math.min(
                    tempEnglishY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
                    tempHebrewY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
                ) - siddurConfig.verticalSpacing.afterPrayerText;
                console.log(`  [DEBUG] line 315: Y after Prayer Text is now: ${y.toFixed(2)}`);
                commonPdfParams = { ...commonPdfParams, page, y };
            }
        }
    }
    console.log(`\n--- [DEBUG] FINISHED generateAshkenazContent ---`);
    return { page, y };
};