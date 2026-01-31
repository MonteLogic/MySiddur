import type { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: NextRequest): Promise<Response | ImageResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const isLight = req.headers.get('Sec-CH-Prefers-Color-Scheme') === 'light';

    const title = searchParams.has('title')
      ? searchParams.get('title')
      : 'App Router Playground';

    const bgColor = isLight ? '#ffffff' : '#000000';
    const textColor = isLight ? '#000000' : '#ffffff';
    const gridColor = isLight ? '#e5e5e5' : '#333333';
    const accentColor = isLight ? '#666666' : '#0066ff';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: bgColor,
            position: 'relative',
          }}
        >
          {/* Grid pattern using CSS */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              opacity: 0.5,
            }}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at center, transparent 0%, ${bgColor} 70%)`,
            }}
          />
          {/* Logo placeholder */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '80px',
              height: '80px',
              backgroundColor: isLight ? '#f0f0f0' : 'rgba(255,255,255,0.1)',
              borderRadius: '16px',
              marginBottom: '24px',
              border: `2px solid ${gridColor}`,
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: accentColor,
              }}
            >
              ▲
            </div>
          </div>
          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: '48px',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              color: textColor,
              textAlign: 'center',
              maxWidth: '750px',
              padding: '0 40px',
            }}
          >
            {title}
          </div>
        </div>
      ),
      {
        width: 843,
        height: 441,
      },
    );
  } catch (e) {
    if (!(e instanceof Error)) throw e;

    // eslint-disable-next-line no-console
    console.log(e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
