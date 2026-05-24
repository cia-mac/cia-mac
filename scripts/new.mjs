#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const ARCS = ['imaging', 'iranshahr', 'films', 'writing', 'system'];
const KINDS = ['page', 'app', 'markdown', 'image', 'session', 'study'];

const usage = `Usage:
  npm run new -- --id=foo --title="Foo" --arc=system --kind=study [options]

Required:
  --id=<slug>        lowercase letters / digits / hyphens
  --title="..."      display title
  --arc=<arc>        one of: ${ARCS.join(', ')}
  --kind=<kind>      one of: ${KINDS.join(', ')}

Optional:
  --stage=<0-6>          default 0
  --repo=<path>          becomes repo_path and folder_path
  --preview-url=<url>    iframe-able URL
  --preview-image=<url>  thumbnail (path or URL)
  --source-url=<url>     where this artifact "lives" externally
  --notes="..."          text-shaped preview content
  --next="..."           next_action
  --to=<dir>             output directory (default: artifacts/fixtures)
                         pass --to=<repo-path> to drop a .portal.json next to a repo

Examples:
  npm run new -- --id=iranshahr-tile --title="Iranshahr · prologue" --arc=iranshahr --kind=writing --stage=1 --notes="..."
  npm run new -- --id=ai-dashboard --title="Ally" --arc=system --kind=app --preview-url=http://localhost:8800 --to=~/Developer/ai-dashboard
`;

const args = {};
for (const raw of process.argv.slice(2)) {
  if (!raw.startsWith('--')) continue;
  const [k, ...rest] = raw.slice(2).split('=');
  args[k] = rest.length ? rest.join('=') : true;
}

if (args.help || args.h) { console.log(usage); process.exit(0); }

const missing = ['id', 'title', 'arc', 'kind'].filter((k) => !args[k] || args[k] === true);
if (missing.length) {
  console.error(`Missing required: ${missing.join(', ')}\n\n${usage}`);
  process.exit(1);
}
if (!ARCS.includes(args.arc)) { console.error(`arc must be one of: ${ARCS.join(', ')}`); process.exit(1); }
if (!KINDS.includes(args.kind)) { console.error(`kind must be one of: ${KINDS.join(', ')}`); process.exit(1); }
if (!/^[a-z0-9-]+$/.test(args.id)) { console.error('id must be lowercase letters / digits / hyphens'); process.exit(1); }

const stage = args.stage !== undefined ? Number(args.stage) : 0;
if (!Number.isInteger(stage) || stage < 0 || stage > 6) {
  console.error('stage must be an integer 0–6'); process.exit(1);
}

const sidecar = {
  id: args.id,
  title: args.title,
  arc: args.arc,
  kind: args.kind,
  stage,
};
if (args.repo) { sidecar.repo_path = args.repo; sidecar.folder_path = args.repo; }
if (args['preview-url']) sidecar.preview_url = args['preview-url'];
if (args['preview-image']) sidecar.preview_image = args['preview-image'];
if (args['source-url']) sidecar.source_url = args['source-url'];
if (args.notes) sidecar.notes = args.notes;
if (args.next) sidecar.next_action = args.next;

const expandHome = (p) => p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;

const isRepoTarget = !!args.to && !args.to.includes('artifacts/fixtures');
const outDir = args.to ? expandHome(args.to) : path.join(process.cwd(), 'artifacts', 'fixtures');
const filename = isRepoTarget ? '.portal.json' : `${args.id}.portal.json`;
const outPath = path.join(outDir, filename);

await fs.mkdir(outDir, { recursive: true });
try {
  await fs.access(outPath);
  console.error(`Refusing to overwrite existing ${outPath}. Edit it directly or pick a new --id.`);
  process.exit(1);
} catch { /* doesn't exist, fine */ }
await fs.writeFile(outPath, JSON.stringify(sidecar, null, 2) + '\n', 'utf8');
console.log(`wrote ${outPath}`);
