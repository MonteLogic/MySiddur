'use server';

import { generateAndUploadSiddurLogic } from '@/packages/core/lib/siddur-generation';
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
    } catch (error: any) {
        return { success: false, message: `Unexpected error: ${error.message}` };
    }
}
