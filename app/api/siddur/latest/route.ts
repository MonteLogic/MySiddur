import { NextResponse } from 'next/server';
import { getHistory } from '@mysiddur/core';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const printBlackAndWhite = searchParams.get('printBlackAndWhite') === 'true';
        const targetColorScheme = printBlackAndWhite ? 'Black & White' : 'Color';

        const history = await getHistory();
        // Find the first successful entry matching the color scheme
        const latest = history.find(item => 
            item.status === 'success' && 
            item.url && 
            (item.colorScheme === targetColorScheme || (!item.colorScheme && !printBlackAndWhite)) // Fallback for old entries
        );

        if (latest) {
            return NextResponse.json({
                success: true,
                url: latest.url,
                date: latest.date,
                timestamp: latest.timestamp,
                colorScheme: latest.colorScheme
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'No generated Siddur found'
            }, { status: 404 });
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}
