/* Verificare Canva: generează o imagine de test și arată structura răspunsului.
   Rulează după ce ai conectat Canva din aplicație (Setări):  npm run canva:probe */
import { config } from '../server/config.js';
import { createStorage } from '../server/storage/index.js';
import { Canva } from '../server/canva.js';

const storage = await createStorage(config.storage);
const canva = new Canva(storage, config.port);
await canva.provider.load();
if (!canva.provider.data.tokens) { console.log('Canva nu e conectat încă. Pornește aplicația (npm start), mergi la Setări > Conectează Canva, apoi rulează din nou.'); process.exit(1); }
const r = await canva.connect().catch(e => ({ error: e?.message || String(e) }));
if (!r?.connected) { console.log('Conectarea a eșuat:', r?.error || 'autorizarea a expirat, reconectează din Setări.'); process.exit(1); }
console.log('Conectat la Canva. Generez o imagine de test (de obicei 30-90 de secunde)...');
try {
  const img = await canva.generate({ prompt: "Children's picture-book illustration, soft gouache: a small red fox cub with a green scarf in a sunny forest clearing. No text." });
  await storage.writeFile('probe.png', img.buffer);
  const short = (k, v) => (typeof v === 'string' && v.length > 200 ? v.slice(0, 80) + `… (${v.length} caractere)` : v);
  console.log('\nRăspunsul Canva (prescurtat):\n' + JSON.stringify(img.raw, short, 2));
  console.log('\nmedia_id:', img.mediaId || 'NEGĂSIT (paginile de colorat nu vor putea folosi imaginea ca referință)');
  console.log('Imagine salvată în:', storage.abs('probe.png'));
  process.exit(0);
} catch (e) { console.log('Generarea a eșuat:', e?.message || e); process.exit(1); }
