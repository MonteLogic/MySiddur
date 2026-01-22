import * as fs from 'fs';
import * as path from 'path';

// Define threshold for "major blank space" (in points)
// 72 points = 1 inch. Let's say 3 inches (216 points) is a major gap.
const BLANK_SPACE_THRESHOLD = 200; 

export interface ValidationResult {
    success: boolean;
    errors: string[];
}

export async function validatePdfWhitespace(pdfPath: string): Promise<ValidationResult> {
    console.log(`Analyzing PDF for blank spaces: ${pdfPath}`);
    const errors: string[] = [];
    
    // Use dynamic import for ESM module
    // Using legacy build for Node.js environment
    // @ts-ignore
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ 
        data,
        standardFontDataUrl: path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/')
    });
    const pdfDocument = await loadingTask.promise;

    console.log(`PDF loaded. Total pages: ${pdfDocument.numPages}`);

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract items with their Y position and Height
        // item.transform is [scaleX, skewY, skewX, scaleY, x, y]
        // y is usually transform[5]
        const items = textContent.items.map((item: any) => {
            const tx = item.transform;
            const y = tx[5]; 
            const height = item.height || 0; 
            // If height is 0, try to estimate from font size (transform[0] or transform[3])
            const estimatedHeight = height > 0 ? height : (tx[3] || 10);
            
            return {
                text: item.str,
                y: y,
                height: estimatedHeight,
                bottom: y, 
                top: y + estimatedHeight
            };
        });

        // Sort items by Y descending (top to bottom)
        items.sort((a: any, b: any) => b.y - a.y);

        // Filter out empty strings or whitespace-only items
        const validItems = items.filter((item: any) => item.text.trim().length > 0);

        if (validItems.length === 0) {
            console.warn(`⚠️  Page ${pageNum} appears to be empty.`);
            continue;
        }

        for (let i = 0; i < validItems.length - 1; i++) {
            const current = validItems[i];
            const next = validItems[i+1];
            
            const gap = current.y - next.y;
            
            if (gap > BLANK_SPACE_THRESHOLD) {
                const msg = `Major blank space detected on Page ${pageNum}. Gap size: ${gap.toFixed(2)} points. Between "${current.text.substring(0, 20)}..." and "${next.text.substring(0, 20)}..."`;
                console.error(`❌ ${msg}`);
                errors.push(msg);
            }
        }
        
        const lastItem = validItems[validItems.length - 1];
        if (lastItem.y > BLANK_SPACE_THRESHOLD + 50) { 
             console.warn(`⚠️  Large empty space at bottom of Page ${pageNum} (Last item at y=${lastItem.y.toFixed(2)})`);
        }
    }

    if (errors.length > 0) {
        console.error('\n❌ VRegression Testing FAILED: Major blank spaces detected.');
        return { success: false, errors };
    } else {
        console.log('\n✅ VRegression Testing PASSED: No major blank spaces detected.');
        return { success: true, errors: [] };
    }
}
