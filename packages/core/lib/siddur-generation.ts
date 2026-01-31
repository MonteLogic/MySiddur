import { generateSiddurPDF, SiddurFormat } from './siddur-pdf-utils/ashkenaz/siddurMainFile';
import { put, list } from '@vercel/blob';
import { validatePdfWhitespace, PdfValidationResult } from './pdf-validation';
import * as path from 'path';
import * as fs from 'fs';

export interface GenerationResult {
    success: boolean;
    url?: string;
    error?: string;
    validationErrors?: string[];
}

export interface SiddurHistoryItem {
    date: string;
    url: string;
    timestamp: string;
    status: 'success' | 'failed';
    error?: string;
    layout?: string;
    colorScheme?: string;
}

const HISTORY_FILENAME = 'siddur-history.json';

export async function generateAndUploadSiddurLogic(
    token?: string, 
    options?: { style?: string; printBlackAndWhite?: boolean }
): Promise<GenerationResult> {
    const tempPdfPath = path.join('/tmp', `temp-siddur-${Date.now()}.pdf`);
    
    try {
        console.log('Starting Siddur Generation Logic...');

        const params = {
            selectedDate: new Date().toISOString(),
            siddurFormat: SiddurFormat.NusachAshkenaz,
            userName: 'Production User',
            style: options?.style || 'Recommended',
            pageMargins: 'normal' as const,
            printBlackAndWhite: options?.printBlackAndWhite ?? false,
        };

        console.log('Generating PDF with params:', JSON.stringify(params, null, 2));
        const pdfBytes = await generateSiddurPDF(params);
        console.log('PDF Generated. Size:', pdfBytes.length, 'bytes');

        // Save to temp file for validation
        // Use /tmp for serverless environment compatibility
        fs.writeFileSync(tempPdfPath, pdfBytes);

        // Run VRegression Test
        console.log('Running VRegression Test...');
        const validationResult = await validatePdfWhitespace(tempPdfPath);
        
        if (!validationResult.success) {
            console.error('❌ VRegression Test Failed.');
            // We might still want to record the failure in history?
            // For now, let's abort upload.
            return {
                success: false,
                error: 'Validation Failed',
                validationErrors: validationResult.errors
            };
        }
        console.log('✅ VRegression Test Passed.');

        console.log('Uploading to Vercel Blob...');
        const filename = `siddur-${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Use provided token or env var
        const blobToken = token || process.env.BLOB_READ_WRITE_TOKEN || process.env.my_siddur_1_READ_WRITE_TOKEN;
        
        if (!blobToken) {
             throw new Error('No BLOB_READ_WRITE_TOKEN found');
        }

        const blob = await put(filename, Buffer.from(pdfBytes), {
            access: 'public',
            token: blobToken,
            addRandomSuffix: true // Ensure unique filename for every generation
        });

        console.log('✅ Upload successful!', blob.url);

        // Update History
        await updateHistory(blob.url, blobToken, params.style, params.printBlackAndWhite ? 'Black & White' : 'Color');

        return {
            success: true,
            url: blob.url
        };

    } catch (error: any) {
        console.error('❌ Error in generateAndUploadSiddurLogic:', error);
        return {
            success: false,
            error: error.message || String(error)
        };
    } finally {
        if (fs.existsSync(tempPdfPath)) {
            fs.unlinkSync(tempPdfPath);
        }
    }
}

async function updateHistory(newUrl: string, token: string, layout: string, colorScheme: string) {
    try {
        console.log('Updating History...');
        // 1. Fetch existing history
        // We need to find the history file URL first.
        // Since we can't easily "get" by filename without the URL in Vercel Blob (unless we list),
        // we'll list files to find it.
        
        let history: SiddurHistoryItem[] = [];
        let historyBlobUrl = '';

        const { blobs } = await list({ token });
        const historyBlob = blobs.find(b => b.pathname === HISTORY_FILENAME);

        if (historyBlob) {
            historyBlobUrl = historyBlob.url;
            const response = await fetch(historyBlobUrl);
            if (response.ok) {
                history = await response.json();
            }
        }

        // 2. Append new item
        const newItem: SiddurHistoryItem = {
            date: new Date().toISOString().split('T')[0],
            url: newUrl,
            timestamp: new Date().toISOString(),
            status: 'success',
            layout: layout,
            colorScheme: colorScheme
        };
        
        // Prepend to keep newest first
        history.unshift(newItem);
        
        // Keep only last 30 entries?
        if (history.length > 30) {
            history = history.slice(0, 30);
        }

        // 3. Upload updated history
        await put(HISTORY_FILENAME, JSON.stringify(history, null, 2), {
            access: 'public',
            token: token,
            addRandomSuffix: false, // Keep filename constant
            allowOverwrite: true // Explicitly allow overwriting the history file
        });
        
        console.log('History updated.');

    } catch (error) {
        console.error('Failed to update history:', error);
        // Don't fail the whole process if history update fails
    }
}

export async function getHistory(token?: string): Promise<SiddurHistoryItem[]> {
    try {
        const blobToken = token || process.env.BLOB_READ_WRITE_TOKEN || process.env.my_siddur_1_READ_WRITE_TOKEN;
        if (!blobToken) return [];

        const { blobs } = await list({ token: blobToken });
        const historyBlob = blobs.find(b => b.pathname === HISTORY_FILENAME);

        if (historyBlob) {
            const response = await fetch(historyBlob.url, { cache: 'no-store' }); // Ensure fresh data
            if (response.ok) {
                return await response.json();
            }
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch history:', error);
        return [];
    }
}
