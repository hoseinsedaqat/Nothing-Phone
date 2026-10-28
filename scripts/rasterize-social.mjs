/**
 * Rasterizes the GitHub social-preview SVG to a high-resolution PNG.
 * Run: node scripts/rasterize-social.mjs
 * @resvg/resvg-js is a dev dependency so the pipeline stays asset-free
 * apart from the generated PNG committed under docs/.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'docs/social-preview.svg'), 'utf8');

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1280 },
  background: '#050506',
  font: {
    loadSystemFonts: true,
    fontFiles: [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    ],
    defaultFontFamily: 'DejaVu Sans',
  },
});
const png = resvg.render().asPng();
writeFileSync(join(root, 'docs/social-preview.png'), png);
console.log('docs/social-preview.png written');
