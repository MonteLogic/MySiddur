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
        textLines: { text: string, yOffset: number, font: PDFFont, size: number, color?: ReturnType<typeof rgb>, xOffset?: number, lineHeight: number }[]
    ) => { page: any, y: number };
}

export const generateAshkenazContent = (params: AshkenazContentGenerationParams): { page: any, y: number } => {
    let { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont, calculateTextLines, ensureSpaceAndDraw } = params;

    // Helper for passing common PDF generation parameters within this function
    let commonPdfParams = { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont };


    for (const section of ashPrayerInfo.sections) {
        // Calculate approximate height needed for section title and description
        const sectionTitleTextHeight = englishBoldFont.heightAtSize(18) * (section.sectionTitle.length > 50 ? 2 : 1);
        const sectionDescTextHeight = englishFont.heightAtSize(10) * (section.description.length > 100 ? 3 : 1);
        const estimatedSectionHeaderHeight = sectionTitleTextHeight + siddurConfig.lineSpacing.sectionDescription + sectionDescTextHeight + siddurConfig.verticalSpacing.afterSectionDescription;

        // Check for page break for the section header
        if (y < siddurConfig.pdfMargins.bottom + estimatedSectionHeaderHeight) {
            page = pdfDoc.addPage();
            y = height - siddurConfig.pdfMargins.top;
            commonPdfParams = { ...commonPdfParams, page, y }; // Update common params with new page/y
        }

        let lines = calculateTextLines(section.sectionTitle, englishBoldFont, 18, width - margin * 2, siddurConfig.lineSpacing.sectionTitle);
        ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ ...l, font: englishBoldFont, size: 18, color: rgb(0.1, 0.1, 0.1), lineHeight: siddurConfig.lineSpacing.sectionTitle }))));
        commonPdfParams = { ...commonPdfParams, page, y }; // Update common params
        
        lines = calculateTextLines(section.description, englishFont, 10, width - margin * 2, siddurConfig.lineSpacing.sectionDescription);
        ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ ...l, font: englishFont, size: 10, color: rgb(0.3, 0.3, 0.3), lineHeight: siddurConfig.lineSpacing.sectionDescription }))));
        commonPdfParams = { ...commonPdfParams, page, y }; // Update common params
        y -= siddurConfig.verticalSpacing.afterSectionDescription;

        for (const prayer of section.prayers as Prayer[]) {
            const prayerTitleTextHeight = englishBoldFont.heightAtSize(14) + siddurConfig.verticalSpacing.beforePrayerTitle;
            let estimatedPrayerContentHeight = 0;
            const columnWidth = width / 2 - margin - 10;

            if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
                estimatedPrayerContentHeight = prayer.blessings.length * Math.max(siddurConfig.lineSpacing.blessingEnglish, siddurConfig.lineSpacing.blessingHebrew) + (prayer.blessings.length * siddurConfig.verticalSpacing.afterBlessingGroup);
            } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
                estimatedPrayerContentHeight = prayer.parts.length * Math.max(siddurConfig.lineSpacing.prayerPartEnglish, siddurConfig.lineSpacing.prayerPartHebrew) + (prayer.parts.length * siddurConfig.verticalSpacing.afterPartGroup);
            } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
                const englishLines = Math.ceil(englishFont.widthOfTextAtSize(prayer.english, 12) / columnWidth);
                const hebrewLines = Math.ceil(hebrewFont.widthOfTextAtSize(prayer.hebrew, 14) / columnWidth);
                estimatedPrayerContentHeight = Math.max(englishLines * siddurConfig.lineSpacing.defaultEnglishPrayer, hebrewLines * siddurConfig.lineSpacing.defaultHebrewPrayer) + siddurConfig.verticalSpacing.afterSimplePrayer;
            }

            // Check for page break for the prayer itself
            if (y < siddurConfig.pdfMargins.bottom + prayerTitleTextHeight + estimatedPrayerContentHeight) {
                page = pdfDoc.addPage();
                y = height - siddurConfig.pdfMargins.top;
                commonPdfParams = { ...commonPdfParams, page, y }; // Update common params
            }

            // Draw prayer title
            lines = calculateTextLines(prayer.title, englishBoldFont, 14, width - margin * 2, siddurConfig.lineSpacing.prayerTitle);
            ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ ...l, font: englishBoldFont, size: 14, lineHeight: siddurConfig.lineSpacing.prayerTitle }))));
            commonPdfParams = { ...commonPdfParams, page, y }; // Update common params
            y -= siddurConfig.verticalSpacing.beforePrayerTitle;

            const columnStartY = y; // Save current Y before drawing columns

            if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
                let blessingY = columnStartY;
                for (const blessing of prayer.blessings) {
                    const englishLineInfos = calculateTextLines(blessing.english, englishFont, 12, columnWidth, siddurConfig.lineSpacing.blessingEnglish);
                    const hebrewLineInfos = calculateTextLines(blessing.hebrew, hebrewFont, 14, columnWidth, siddurConfig.lineSpacing.blessingHebrew);

                    // Estimate height for this blessing pair
                    const estimatedBlessingHeight = Math.max(
                        englishLineInfos.length * siddurConfig.lineSpacing.blessingEnglish,
                        hebrewLineInfos.length * siddurConfig.lineSpacing.blessingHebrew
                    ) + siddurConfig.verticalSpacing.afterBlessingGroup;

                    if (blessingY - estimatedBlessingHeight < siddurConfig.pdfMargins.bottom) {
                         page = pdfDoc.addPage();
                         blessingY = height - siddurConfig.pdfMargins.top;
                         commonPdfParams = { ...commonPdfParams, page, y: blessingY }; // Update common params for new page
                    }
                    
                    // Draw English blessing
                    for (const lineInfo of englishLineInfos) {
                        page.drawText(lineInfo.text, {
                            x: margin,
                            y: blessingY + lineInfo.yOffset,
                            font: englishFont,
                            size: 12,
                            color: rgb(0, 0, 0),
                            lineHeight: siddurConfig.lineSpacing.blessingEnglish
                        });
                    }

                    // Draw Hebrew blessing
                    for (const lineInfo of hebrewLineInfos) {
                        page.drawText(lineInfo.text, {
                            x: width / 2 + 10,
                            y: blessingY + lineInfo.yOffset,
                            font: hebrewFont,
                            size: 14,
                            color: rgb(0, 0, 0),
                            lineHeight: siddurConfig.lineSpacing.blessingHebrew
                        });
                    }
                    blessingY = Math.min(
                        blessingY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
                        blessingY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
                    ) - siddurConfig.verticalSpacing.afterBlessingGroup;
                }
                y = blessingY;
                commonPdfParams = { ...commonPdfParams, page, y }; // Update common params
            } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
                let partY = columnStartY;
                for (const part of prayer.parts) {
                    let sourceLines: { text: string, yOffset: number }[] = [];
                    if (part.source) {
                        sourceLines = calculateTextLines(`Source: ${part.source}`, englishFont, 9, columnWidth, siddurConfig.lineSpacing.prayerPartSource);
                    }
                    const englishLineInfos = calculateTextLines(part.english, englishFont, 12, columnWidth, siddurConfig.lineSpacing.prayerPartEnglish);
                    const hebrewLineInfos = calculateTextLines(part.hebrew, hebrewFont, 14, columnWidth, siddurConfig.lineSpacing.prayerPartHebrew);

                    // Estimate height for this part (including source, English, and Hebrew)
                    const estimatedPartHeight = 
                        (sourceLines.length * siddurConfig.lineSpacing.prayerPartSource) +
                        Math.max(
                            englishLineInfos.length * siddurConfig.lineSpacing.prayerPartEnglish,
                            hebrewLineInfos.length * siddurConfig.lineSpacing.prayerPartHebrew
                        ) + siddurConfig.verticalSpacing.afterPartGroup;

                    if (partY - estimatedPartHeight < siddurConfig.pdfMargins.bottom) {
                        page = pdfDoc.addPage();
                        partY = height - siddurConfig.pdfMargins.top;
                        commonPdfParams = { ...commonPdfParams, page, y: partY }; // Update common params for new page
                    }
                    
                    // Draw Source if exists
                    if (part.source) {
                        for (const lineInfo of sourceLines) {
                            page.drawText(lineInfo.text, {
                                x: margin,
                                y: partY + lineInfo.yOffset,
                                font: englishFont,
                                size: 9,
                                color: rgb(0.5, 0.5, 0.5),
                                lineHeight: siddurConfig.lineSpacing.prayerPartSource
                            });
                        }
                        partY += (sourceLines.length > 0 ? sourceLines[sourceLines.length - 1].yOffset : 0); // Update Y for next lines
                    }

                    // Drawing English
                    let tempEnglishY = partY;
                    for (const lineInfo of englishLineInfos) {
                        page.drawText(lineInfo.text, {
                            x: margin,
                            y: tempEnglishY + lineInfo.yOffset,
                            font: englishFont,
                            size: 12,
                            color: rgb(0, 0, 0),
                            lineHeight: siddurConfig.lineSpacing.prayerPartEnglish
                        });
                    }

                    // Drawing Hebrew
                    let tempHebrewY = partY;
                    for (const lineInfo of hebrewLineInfos) {
                        page.drawText(lineInfo.text, {
                            x: width / 2 + 10,
                            y: tempHebrewY + lineInfo.yOffset,
                            font: hebrewFont,
                            size: 14,
                            color: rgb(0, 0, 0),
                            lineHeight: siddurConfig.lineSpacing.prayerPartHebrew
                        });
                    }
                    partY = Math.min(
                        tempEnglishY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
                        tempHebrewY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
                    ) - siddurConfig.verticalSpacing.afterPartGroup;
                }
                y = partY;
                commonPdfParams = { ...commonPdfParams, page, y }; // Update common params
            } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
                const englishLineInfos = calculateTextLines(prayer.english, englishFont, 12, columnWidth, siddurConfig.lineSpacing.defaultEnglishPrayer);
                const hebrewLineInfos = calculateTextLines(prayer.hebrew, hebrewFont, 14, columnWidth, siddurConfig.lineSpacing.defaultHebrewPrayer);

                // Drawing English
                let tempEnglishY = columnStartY;
                for (const lineInfo of englishLineInfos) {
                    page.drawText(lineInfo.text, {
                        x: margin,
                        y: tempEnglishY + lineInfo.yOffset,
                        font: englishFont,
                        size: 12,
                        color: rgb(0, 0, 0),
                        lineHeight: siddurConfig.lineSpacing.defaultEnglishPrayer
                    });
                }

                // Drawing Hebrew
                let tempHebrewY = columnStartY;
                for (const lineInfo of hebrewLineInfos) {
                    page.drawText(lineInfo.text, {
                        x: width / 2 + 10,
                        y: tempHebrewY + lineInfo.yOffset,
                        font: hebrewFont,
                        size: 14,
                        color: rgb(0, 0, 0),
                        lineHeight: siddurConfig.lineSpacing.defaultHebrewPrayer
                    });
                }
                y = Math.min(
                    tempEnglishY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
                    tempHebrewY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
                ) - siddurConfig.verticalSpacing.afterSimplePrayer;
                commonPdfParams = { ...commonPdfParams, page, y }; // Update common params
            }
        }
    }
    return { page, y };
};