import path from 'path';
import { createCanvas, CanvasRenderingContext2D } from '@napi-rs/canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const workerSrc = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'legacy',
  'build',
  'pdf.worker.mjs',
);

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
pdfjsLib.GlobalWorkerOptions.standardFontDataUrl = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'standard_fonts',
);

export const renderPdfPageToPng = async (
  pdfBytes: Uint8Array,
  pageNumber = 1,
  scale = 1.5,
): Promise<Buffer> => {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    useWorkerFetch: false,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  await page
    .render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    })
    .promise;

  return canvas.toBuffer('image/png');
};

