/**
 * Generates premium placeholder product images as SVGs.
 * Run: node apps/storefront/scripts/gen-images.mjs
 * Replace any file in public/images/products with real photography later.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'images', 'products');
mkdirSync(OUT, { recursive: true });

const ITEMS = [
  ['signature-chocolate-truffle-cake', '🎂', 'CHOCOLATE TRUFFLE', '#A97155', '#5C3A28'],
  ['royal-kesar-fruit-cake', '🍰', 'KESAR FRUIT CAKE', '#E8B04B', '#B0782A'],
  ['kesar-badam-rusk', '🍞', 'KESAR BADAM RUSK', '#EAC98B', '#C89B54'],
  ['elaichi-khas-khas-rusk', '🍞', 'ELAICHI RUSK', '#DCC9A8', '#A98F63'],
  ['multigrain-rusk', '🥖', 'MULTIGRAIN RUSK', '#C9A87C', '#96754A'],
  ['almond-florentine-cookies', '🍪', 'ALMOND FLORENTINE', '#D9A661', '#A97637'],
  ['nankhatai-ghee-shortbread', '🍪', 'NANKHATAI', '#EFD9A8', '#C6A25C'],
  ['ajwain-cheese-crisps', '🧀', 'AJWAIN CHEESE CRISPS', '#E8C97E', '#BC9844'],
  ['ratnagiri-boondi', '🥣', 'RATNAGIRI BOONDI', '#E8A15C', '#C07632'],
  ['kanpuri-mixture', '🥘', 'KANPURI MIXTURE', '#D9975B', '#A96B33'],
  ['bombay-chakli', '🥨', 'BOMBAY CHAKLI', '#D8A468', '#AA7840'],
  ['hing-chana', '🫘', 'HING CHANA', '#D9B36B', '#A98438'],
  ['chana-dal-crunch', '🥜', 'CHANA DAL CRUNCH', '#D9B06B', '#B08A42'],
  ['diwali-signature-gift-box', '🎁', 'DIWALI GIFT BOX', '#C89048', '#8A5A22'],
  ['christmas-stollen-gift-box', '🎄', 'CHRISTMAS STOLLEN', '#B9C4A1', '#7E8A62'],
  ['wedding-favour-hamper', '💝', 'WEDDING FAVOURS', '#E8C4B0', '#C08E72'],
  ['detail', '🥐', 'BAKED FRESH DAILY', '#EAD9C2', '#C4A87E'],
];

const svg = (emoji, label, c1, c2) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F9F3E8"/>
      <stop offset="1" stop-color="${c1}" stop-opacity="0.55"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.4" r="0.65">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#D4AF37"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect width="800" height="800" fill="url(#glow)"/>
  <circle cx="400" cy="410" r="240" fill="#FFFDF8" opacity="0.82"/>
  <circle cx="400" cy="410" r="240" fill="none" stroke="url(#ring)" stroke-opacity="0.65" stroke-width="2.5"/>
  <circle cx="400" cy="410" r="258" fill="none" stroke="#C9A227" stroke-opacity="0.22" stroke-width="1"/>
  <text x="400" y="455" font-size="230" text-anchor="middle">${emoji}</text>
  <text x="400" y="726" font-size="26" text-anchor="middle" fill="#4A2F23" font-family="Georgia, 'Times New Roman', serif" letter-spacing="7">${label}</text>
  <text x="400" y="762" font-size="13" text-anchor="middle" fill="#7A5C48" font-family="Georgia, serif" letter-spacing="4">GILDED OVEN · ARTISAN BAKERY</text>
</svg>
`;

for (const [slug, emoji, label, c1, c2] of ITEMS) {
  writeFileSync(join(OUT, `${slug}.svg`), svg(emoji, label, c1, c2));
}
console.log(`✅ Generated ${ITEMS.length} product images in ${OUT}`);
