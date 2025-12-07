import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/siddur-generation';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const history = await getHistory();
        // Find the first successful entry
        const latest = history.find(item => item.status === 'success' && item.url);

        if (latest) {
            return NextResponse.json({
                success: true,
                url: latest.url,
                date: latest.date,
                timestamp: latest.timestamp
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
