/**
 * Renders the share-preview (Open Graph) image candidates at exactly 1200×630.
 * Output goes to og-options/ (not public/). Promote one by copying it over
 * public/og-image.png.
 */

import fs from 'node:fs';
import sharp from 'sharp';

fs.mkdirSync('og-options', { recursive: true });

const W = 1200;
const H = 630;

/* ----------------------------- shared pieces ----------------------------- */

const WORDMARK = (x, y, size, color = '#ffffff', dot = '#5fd0bf') => `
  <text x="${x}" y="${y}" font-family="Georgia, 'Times New Roman', serif" font-weight="bold"
        font-size="${size}" fill="${color}" letter-spacing="-3">verse<tspan fill="${dot}">.</tspan></text>`;

const SITE = (color = 'rgba(255,255,255,0.92)') => `
  <text x="${W - 64}" y="${H - 52}" text-anchor="end" font-family="Helvetica, Arial, sans-serif"
        font-weight="bold" font-size="30" fill="${color}">vrsfd.com</text>`;

/** A city skyline: buildings with faint window grids. */
function skyline(baseY, color, windowColor) {
  const buildings = [
    [40, 180, 150], [210, 120, 260], [350, 150, 200], [520, 110, 330],
    [650, 170, 170], [840, 130, 290], [990, 160, 220], [1130, 90, 180],
  ];
  let out = '';
  for (const [x, w, h] of buildings) {
    out += `<rect x="${x}" y="${baseY - h}" width="${w}" height="${h}" fill="${color}"/>`;
    for (let wy = baseY - h + 18; wy < baseY - 14; wy += 30) {
      for (let wx = x + 14; wx < x + w - 18; wx += 26) {
        if ((wx * 7 + wy * 13) % 5 < 2) {
          out += `<rect x="${wx}" y="${wy}" width="9" height="13" fill="${windowColor}"/>`;
        }
      }
    }
  }
  return out;
}

/** A row of human silhouettes seen from behind, varying heights. */
function crowd(baseY, color) {
  const people = [
    [120, 1.00], [220, 0.88], [330, 1.06], [455, 0.94], [585, 1.10],
    [710, 0.90], [820, 1.02], [935, 0.86], [1050, 0.98],
  ];
  let out = '';
  for (const [cx, s] of people) {
    const headR = 26 * s;
    const shW = 92 * s;
    const bodyH = 150 * s;
    out += `
      <circle cx="${cx}" cy="${baseY - bodyH - headR + 6}" r="${headR}" fill="${color}"/>
      <path d="M ${cx - shW / 2} ${baseY}
               L ${cx - shW / 2} ${baseY - bodyH * 0.72}
               Q ${cx - shW / 2} ${baseY - bodyH} ${cx - shW * 0.22} ${baseY - bodyH}
               L ${cx + shW * 0.22} ${baseY - bodyH}
               Q ${cx + shW / 2} ${baseY - bodyH} ${cx + shW / 2} ${baseY - bodyH * 0.72}
               L ${cx + shW / 2} ${baseY} Z" fill="${color}"/>`;
  }
  return out;
}

/* ----------------------------- variant A: her concept --------------------- */
/* Shadowy crowd looking up at lit buildings, deep teal, type on top. */

const A = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#143b36"/>
      <stop offset="0.55" stop-color="#1d5047"/>
      <stop offset="1" stop-color="#2a6a5c"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5fd0bf" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#5fd0bf" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="340" fill="url(#glow)"/>
  ${skyline(630, 'rgba(10,30,27,0.55)', 'rgba(185,235,225,0.28)')}
  ${crowd(660, 'rgba(7,22,20,0.82)')}
  <rect width="${W}" height="${H}" fill="rgba(13,36,32,0.30)"/>
  ${WORDMARK(64, 200, 132)}
  <text x="64" y="320" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="56"
        fill="#ffffff">Every VA opportunity. One place.</text>
  <text x="64" y="384" font-family="Helvetica, Arial, sans-serif" font-size="31"
        fill="rgba(255,255,255,0.85)">Real remote jobs, career tools and courses for Filipino virtual assistants.</text>
  ${SITE()}
</svg>`;

/* ----------------------------- variant B: clean editorial ----------------- */
/* The site's cream paper + cards, like the product itself. */

const B = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#faf6ef"/>
  <circle cx="1060" cy="90" r="300" fill="#e8f4f0"/>
  <circle cx="1150" cy="560" r="200" fill="#f7e8dd"/>
  ${WORDMARK(64, 210, 140, '#1c1a17', '#2a6a5c')}
  <text x="64" y="330" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="56"
        fill="#1c1a17">Every VA opportunity. One place.</text>
  <text x="64" y="394" font-family="Helvetica, Arial, sans-serif" font-size="31"
        fill="#6b6459">Real remote jobs, career tools and courses for Filipino VAs.</text>

  <g font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="26">
    <rect x="64" y="452" rx="26" width="232" height="52" fill="#2a6a5c"/>
    <text x="180" y="487" text-anchor="middle" fill="#ffffff">900+ live jobs</text>
    <rect x="312" y="452" rx="26" width="230" height="52" fill="#ffffff" stroke="#e3dccf" stroke-width="2"/>
    <text x="427" y="487" text-anchor="middle" fill="#1c1a17">21 courses</text>
    <rect x="558" y="452" rx="26" width="268" height="52" fill="#ffffff" stroke="#e3dccf" stroke-width="2"/>
    <text x="692" y="487" text-anchor="middle" fill="#1c1a17">6 career tools</text>
  </g>
  ${SITE('#9a9284')}
</svg>`;

/* ----------------------------- variant C: job cards ----------------------- */
/* Floating job-card mockups drifting in from the right on deep ink. */

function jobCard(x, y, r, w = 330) {
  return `
  <g transform="translate(${x} ${y}) rotate(${r})">
    <rect width="${w}" height="150" rx="18" fill="#ffffff" opacity="0.97"/>
    <rect x="22" y="24" width="${w * 0.55}" height="16" rx="8" fill="#1c1a17" opacity="0.85"/>
    <rect x="22" y="56" width="${w * 0.38}" height="12" rx="6" fill="#9a9284"/>
    <rect x="22" y="96" width="110" height="30" rx="15" fill="#e8f4f0"/>
    <rect x="40" y="105" width="74" height="12" rx="6" fill="#2a6a5c"/>
    <rect x="146" y="96" width="92" height="30" rx="15" fill="#f7e8dd"/>
    <rect x="162" y="105" width="60" height="12" rx="6" fill="#b85c38"/>
  </g>`;
}

const C = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1c1a17"/>
      <stop offset="1" stop-color="#143b36"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgc)"/>
  ${jobCard(800, 50, 6)}
  ${jobCard(860, 230, -4)}
  ${jobCard(620, 388, 3)}
  ${WORDMARK(64, 200, 132)}
  <text x="64" y="316" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="52"
        fill="#ffffff">Fresh VA jobs, every day.</text>
  <text x="64" y="376" font-family="Helvetica, Arial, sans-serif" font-size="30"
        fill="rgba(255,255,255,0.82)">Plus the resume, letters and courses</text>
  <text x="64" y="416" font-family="Helvetica, Arial, sans-serif" font-size="30"
        fill="rgba(255,255,255,0.82)">that get you hired.</text>
  ${SITE()}
</svg>`;

/* ----------------------------- variant D: sunrise skyline ----------------- */
/* Warm clay-to-teal dawn over the city: "your career is starting". */

const D = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d5047"/>
      <stop offset="0.6" stop-color="#8a5a40"/>
      <stop offset="1" stop-color="#d98e5f"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#dawn)"/>
  <circle cx="600" cy="560" r="150" fill="#ffd9a8" opacity="0.9"/>
  ${skyline(630, 'rgba(26,22,18,0.78)', 'rgba(255,215,160,0.35)')}
  <rect width="${W}" height="${H}" fill="rgba(20,30,28,0.18)"/>
  ${WORDMARK(64, 200, 132)}
  <text x="64" y="320" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="54"
        fill="#ffffff">Your VA career starts here.</text>
  <text x="64" y="384" font-family="Helvetica, Arial, sans-serif" font-size="31"
        fill="rgba(255,255,255,0.88)">Jobs, courses and tools for Filipino virtual assistants.</text>
  ${SITE()}
</svg>`;

/* ----------------------------- render ------------------------------------ */

const variants = { 'a-crowd-buildings': A, 'b-clean-editorial': B, 'c-job-cards': C, 'd-sunrise-skyline': D };

for (const [name, svg] of Object.entries(variants)) {
  await sharp(Buffer.from(svg)).png().toFile(`og-options/${name}.png`);
  console.log(`og-options/${name}.png`);
}
