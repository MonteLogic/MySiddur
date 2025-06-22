// app/api/generate-basic-siddur/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateSiddurPDF, SiddurFormat } from '#/utils/siddur-pdf-utils/ashkenaz/siddurMainFile'; // Adjust path as needed

export async function GET(request: NextRequest) {
  // For GET requests, parameters are typically in the search params (URL query)
  const searchParams = request.nextUrl.searchParams;
  const formatParam = searchParams.get('format');
  const userNameParam = searchParams.get('userName');
  const dateParam = searchParams.get('date') || new Date().toISOString();

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
    };

    const pdfBytes = await generateSiddurPDF(params);

    // Create a NextResponse with the PDF data and correct headers
    return new NextResponse(pdfBytes, {
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

// If you wanted to accept parameters via POST request with a JSON body:
/*
export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); // Parse the JSON body

    // Validate body parameters here (e.g., using Zod or similar)
    const { selectedDate, siddurFormat, userName } = body;

    if (!selectedDate || siddurFormat === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const params = {
      selectedDate,
      siddurFormat: siddurFormat as SiddurFormat, // Ensure type safety
      userName,
    };

    const pdfBytes = await generateSiddurPDF(params);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="basic_siddur.pdf"',
      },
    });

  } catch (error: any) {
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
*/