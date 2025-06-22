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
        textLines: { text: string, yOffset: number, font: PDFFont, size: number, color?: ReturnType<typeof rgb>, xOffset?: number, lineHeight: number }[]
    ) => { page: any, y: number };
}

export const generateAshkenazContent = (params: AshkenazContentGenerationParams): { page: any, y: number } => {
    let { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont, calculateTextLines, ensureSpaceAndDraw } = params;

    // Helper for passing common PDF generation parameters within this function
    let commonPdfParams = { pdfDoc, page, y, width, height, margin, englishFont, englishBoldFont, hebrewFont };


    for (const section of ashPrayerInfo.sections) {
        // Calculate approximate height needed for section title and description
        const sectionTitleTextHeight = englishBoldFont.heightAtSize(siddurConfig.fontSizes.sectionTitle) * (section.sectionTitle.length > siddurConfig.layout.sectionTitleLengthThreshold ? 2 : 1);
        const sectionDescTextHeight = englishFont.heightAtSize(siddurConfig.fontSizes.sectionDescription) * (section.description.length > siddurConfig.layout.sectionDescriptionLengthThreshold ? 3 : 1);
        
        // Adjusted estimatedSectionHeaderHeight to account for the new spacing after section title
        const estimatedSectionHeaderHeight = sectionTitleTextHeight + siddurConfig.verticalSpacing.afterSectionTitleText + sectionDescTextHeight + siddurConfig.lineSpacing.sectionDescription + siddurConfig.verticalSpacing.afterSectionDescription;

        // Check for page break for the section header
        if (y < siddurConfig.pdfMargins.bottom + estimatedSectionHeaderHeight + siddurConfig.verticalSpacing.pageBuffer) {
            page = pdfDoc.addPage();
            y = height - siddurConfig.pdfMargins.top;
            commonPdfParams = { ...commonPdfParams, page, y };
        }

        let lines = calculateTextLines(section.sectionTitle, englishBoldFont, siddurConfig.fontSizes.sectionTitle, width - margin * 2, siddurConfig.lineSpacing.sectionTitle);
        ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ 
            ...l, 
            font: englishBoldFont, 
            size: siddurConfig.fontSizes.sectionTitle, 
            color: rgb(siddurConfig.colors.sectionTitle[0], siddurConfig.colors.sectionTitle[1], siddurConfig.colors.sectionTitle[2]), 
            lineHeight: siddurConfig.lineSpacing.sectionTitle 
        }))));
        commonPdfParams = { ...commonPdfParams, page, y };

        // Apply the new spacing AFTER the section title text block
        y -= siddurConfig.verticalSpacing.afterSectionTitleText; // <--- This line adds the space

        lines = calculateTextLines(section.description, englishFont, siddurConfig.fontSizes.sectionDescription, width - margin * 2, siddurConfig.lineSpacing.sectionDescription);
        ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ 
            ...l, 
            font: englishFont, 
            size: siddurConfig.fontSizes.sectionDescription, 
            color: rgb(siddurConfig.colors.sectionDescription[0], siddurConfig.colors.sectionDescription[1], siddurConfig.colors.sectionDescription[2]), 
            lineHeight: siddurConfig.lineSpacing.sectionDescription 
        }))));
        commonPdfParams = { ...commonPdfParams, page, y };
        y -= siddurConfig.verticalSpacing.afterSectionDescription;

        for (const prayer of section.prayers as Prayer[]) {
            const prayerTitleTextHeight = englishBoldFont.heightAtSize(siddurConfig.fontSizes.prayerTitle) + siddurConfig.verticalSpacing.beforePrayerTitle;
            let estimatedPrayerContentHeight = 0;
            const columnWidth = width / 2 - margin - siddurConfig.layout.hebrewColumnXOffset;

            if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
                estimatedPrayerContentHeight = prayer.blessings.length * Math.max(siddurConfig.lineSpacing.blessingEnglish, siddurConfig.lineSpacing.blessingHebrew) + (prayer.blessings.length * siddurConfig.verticalSpacing.afterBlessingGroup);
            } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
                estimatedPrayerContentHeight = prayer.parts.length * Math.max(siddurConfig.lineSpacing.prayerPartEnglish, siddurConfig.lineSpacing.prayerPartHebrew) + (prayer.parts.length * siddurConfig.verticalSpacing.afterPartGroup);
            } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
                const englishLines = Math.ceil(englishFont.widthOfTextAtSize(prayer.english, siddurConfig.fontSizes.blessingEnglish) / columnWidth);
                const hebrewLines = Math.ceil(hebrewFont.widthOfTextAtSize(prayer.hebrew, siddurConfig.fontSizes.blessingHebrew) / columnWidth);
                estimatedPrayerContentHeight = Math.max(englishLines * siddurConfig.lineSpacing.defaultEnglishPrayer, hebrewLines * siddurConfig.lineSpacing.defaultHebrewPrayer) + siddurConfig.verticalSpacing.afterSimplePrayer;
            }

            if (y < siddurConfig.pdfMargins.bottom + prayerTitleTextHeight + estimatedPrayerContentHeight + siddurConfig.verticalSpacing.pageBuffer) {
                page = pdfDoc.addPage();
                y = height - siddurConfig.pdfMargins.top;
                commonPdfParams = { ...commonPdfParams, page, y };
            }

            lines = calculateTextLines(prayer.title, englishBoldFont, siddurConfig.fontSizes.prayerTitle, width - margin * 2, siddurConfig.lineSpacing.prayerTitle);
            ({ page, y } = ensureSpaceAndDraw({ ...commonPdfParams, page, y }, lines.map(l => ({ 
                ...l, 
                font: englishBoldFont, 
                size: siddurConfig.fontSizes.prayerTitle, 
                lineHeight: siddurConfig.lineSpacing.prayerTitle 
            }))));
            commonPdfParams = { ...commonPdfParams, page, y };
            y -= siddurConfig.verticalSpacing.beforePrayerTitle;

            const columnStartY = y;

            if ('blessings' in prayer && Array.isArray(prayer.blessings)) {
                let blessingY = columnStartY;
                for (const blessing of prayer.blessings) {
                    const englishLineInfos = calculateTextLines(blessing.english, englishFont, siddurConfig.fontSizes.blessingEnglish, columnWidth, siddurConfig.lineSpacing.blessingEnglish);
                    const hebrewLineInfos = calculateTextLines(blessing.hebrew, hebrewFont, siddurConfig.fontSizes.blessingHebrew, columnWidth, siddurConfig.lineSpacing.blessingHebrew);

                    const estimatedBlessingHeight = Math.max(
                        englishLineInfos.length * siddurConfig.lineSpacing.blessingEnglish,
                        hebrewLineInfos.length * siddurConfig.lineSpacing.blessingHebrew
                    ) + siddurConfig.verticalSpacing.afterBlessingGroup;

                    if (blessingY - estimatedBlessingHeight < siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer) {
                         page = pdfDoc.addPage();
                         blessingY = height - siddurConfig.pdfMargins.top;
                         commonPdfParams = { ...commonPdfParams, page, y: blessingY };
                    }
                    
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
                }
                y = blessingY;
                commonPdfParams = { ...commonPdfParams, page, y };
            } else if ('parts' in prayer && Array.isArray(prayer.parts)) {
                let partY = columnStartY;
                for (const part of prayer.parts) {
                    let sourceLines: { text: string, yOffset: number }[] = [];
                    if (part.source) {
                        sourceLines = calculateTextLines(`Source: ${part.source}`, englishFont, siddurConfig.fontSizes.prayerPartSource, columnWidth, siddurConfig.lineSpacing.prayerPartSource);
                    }
                    const englishLineInfos = calculateTextLines(part.english, englishFont, siddurConfig.fontSizes.prayerPartEnglish, columnWidth, siddurConfig.lineSpacing.prayerPartEnglish);
                    const hebrewLineInfos = calculateTextLines(part.hebrew, hebrewFont, siddurConfig.fontSizes.prayerPartHebrew, columnWidth, siddurConfig.lineSpacing.prayerPartHebrew);

                    const estimatedPartHeight = 
                        (sourceLines.length * siddurConfig.lineSpacing.prayerPartSource) +
                        Math.max(
                            englishLineInfos.length * siddurConfig.lineSpacing.prayerPartEnglish,
                            hebrewLineInfos.length * siddurConfig.lineSpacing.prayerPartHebrew
                        ) + siddurConfig.verticalSpacing.afterPartGroup;

                    if (partY - estimatedPartHeight < siddurConfig.pdfMargins.bottom + siddurConfig.verticalSpacing.pageBuffer) {
                        page = pdfDoc.addPage();
                        partY = height - siddurConfig.pdfMargins.top;
                        commonPdfParams = { ...commonPdfParams, page, y: partY };
                    }
                    
                    if (part.source) {
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
                    }

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
                }
                y = partY;
                commonPdfParams = { ...commonPdfParams, page, y };
            } else if ('hebrew' in prayer && prayer.hebrew && 'english' in prayer && prayer.english) {
                const englishLineInfos = calculateTextLines(prayer.english, englishFont, siddurConfig.fontSizes.blessingEnglish, columnWidth, siddurConfig.lineSpacing.defaultEnglishPrayer);
                const hebrewLineInfos = calculateTextLines(prayer.hebrew, hebrewFont, siddurConfig.fontSizes.blessingHebrew, columnWidth, siddurConfig.lineSpacing.defaultHebrewPrayer);

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
                y = Math.min(
                    tempEnglishY + (englishLineInfos.length > 0 ? englishLineInfos[englishLineInfos.length - 1].yOffset : 0),
                    tempHebrewY + (hebrewLineInfos.length > 0 ? hebrewLineInfos[hebrewLineInfos.length - 1].yOffset : 0)
                ) - siddurConfig.verticalSpacing.afterSimplePrayer;
                commonPdfParams = { ...commonPdfParams, page, y };
            }
        }
    }
    return { page, y };
};