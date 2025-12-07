'use server';

import { generateAndUploadSiddurLogic } from '@/lib/siddur-generation';
import { revalidatePath } from 'next/cache';

export async function triggerGenerationAction() {
    try {
        const result = await generateAndUploadSiddurLogic();
        revalidatePath('/admin');
        return result;
    } catch (error: any) {
        return {
            success: false,
            error: error.message || String(error)
        };
    }
}
