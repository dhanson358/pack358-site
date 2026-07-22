import { chromium } from 'playwright';
import { preview } from 'astro';

const server = await preview({ root: process.cwd() });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${server.port}/flyer`, { waitUntil: 'networkidle' });
await page.pdf({ path: 'flyer.pdf', format: 'Letter', printBackground: true });
await browser.close();
await server.stop();
console.log('wrote flyer.pdf');
process.exit(0);
