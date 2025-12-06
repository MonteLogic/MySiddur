
import { generateSiddurPDF, SiddurFormat } from '../lib/siddur-pdf-utils/ashkenaz/siddurMainFile';
import { put } from '@vercel/blob';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function generateAndUploadSiddur() {
    try {
        console.log('Starting Siddur Generation and Upload...');

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
             // Fallback to check for specific token if generic one is missing, based on test-blob.js
             if (!process.env.my_siddur_1_READ_WRITE_TOKEN) {
                console.error('❌ BLOB_READ_WRITE_TOKEN or my_siddur_1_READ_WRITE_TOKEN is missing.');
                process.exit(1);
             }
        }

        const params = {
            selectedDate: new Date().toISOString(),
            siddurFormat: SiddurFormat.NusachAshkenaz,
            userName: 'Production User',
            style: 'Recommended',
            pageMargins: 'normal' as const,
            printBlackAndWhite: false,
        };

        console.log('Generating PDF...');
        const pdfBytes = await generateSiddurPDF(params);
        console.log('PDF Generated. Size:', pdfBytes.length, 'bytes');

        // Save to temp file for validation
        const tempPdfPath = path.join(process.cwd(), 'temp-siddur.pdf');
        fs.writeFileSync(tempPdfPath, pdfBytes);

        // Run VRegression Test
        console.log('Running VRegression Test...');
        try {
            const { execSync } = require('child_process');
            execSync(`npx ts-node -r tsconfig-paths/register -O '{"module": "CommonJS"}' scripts/vregression-test.ts ${tempPdfPath}`, { stdio: 'inherit' });
            console.log('✅ VRegression Test Passed.');
        } catch (error) {
            console.error('❌ VRegression Test Failed. Aborting upload.');
            // fs.unlinkSync(tempPdfPath); // Keep for debugging?
            process.exit(1);
        }

        console.log('Uploading to Vercel Blob...');
        const filename = `siddur-${new Date().toISOString().split('T')[0]}.pdf`;
        
        const blob = await put(filename, Buffer.from(pdfBytes), {
            access: 'public',
            // Use the token from env if put doesn't pick it up automatically, 
            // though @vercel/blob usually does if BLOB_READ_WRITE_TOKEN is set.
            // If using a specific token name like in test-blob.js:
            token: process.env.BLOB_READ_WRITE_TOKEN || process.env.my_siddur_1_READ_WRITE_TOKEN
        });

        console.log('✅ Upload successful!');
        console.log('Download URL:', blob.url);
        
        // Cleanup
        fs.unlinkSync(tempPdfPath);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

generateAndUploadSiddur();
