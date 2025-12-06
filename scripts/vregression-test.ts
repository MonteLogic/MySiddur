
import * as fs from 'fs';
import * as path from 'path';
// Define threshold for "major blank space" (in points)
// 72 points = 1 inch. Let's say 3 inches (216 points) is a major gap.
const BLANK_SPACE_THRESHOLD = 200; 

async function validatePdfWhitespace(pdfPath: string) {
    console.log(`Analyzing PDF for blank spaces: ${pdfPath}`);
    
    // Dynamic import for ESM module
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ 
        data,
        standardFontDataUrl: path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/')
    });
    const pdfDocument = await loadingTask.promise;

    console.log(`PDF loaded. Total pages: ${pdfDocument.numPages}`);

    let hasErrors = false;

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });
        const pageHeight = viewport.height;

        // Extract items with their Y position and Height
        // item.transform is [scaleX, skewY, skewX, scaleY, x, y]
        // y is usually transform[5]
        const items = textContent.items.map((item: any) => {
            const tx = item.transform;
            const y = tx[5]; 
            const height = item.height || 0; // Sometimes height is 0 or not present in simple text items
             // If height is 0, try to estimate from font size (transform[0] or transform[3])
            const estimatedHeight = height > 0 ? height : (tx[3] || 10);
            
            return {
                text: item.str,
                y: y,
                height: estimatedHeight,
                bottom: y, // text is usually drawn from baseline
                top: y + estimatedHeight
            };
        });

        // Sort items by Y descending (top to bottom)
        items.sort((a: any, b: any) => b.y - a.y);

        // Filter out empty strings or whitespace-only items
        const validItems = items.filter((item: any) => item.text.trim().length > 0);

        if (validItems.length === 0) {
            console.warn(`⚠️  Page ${pageNum} appears to be empty.`);
            // An empty page is definitely a "major blank space"
            continue;
        }

        // Check for gaps
        let previousBottom = validItems[0].y; // Start from the top-most item's baseline (approx)
        // Actually, let's use the top of the page as the start? 
        // Or just check gaps between text blocks.
        
        // Let's track the "lowest point seen so far" as we iterate down
        // But since we sorted by Y desc, we are going down.
        
        // Initial "previous" is the top margin area.
        // Let's just compare adjacent items.
        
        for (let i = 0; i < validItems.length - 1; i++) {
            const current = validItems[i];
            const next = validItems[i+1];
            
            // Current is above Next.
            // Gap is roughly: (Current.y) - (Next.y + Next.height)
            // But text baseline is y. So Current sits at y. Next sits at next.y.
            // The space between them is current.y - next.y (approx).
            // We should subtract the height of the text? 
            // Usually we care about visual whitespace.
            
            const gap = current.y - next.y;
            
            // If gap is huge, flag it.
            // We need to account for the fact that 'current' has some height.
            // But usually y is baseline. So the gap starts 'below' current's baseline?
            // Actually, if we just measure baseline to baseline, 200 pts is huge.
            
            if (gap > BLANK_SPACE_THRESHOLD) {
                console.error(`❌ Major blank space detected on Page ${pageNum}`);
                console.error(`   Gap size: ${gap.toFixed(2)} points`);
                console.error(`   Between text: "${current.text.substring(0, 20)}..." (y=${current.y.toFixed(2)})`);
                console.error(`   And text: "${next.text.substring(0, 20)}..." (y=${next.y.toFixed(2)})`);
                hasErrors = true;
            }
        }
        
        // Check bottom margin? 
        // If the last item is very high up, there's a blank space at the bottom.
        const lastItem = validItems[validItems.length - 1];
        if (lastItem.y > BLANK_SPACE_THRESHOLD + 50) { // +50 for margin
             console.warn(`⚠️  Large empty space at bottom of Page ${pageNum} (Last item at y=${lastItem.y.toFixed(2)})`);
             // This might be okay for the end of a section, but maybe worth noting.
             // User specifically mentioned "breaking at the new page... creating big blank spaces in between the text".
             // So gaps *between* text are the priority.
        }
    }

    if (hasErrors) {
        console.error('\n❌ VRegression Testing FAILED: Major blank spaces detected.');
        process.exit(1);
    } else {
        console.log('\n✅ VRegression Testing PASSED: No major blank spaces detected.');
    }
}

// Get PDF path from args or default to 'dev-siddur.pdf'
const pdfPath = process.argv[2] || path.join(process.cwd(), 'dev-siddur.pdf');

if (!fs.existsSync(pdfPath)) {
    console.error(`PDF file not found: ${pdfPath}`);
    console.error('Run "pnpm run generate-dev-pdf" first.');
    process.exit(1);
}

validatePdfWhitespace(pdfPath);
