import { NextRequest, NextResponse } from 'next/server';
import { generateAndUploadSiddurLogic } from '@/lib/siddur-generation';

export const maxDuration = 300; // 5 minutes timeout for generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    
    // Verify Cron Secret
    // Vercel automatically sets CRON_SECRET in production
    // For local testing, you can set CRON_SECRET in .env.local
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await generateAndUploadSiddurLogic();

        if (result.success) {
            return NextResponse.json({ 
                message: 'Siddur generated and uploaded successfully', 
                url: result.url 
            });
        } else {
            return NextResponse.json({ 
                error: 'Generation failed', 
                details: result.error,
                validationErrors: result.validationErrors 
            }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            details: error.message 
        }, { status: 500 });
    }
}
