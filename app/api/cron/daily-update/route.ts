import { NextRequest, NextResponse } from 'next/server';
import { generateAndUploadSiddurLogic } from '@mysiddur/core';

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
        // 1. Generate Color Version
        console.log('Starting Daily Update: Color Version');
        const colorResult = await generateAndUploadSiddurLogic(undefined, { printBlackAndWhite: false });
        
        // 2. Generate Black & White Version
        console.log('Starting Daily Update: Black & White Version');
        const bwResult = await generateAndUploadSiddurLogic(undefined, { printBlackAndWhite: true });

        const results = {
            color: {
                success: colorResult.success,
                url: colorResult.url,
                error: colorResult.error
            },
            bw: {
                success: bwResult.success,
                url: bwResult.url,
                error: bwResult.error
            }
        };

        if (colorResult.success && bwResult.success) {
            return NextResponse.json({ 
                message: 'Both Siddur versions generated and uploaded successfully', 
                results
            });
        } else {
            return NextResponse.json({ 
                error: 'One or more generations failed', 
                results
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
