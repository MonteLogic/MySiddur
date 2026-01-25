'use server';

// import { generateAndUploadSiddurLogic } from '@mysiddur/core/generation';

import { generateAndUploadSiddurLogic } from '@mysiddur/core';
import { revalidatePath } from 'next/cache';

export async function triggerGenerationAction(
    style: string = 'Recommended',
    printBlackAndWhite: boolean = false
) {
    // Check for admin role/permissions if needed (Clerk middleware should handle route protection)
    
    try {
        const result = await generateAndUploadSiddurLogic(undefined, {
            style,
            printBlackAndWhite
        });
        
        if (result.success) {
            revalidatePath('/admin');
            return { success: true, message: 'Generation triggered successfully!' };
        } else {
            return { success: false, message: `Generation failed: ${result.error}` };
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return { success: false, message: `Unexpected error: ${errorMessage}` };
    }
}
