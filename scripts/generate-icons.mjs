// Generates the three placeholder PWA icons (192, 512, 512-maskable) and an
// apple-touch-icon. Uses pure Node + zero dependencies — writes minimal PNGs
// produced from a tiny canvas-emulating PNG encoder.
//
// Run with: node scripts/generate-icons.mjs
//
// You can replace these with real Henri icons later. Just keep the same
// filenames so the manifest in vite.config.ts continues to find them.

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = (name) => resolve(__dirname, '../public', name);

const CREAM = [249, 244, 234];
const INK   = [42, 31, 24];
const GOLD  = [184, 137, 90];

// Render an "H" centered on a cream square with a subtle gold border.
function makeIcon({ size, maskable = false }) {
  const padding = maskable ? Math.round(size * 0.12) : Math.round(size * 0.05);
  const innerSize = size - padding * 2;
  const data = new Uint8Array(size * size * 4);

  // Background — cream everywhere
  for (let i = 0; i < size * size; i++) {
    data[i * 4 + 0] = CREAM[0];
    data[i * 4 + 1] = CREAM[1];
    data[i * 4 + 2] = CREAM[2];
    data[i * 4 + 3] = 255;
  }

  // Gold border (only on non-maskable; maskable safe area lives inside)
  if (!maskable) {
    const borderWidth = Math.max(2, Math.round(size * 0.012));
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const onBorder =
          x < borderWidth || x >= size - borderWidth ||
          y < borderWidth || y >= size - borderWidth;
        if (onBorder) {
          const i = (y * size + x) * 4;
          data[i + 0] = GOLD[0];
          data[i + 1] = GOLD[1];
          data[i + 2] = GOLD[2];
        }
      }
    }
  }

  // Letter "H" — drawn as two vertical bars + one horizontal bar
  const cx = size / 2;
  const cy = size / 2;
  const hHeight = innerSize * 0.6;
  const barW = innerSize * 0.10;
  const innerSpan = innerSize * 0.42;

  const top    = Math.round(cy - hHeight / 2);
  const bottom = Math.round(cy + hHeight / 2);
  const left   = Math.round(cx - innerSpan / 2);
  const right  = Math.round(cx + innerSpan / 2);
  const crossY = Math.round(cy);

  const drawRect = (x0, y0, w, h, color) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const i = (y * size + x) * 4;
        data[i + 0] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
      }
    }
  };

  drawRect(left  - Math.round(barW / 2), top, Math.round(barW), bottom - top + 1, INK);
  drawRect(right - Math.round(barW / 2), top, Math.round(barW), bottom - top + 1, INK);
  drawRect(left, crossY - Math.round(barW / 4), right - left, Math.max(2, Math.round(barW / 2)), INK);

  return encodePng(data, size, size);
}

// --- Minimal PNG encoder (no external deps) -----------------------
function encodePng(rgba, width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = chunk('IHDR', (() => {
    const b = Buffer.alloc(13);
    b.writeUInt32BE(width, 0);
    b.writeUInt32BE(height, 4);
    b[8] = 8;            // bit depth
    b[9] = 6;            // color type (RGBA)
    b[10] = 0; b[11] = 0; b[12] = 0;
    return b;
  })());

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.subarray(y * width * 4, (y + 1) * width * 4).forEach((v, i) => {
      raw[y * (width * 4 + 1) + 1 + i] = v;
    });
  }
  const idat = chunk('IDAT', deflateSync(raw));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// --- Write the four files ----------------------------------------
writeFileSync(out('icon-192.png'),         makeIcon({ size: 192, maskable: false }));
writeFileSync(out('icon-512.png'),         makeIcon({ size: 512, maskable: false }));
writeFileSync(out('icon-512-maskable.png'), makeIcon({ size: 512, maskable: true }));
writeFileSync(out('apple-touch-icon.png'), makeIcon({ size: 180, maskable: false }));

console.log('wrote placeholder Henri icons to public/');
