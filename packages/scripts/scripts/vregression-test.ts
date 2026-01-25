import { validatePdfWhitespace } from '#/packages/core/lib';
import * as fs from 'fs';
import * as path from 'path';

// Only run if called directly
if (require.main === module) {
    (async () => {
        // Get PDF path from args or default to 'dev-siddur.pdf'
        const pdfPath = process.argv[2] || path.join(process.cwd(), 'dev-siddur.pdf');

        if (!fs.existsSync(pdfPath)) {
            console.error(`PDF file not found: ${pdfPath}`);
            console.error('Run "pnpm run generate-dev-pdf" first.');
            process.exit(1);
        }

        const result = await validatePdfWhitespace(pdfPath);
        if (!result.success) {
            process.exit(1);
        }
    })();
}

