import { toString } from 'qrcode';
import { writeFileSync } from 'node:fs';

const svg = await toString('https://lovejoypack358.com/join', {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 1,
  color: { dark: '#17335B', light: '#FFFFFF' },
});
writeFileSync('public/qr-join.svg', svg);
console.log('wrote public/qr-join.svg');
