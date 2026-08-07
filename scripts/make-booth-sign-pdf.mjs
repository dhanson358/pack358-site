import { chromium } from 'playwright';
import { preview } from 'astro';

const server = await preview({ root: process.cwd() });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${server.port}/booth-sign`, { waitUntil: 'networkidle' });
await page.pdf({ path: 'booth-sign.pdf', format: 'A4', printBackground: true });
await browser.close();
await server.stop();
console.log('wrote booth-sign.pdf');
process.exit(0);
