
async function testImport() {
    try {
        console.log('Attempting to import pdfjs-dist/legacy/build/pdf.mjs');
        const pdfjsLibMjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        console.log('Success .mjs:', Object.keys(pdfjsLibMjs));
        if (pdfjsLibMjs.getDocument) console.log('Found getDocument in .mjs');
    } catch (e) {
        console.error('Error importing .mjs:', e);
    }

    try {
        console.log('Attempting to import pdfjs-dist/legacy/build/pdf.js');
        const pdfjsLibJs = await import('pdfjs-dist/legacy/build/pdf.js');
        console.log('Success .js:', Object.keys(pdfjsLibJs));
        if (pdfjsLibJs.getDocument) console.log('Found getDocument in .js');
        if (pdfjsLibJs.default && pdfjsLibJs.default.getDocument) console.log('Found getDocument in .js default');
    } catch (e) {
        console.error('Error importing .js:', e);
    }
}

testImport();
