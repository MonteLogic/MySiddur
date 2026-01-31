import { generateAndUploadSiddurLogic } from '@mysiddur/core';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
    const result = await generateAndUploadSiddurLogic();
    
    if (result.success) {
        console.log('Script finished successfully.');
        process.exit(0);
    } else {
        console.error('Script failed:', result.error);
        if (result.validationErrors) {
            console.error('Validation Errors:', result.validationErrors);
        }
        process.exit(1);
    }
}

main();
