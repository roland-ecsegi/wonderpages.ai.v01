#!/usr/bin/env node
/* P6-T01 — regenerates public/fonts/andika-metrics.json from the local Andika TTF files (run after a font update). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMetrics } from '../../server/domain/font-metrics.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const m = buildMetrics(path.join(ROOT, 'public', 'fonts'));
const out = path.join(ROOT, 'public', 'fonts', 'andika-metrics.json');
fs.writeFileSync(out, JSON.stringify(m) + '\n');
console.log(`andika-metrics.json: ${Object.values(m.fonts).map(f => `${f.file} ${f.runs.reduce((a, r) => a + r[1].length, 0)} code points`).join(', ')}; hash ${m.hash}`);
