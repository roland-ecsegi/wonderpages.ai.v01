/**
 * P2-T03 — immutable artifact versions, VariantSet and retention (OUTPUT-20, ADR10).
 *
 * Every write of an artifact also writes `projects/<pid>/versions/<key>/<v>.json` in the SAME commit
 * (content + canonical hash never change afterwards). The artifact document stays the current pointer
 * (its embedded `versions` list is kept only for v04 compatibility). Pins (approved / released / evidence /
 * migration / operator) protect a version from retention forever. Restore writes a NEW version with lineage;
 * the past is never rewritten. Retention is a dry-run plan first; applying it needs the plan hash.
 */
import { canonicalHash } from '../domain/canonical.js';

export const VERSION_SCHEMA = 'wonderpages.artifact-version/1';
export const PIN_REASONS = Object.freeze(['approved', 'released', 'evidence', 'migration', 'operator']);
export const versionRel = (pid, key, v) => `projects/${pid}/versions/${key}/${v}.json`;

export function versionDoc(key, doc, extra = {}) {
  return { schema: VERSION_SCHEMA, key, version: doc.version, hash: canonicalHash(doc.content ?? null), content: doc.content ?? null, meta: doc.meta ?? {}, basedOn: doc.basedOn ?? null, by: doc.by || null, note: doc.note || '', stage: doc.stage || '', at: doc.updatedAt || Date.now(), pinned: false, pins: [], ...extra };
}
export async function listVersions(storage, pid, key) {
  const files = (await storage.list(`projects/${pid}/versions/${key}`)).filter(f => /^\d+\.json$/.test(f.name));
  const docs = await Promise.all(files.map(f => storage.readJSON(`projects/${pid}/versions/${key}/${f.name}`, null)));
  return docs.filter(Boolean).sort((a, b) => a.version - b.version);
}
export const getVersion = (storage, pid, key, v) => storage.readJSON(versionRel(pid, key, v), null);

export async function pinVersion(storage, pid, key, v, { reason, ref = null, actor = 'system' }) {
  if (!PIN_REASONS.includes(reason)) throw { status: 400, message: 'Motiv de pin necunoscut.' };
  const d = await getVersion(storage, pid, key, v); if (!d) return null;
  if (d.pins.some(p => p.reason === reason && JSON.stringify(p.ref) === JSON.stringify(ref))) return d;
  const next = { ...d, pinned: true, pins: [...d.pins, { reason, ref, actor, at: Date.now() }] };
  await storage.writeJSON(versionRel(pid, key, v), next); return next;
}

/** Legacy backfill: the embedded history (≤5) and the current document become versions; nothing is invented. */
export async function backfillVersions(storage, pid, key, current) {
  if (!current) return 0;
  const have = new Set((await listVersions(storage, pid, key)).map(d => d.version)); let n = 0;
  for (const old of current.versions || []) if (Number.isInteger(old.version) && !have.has(old.version)) { await storage.writeJSON(versionRel(pid, key, old.version), versionDoc(key, { version: old.version, content: old.content, meta: old.meta, basedOn: old.basedOn, by: old.by, note: old.note, updatedAt: old.at }, { source: 'backfill' })); n++; }
  if (!have.has(current.version)) { await storage.writeJSON(versionRel(pid, key, current.version), versionDoc(key, current, { source: 'backfill' })); n++; }
  return n;
}

/** VariantSet of a logical slot: current pointer, approved/released pins, candidates. */
export async function variantSet(storage, pid, key, current) {
  const versions = await listVersions(storage, pid, key);
  return { key, current: current?.version ?? null, versions: versions.map(d => ({ version: d.version, hash: d.hash, by: d.by, note: d.note, at: d.at, pinned: d.pinned, pins: d.pins.map(p => p.reason), restoredFrom: d.restoredFrom || null, source: d.source || null, status: d.version === current?.version ? 'current' : d.pins.some(p => p.reason === 'approved') ? 'approved' : d.pins.some(p => p.reason === 'released') ? 'released' : 'candidate' })) };
}

/**
 * Retention dry-run: a version may be removed only if it is unpinned, not current, not referenced by any
 * current dependency (`basedOn`) and older than the newest `keepUnpinned` unpinned versions of its slot.
 */
export async function retentionPlan(storage, pid, art, { keepUnpinned = 5 } = {}) {
  const referenced = new Set();
  for (const a of Object.values(art)) if (a?.basedOn?.key) referenced.add(`${a.basedOn.key}@${a.basedOn.version}`);
  const remove = [], keep = [];
  for (const key of Object.keys(art).sort()) {
    const vs = await listVersions(storage, pid, key), cur = art[key].version;
    const unpinned = vs.filter(d => !d.pinned && d.version !== cur && !referenced.has(`${key}@${d.version}`)).sort((a, b) => b.version - a.version);
    const drop = new Set(unpinned.slice(keepUnpinned).map(d => d.version));
    for (const d of vs) (drop.has(d.version) ? remove : keep).push({ key, version: d.version, hash: d.hash, reason: drop.has(d.version) ? 'candidat nefixat, peste buget' : d.version === cur ? 'curent' : d.pinned ? `pin: ${d.pins.map(p => p.reason).join(',')}` : referenced.has(`${key}@${d.version}`) ? 'referit de o dependență' : 'în buget' });
  }
  const plan = { remove, keep: keep.length, keepUnpinned, note: 'Dry-run: nimic nu se șterge fără confirmarea planului. Fișierele de imagine rămân (GC separat, cu perioadă de grație).' };
  return { ...plan, planHash: canonicalHash(remove) };
}
export async function applyRetention(storage, pid, art, planHash, opts) {
  const plan = await retentionPlan(storage, pid, art, opts);
  if (plan.planHash !== planHash) throw { status: 409, code: 'plan_conflict', message: 'Planul de retenție s-a schimbat; rulează din nou previzualizarea.' };
  if (storage.kind !== 'postgres') for (const r of plan.remove) await storage.remove(versionRel(pid, r.key, r.version));
  else for (const r of plan.remove) await storage.q('DELETE FROM artifact_versions WHERE project_id=$1 AND key=$2 AND version=$3 AND pinned=false', [pid, r.key, r.version]);
  return { removed: plan.remove.length };
}
