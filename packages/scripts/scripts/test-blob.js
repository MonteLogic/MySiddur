const { put } = require('@vercel/blob');
require('dotenv').config({ path: '.env.local' });

async function testUpload() {
    try {
        console.log('Attempting to upload to Vercel Blob...');
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error('❌ BLOB_READ_WRITE_TOKEN is missing in environment variables.');
            return;
        }

        const blob = await put('test-upload.txt', 'Hello Vercel Blob!', {
            access: 'public',
            token: process.env.my_siddur_1_READ_WRITE_TOKEN,
        });

        console.log('✅ Upload successful!');
        console.log('URL:', blob.url);
    } catch (error) {
        console.error('❌ Upload failed:', error);
    }
}

testUpload();
