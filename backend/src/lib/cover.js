// Coperta default generata server-side (PNG, zero dependinte): gradient brand
// albastru-bebe -> verde-brad + accente albe (farfurie + bule).
// Folosita cand reteta nu are poza — functioneaza peste tot (web, mobil, preview Telegram).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 1200, H = 630;

function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
const C1 = hex('#1486B7'); // albastru bebelus
const C2 = hex('#065F46'); // verde brad

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function over(base, alpha) {
  return [0, 1, 2].map((i) => Math.round(base[i] + (255 - base[i]) * alpha));
}

function render(id) {
  const flip = (Number(id) || 0) % 2 === 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  const circles = [
    { x: W * 0.72, y: H * 0.40, r: 195, a: 0.10 },
    { x: W * 0.72, y: H * 0.40, r: 128, a: 0.08 },
    { x: W * 0.15, y: H * 0.84, r: 95, a: 0.10 },
    { x: W * 0.89, y: H * 0.15, r: 62, a: 0.12 },
    { x: W * 0.30, y: H * 0.16, r: 34, a: 0.10 }
  ];
  let p = 0;
  for (let y = 0; y < H; y++) {
    raw[p++] = 0;
    for (let x = 0; x < W; x++) {
      let t = (x / W + y / H) / 2;
      if (flip) t = 1 - t;
      let px = [0, 1, 2].map((i) => Math.round(C1[i] + (C2[i] - C1[i]) * t));
      for (const c of circles) {
        const dx = x - c.x, dy = y - c.y;
        if (dx * dx + dy * dy <= c.r * c.r) px = over(px, c.a);
      }
      raw[p++] = px[0]; raw[p++] = px[1]; raw[p++] = px[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function fileName(id) {
  return `${id}-coperta.png`;
}

// creeaza coperta default daca lipseste; intoarce url-ul sau null
function ensureDefaultCover(uploadDir, id) {
  try {
    const name = fileName(id);
    const dest = path.join(uploadDir, name);
    if (fs.existsSync(dest)) return `/uploads/${name}`;
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(dest, render(id));
    return `/uploads/${name}`;
  } catch {
    return null;
  }
}

function removeFile(uploadDir, url) {
  try {
    if (!url) return;
    const m = /^\/uploads\/(.+)$/.exec(url);
    if (!m) return;
    const f = path.join(uploadDir, path.basename(m[1]));
    if (fs.existsSync(f)) fs.unlinkSync(f);
  } catch {}
}

module.exports = { ensureDefaultCover, removeFile, fileName };
