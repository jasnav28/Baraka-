import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const BASE_URL = 'https://victory-nine.vercel.app';

const PRODUCTS = [
  'SINCHIL',
  'RICERICH',
  'GROUNDNUT SPECIAL',
  'TOMAGROW',
  'BRINJAL SPECIAL',
  'COTTOVITA',
  'PODMAX',
  'CHILLIGAURD',
  'LIPOGROW',
  'CROPMET',
  'BULB MAX',
  'SOLANOGROW',
];

function toPageUrl(productName) {
  return `${BASE_URL}/${encodeURIComponent(productName)}`;
}

async function createPdf({ outputPath, productName, url }) {
  const qrPng = await QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 900,
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const stream = doc.pipe(createWriteStream(outputPath));
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);

    doc.fontSize(24).text(productName, { align: 'left' });
    doc.moveDown(0.6);
    doc.fontSize(12).text(`URL: ${url}`, { align: 'left' });
    doc.moveDown(1.2);

    const qrSize = 320;
    const x = (doc.page.width - doc.page.margins.left - doc.page.margins.right - qrSize) / 2 + doc.page.margins.left;
    const y = doc.y;
    doc.image(qrPng, x, y, { width: qrSize, height: qrSize });

    doc.moveDown(0.5);
    doc.y = y + qrSize + 18;
    doc.fontSize(11).text('Scan to open the product page', { align: 'center' });

    doc.end();
  });
}

async function main() {
  const outputDir = path.resolve(process.cwd(), 'qr_pdfs');
  const results = [];

  for (const productName of PRODUCTS) {
    const url = toPageUrl(productName);
    const outputPath = path.join(outputDir, `${productName}.pdf`);
    await createPdf({ outputPath, productName, url });
    results.push({ productName, url, outputPath });
  }

  process.stdout.write(JSON.stringify({ outputDir, count: results.length, results }, null, 2));
  process.stdout.write('\n');
}

main().catch(err => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exitCode = 1;
});
