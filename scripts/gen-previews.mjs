#!/usr/bin/env node
// Generates simple SVG previews for sidecars that reference /previews/<id>.svg
// but don't have a real image yet. Procedural — varied by id-hash and arc tint.
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'previews');
await fs.mkdir(OUT, { recursive: true });

const ARC_TINT = {
  imaging:   { hue: 32,  name: 'amber'   },
  eranshahr: { hue: 220, name: 'lapis'   },
  films:     { hue: 340, name: 'magenta' },
  writing:   { hue: 180, name: 'cyan'    },
  system:    { hue: 210, name: 'caspian' },
};

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return h >>> 0;
}

function motif(id, arc) {
  const h = hash(id);
  const tint = ARC_TINT[arc] ?? ARC_TINT.system;
  const angle = h % 360;
  const opacity1 = 0.42 + ((h >> 4) % 18) / 100;
  const opacity2 = 0.20 + ((h >> 8) % 14) / 100;
  const x1 = 150 + ((h >> 4) % 500);
  const y1 = 150 + ((h >> 12) % 300);
  const r1 = 260 + ((h >> 16) % 200);

  const lineCount = 10 + (h % 8);
  const lines = [];
  for (let i = 0; i < lineCount; i++) {
    const lh = hash(`${id}-${i}`);
    const lx = 40 + (lh % 720);
    const ly = 40 + ((lh >> 8) % 520);
    const lw = 80 + ((lh >> 16) % 360);
    const lop = 0.10 + ((lh >> 20) % 18) / 100;
    lines.push(`<line x1="${lx}" y1="${ly}" x2="${lx + lw}" y2="${ly}" stroke="hsla(${tint.hue},50%,72%,${lop})" stroke-width="1"/>`);
  }

  // a single emphasized stroke
  const eh = hash(`${id}-emph`);
  const ex = 80 + (eh % 600);
  const ey = 100 + ((eh >> 8) % 400);
  const ew = 180 + ((eh >> 16) % 320);
  const emph = `<line x1="${ex}" y1="${ey}" x2="${ex + ew}" y2="${ey}" stroke="hsla(${tint.hue},60%,75%,0.55)" stroke-width="1.5"/>`;

  return `
    <defs>
      <radialGradient id="g-${id}" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="hsla(${tint.hue},65%,55%,${opacity1})"/>
        <stop offset="60%" stop-color="hsla(${tint.hue},60%,40%,${opacity2})"/>
        <stop offset="100%" stop-color="hsla(${tint.hue},55%,30%,0)"/>
      </radialGradient>
    </defs>
    <circle cx="${x1}" cy="${y1}" r="${r1}" fill="url(#g-${id})" transform="rotate(${angle} ${x1} ${y1})"/>
    ${lines.join('\n    ')}
    ${emph}
  `;
}

function tile(id, arc) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="#0a0a0b"/>
  ${motif(id, arc)}
  <rect x="0.5" y="0.5" width="799" height="599" fill="none" stroke="rgba(255,255,255,0.06)"/>
</svg>
`;
}

async function listSidecars() {
  const dir = path.join(process.cwd(), 'artifacts', 'fixtures');
  const files = await fs.readdir(dir);
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.portal.json')) continue;
    const j = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
    if (j.preview_image && j.preview_image.startsWith('/previews/')) {
      out.push({ id: j.id, arc: j.arc, target: path.basename(j.preview_image) });
    }
  }
  return out;
}

const targets = await listSidecars();
let written = 0;
for (const t of targets) {
  const p = path.join(OUT, t.target);
  try {
    await fs.access(p);
  } catch {
    await fs.writeFile(p, tile(t.id, t.arc), 'utf8');
    written++;
    console.log(`wrote previews/${t.target}`);
  }
}
console.log(`${written} preview(s) generated, ${targets.length - written} already present.`);
