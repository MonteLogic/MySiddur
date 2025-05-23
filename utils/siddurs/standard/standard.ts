// src/utils/siddurs/standard.ts

import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import fs from 'fs'; // We'll still need fs to save the file locally for this basic test
import path from 'path'; // For constructing file paths

/**
 * Configuration for our very simple PDF generator.
 */
interface SimplePdfParams {
  title?: string;
  mainText?: string;
  outputFileName?: string; // e.g., 'MyFirstSiddur.pdf'
}

/**
 * Generates a very basic PDF with a title and some text.
 * Focus is purely on the PDF generation mechanism.
 */
export async function generateSimplePdf(config: SimplePdfParams): Promise<Uint8Array> {
  const {
    title = "My Simple PDF",
    mainText = "Hello, this is the first text in our PDF!",
  } = config;

  // 1. Create a new PDFDocument
  const pdfDoc = await PDFDocument.create();

  // 2. Embed a standard font (Helvetica is a safe bet for basic English text)
  //    IMPORTANT: For Hebrew text later, you will need to embed a specific Hebrew font.
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 3. Add a page
  const page = pdfDoc.addPage(); // Uses default page size (Letter)
  const { width, height } = page.getSize();

  // 4. Draw the title
  page.drawText(title, {
    x: 50,
    y: height - 4 * 20, // Some margin from the top
    font: font,
    size: 30,
    color: rgb(0, 0.53, 0.71), // A nice blue color
  });

  // 5. Draw the main text
  page.drawText(mainText, {
    x: 50,
    y: height - 10 * 20,
    font: font,
    size: 12,
    color: rgb(0, 0, 0), // Black
  });

  // 6. Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();

  return pdfBytes;
}

// --- Example of how to call this and save the PDF (for testing locally) ---
// You would typically call generateSimplePdf from an API route or another server-side function
// and then send the pdfBytes to the client or save it as needed.

/*
async function testPdfGeneration() {
  console.log('Starting PDF generation test...');
  try {
    const pdfBytes = await generateSimplePdf({
      title: "Siddur Generation Test",
      mainText: "This is a basic PDF generated with pdf-lib. Next step: Hebrew!",
      outputFileName: "TestSiddur.pdf"
    });

    // For local testing, save the PDF to the project root or a specific 'output' folder
    const outputPath = path.join(process.cwd(), 'TestSiddur.pdf');
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`PDF generated successfully and saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

// To run the test (e.g., if you put this in a script you can execute with ts-node):
// testPdfGeneration();
*/