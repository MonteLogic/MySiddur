import { test, expect } from '@playwright/test';

test.skip('checks render for DistributorHeader filter', async ({ page }) => {
  console.log('Before page.goto');

  await page.goto('/', { timeout: 60000 });

  console.log('After page.goto');

  await page.waitForLoadState('networkidle');

  const headingLocator = page.locator('h1.text-xl.font-bold');
  const headingVisible = await headingLocator.isVisible();
  console.log('Heading visible:', headingVisible);

  const listItemLocator = page.locator('ul li h4');
  const listItemVisible = await listItemLocator.isVisible();
  console.log('List item visible:', listItemVisible);

  const imageLocator = page.locator('ul li a img');
  const imageVisible = await imageLocator.isVisible();
  console.log('Image visible:', imageVisible);

  const linkLocator = page.locator('a.inline-flex');
  const linkVisible = await linkLocator.isVisible();
  console.log('Link visible:', linkVisible);

  // Log any console messages from the page
  page.on('console', (msg) => console.log(msg.text()));

  // Evaluate JavaScript within the page context
  const pageContent = await page.evaluate(() => {
    // Check for the presence of specific elements or log any error messages
    const element = document.querySelector('selector-for-element');
    if (element) {
      console.log('Element found');
    } else {
      console.log('Element not found');
    }
    return document.body.innerText;
  });

  console.log('Page content:', pageContent);

  // Produce a screenshot of the page
  await page.screenshot({ path: 'screenshot.png' });
});
