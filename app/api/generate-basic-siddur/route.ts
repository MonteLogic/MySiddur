// app/api/generate-basic-siddur/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateSiddurPDF, SiddurFormat } from '#/lib/siddur-pdf-utils/ashkenaz/siddurMainFile'; // Adjust path as needed

export async function GET(request: NextRequest) {
  // For GET requests, parameters are typically in the search params (URL query)
  const searchParams = request.nextUrl.searchParams;
  const formatParam = searchParams.get('format');
  const userNameParam = searchParams.get('userName');
  const dateParam = searchParams.get('date') || new Date().toISOString();
  const styleParam = searchParams.get('style') || 'Recommended'; // Add style parameter

  let siddurFormat: SiddurFormat;
  if (formatParam === 'NusachSefard') {
    siddurFormat = SiddurFormat.NusachSefard;
  } else {
    siddurFormat = SiddurFormat.NusachAshkenaz; // Default or handle error
  }

  try {
    const params = {
      selectedDate: dateParam,
      siddurFormat: siddurFormat,
      userName: userNameParam || undefined, // Pass undefined if not provided
      style: styleParam, // Add style parameter
    };

    const pdfBytes = await generateSiddurPDF(params);

    // FIX: Use a type assertion `as ArrayBuffer` on the buffer property.
    // This explicitly tells TypeScript to treat the `ArrayBufferLike` object
    // as a standard `ArrayBuffer`, which satisfies the type requirements
    // for the Blob constructor and resolves the build error.
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="basic_siddur.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    // Return an error response
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

