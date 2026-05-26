/**
 * generate-icons.mjs
 * Generates favicon.ico (multi-size), apple-touch-icon.png (180x180),
 * and icon-192.png / icon-512.png for the web manifest.
 * Uses only the Node.js built-in Canvas API via the 'canvas' npm package.
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

/**
 * Draw the UnlockPremium "U" icon at a given pixel size.
 * Matches the existing favicon.svg design:
 *   - Indigo (#4f46e5) rounded square background
 *   - White "U" arch shape
 *   - Light indigo (#818cf8) top-right accent
 */
function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.25; // corner radius

  // Background: indigo rounded square
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  const s = size / 32; // scale factor relative to the 32px SVG

  // White U arch (from SVG path: M10 10v6a6 6 0 0 0 12 0v-6h-3v6a3 3 0 0 1-6 0v-6z)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  // Outer rect: left column
  ctx.rect(10 * s, 10 * s, 3 * s, 9 * s);
  ctx.fill();
  // Outer rect: right column
  ctx.fillRect(19 * s, 10 * s, 3 * s, 9 * s);
  // Bottom curve — approximate with a filled rectangle + arc
  ctx.beginPath();
  ctx.arc(16 * s, 16 * s, 6 * s, 0, Math.PI, false);
  ctx.fill();
  // Hollow centre (inner U cutout)
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.arc(16 * s, 16 * s, 3 * s, 0, Math.PI, false);
  ctx.fill();
  ctx.fillRect(13 * s, 10 * s, 6 * s, 6 * s);

  // Light indigo accent square (top-right, from SVG: x=19 y=8 w=5 h=4 rx=1)
  ctx.fillStyle = '#818cf8';
  ctx.beginPath();
  const ax = 19 * s, ay = 8 * s, aw = 5 * s, ah = 4 * s, ar = 1 * s;
  ctx.moveTo(ax + ar, ay);
  ctx.lineTo(ax + aw - ar, ay);
  ctx.quadraticCurveTo(ax + aw, ay, ax + aw, ay + ar);
  ctx.lineTo(ax + aw, ay + ah - ar);
  ctx.quadraticCurveTo(ax + aw, ay + ah, ax + aw - ar, ay + ah);
  ctx.lineTo(ax + ar, ay + ah);
  ctx.quadraticCurveTo(ax, ay + ah, ax, ay + ah - ar);
  ctx.lineTo(ax, ay + ar);
  ctx.quadraticCurveTo(ax, ay, ax + ar, ay);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

async function main() {
  console.log('Generating icons...');

  // apple-touch-icon.png (180×180)
  const atc = drawIcon(180);
  fs.writeFileSync(path.join(PUBLIC, 'apple-touch-icon.png'), atc.toBuffer('image/png'));
  console.log('✓ apple-touch-icon.png (180×180)');

  // icon-192.png for manifest
  const i192 = drawIcon(192);
  fs.writeFileSync(path.join(PUBLIC, 'icon-192.png'), i192.toBuffer('image/png'));
  console.log('✓ icon-192.png (192×192)');

  // icon-512.png for manifest
  const i512 = drawIcon(512);
  fs.writeFileSync(path.join(PUBLIC, 'icon-512.png'), i512.toBuffer('image/png'));
  console.log('✓ icon-512.png (512×512)');

  // favicon.png (32×32) — used as fallback PNG favicon
  const fav32 = drawIcon(32);
  fs.writeFileSync(path.join(PUBLIC, 'favicon.png'), fav32.toBuffer('image/png'));
  console.log('✓ favicon.png (32×32)');

  console.log('\nAll icons generated successfully.');
  console.log('Note: favicon.ico requires a separate tool — using favicon.png as PNG fallback.');
}

main().catch(console.error);
