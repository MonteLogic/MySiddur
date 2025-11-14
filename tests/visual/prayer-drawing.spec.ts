import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

import { renderSamplePrayerPdf } from './utils/sample-prayer';
import { renderPdfPageToPng } from './utils/pdf-to-png';

const BASELINE_PATH = path.join(
  __dirname,
  'baselines',
  'sample-prayer.png',
);

describe('Prayer Drawing Visual Regression', () => {
  it('matches the baseline rendering for the sample prayer', async () => {
    const pdfBytes = await renderSamplePrayerPdf();
    const pngBuffer = await renderPdfPageToPng(pdfBytes, 1, 1.5);

    if (!fs.existsSync(BASELINE_PATH)) {
      fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
      fs.writeFileSync(BASELINE_PATH, pngBuffer);
      throw new Error(
        `Baseline image created at ${BASELINE_PATH}. Please verify and rerun the test.`,
      );
    }

    const baselineImage = PNG.sync.read(fs.readFileSync(BASELINE_PATH));
    const currentImage = PNG.sync.read(pngBuffer);

    if (
      baselineImage.width !== currentImage.width ||
      baselineImage.height !== currentImage.height
    ) {
      throw new Error('Image dimensions differ between baseline and current render.');
    }

    const diff = new PNG({
      width: baselineImage.width,
      height: baselineImage.height,
    });

    const diffPixelCount = pixelmatch(
      baselineImage.data,
      currentImage.data,
      diff.data,
      baselineImage.width,
      baselineImage.height,
      { threshold: 0.1 },
    );

    expect(diffPixelCount).toBe(0);
  });
});

