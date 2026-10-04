/**
 * P6-T06 — ReleaseCandidate and commercial proof (OUTPUT-15/18, RK22 SURPASS, RK24 ADAPT).
 * One candidate per volume and destination, bound to ALL current evidence:
 *  - the exact approved snapshot (artifact versions + content hashes, reference files with their sha256);
 *  - the expected inventory (every required edition, plus the separate covers for KDP) and the final receipts (sha256,
 *    fingerprint, independent inspection);
 *  - the destination readiness report (P6-T05) and the rights ledger (P1-T05);
 *  - the disclosures/notes the current channel asks for;
 *  - proof statuses kept SEPARATE: digital validation, print/platform acceptance (accepted only with a receipt).
 * Lifecycle: prepared → checked → approved (operator, after the actual preview) → exported → verified.
 * Verification is recomputed live every time (reproducible); anything stale reopens it. Preview stays available.
 */
import { canonicalHash } from './canonical.js';
import { uid, now } from '../repo.js';

export const RC_SCHEMA = 'wonderpages.release-candidate/1';
const STATES = ['prepared', 'checked', 'approved', 'exported', 'verified'];

/** The exact content a release is made of. */
export function snapshotOf({ project, bp, art, v }) {
  const keys = ['brief', 'series', 'cast', 'bible', 'anchors', `script_${v}`, `final_${v}`, `tr_${v}`, ...Array.from({ length: (bp.structure?.pages || 12) + 1 }, (_, p) => `ill_${v}_${p}`)].filter(k => art[k]);
  const versions = Object.fromEntries(keys.map(k => [k, { version: art[k].version ?? null, hash: canonicalHash(art[k].content ?? null).slice(0, 24) }]));
  const refs = (project.refs || []).map(r => ({ file: r.file, sha256: r.sha256 || null }));
  return { versions, refs, hash: canonicalHash({ versions, refs }).slice(0, 24) };
}
export function expectedInventory({ project, bp, preset }) {
  const books = (bp.structure?.books || []).flatMap(b => (b.per_language && project.input?.second_language ? ['first', 'second'] : ['first']).map(lang => ({ book: b.key, lang })));
  return preset === 'kdp' ? [...books, ...books.map(x => ({ book: x.book + '-cover', lang: x.lang, cover: true }))] : books;
}
export function disclosures({ project, art, v, preset }) {
  const labels = art[`final_${v}`]?.content?.labels || {}, out = [
    { id: 'ai_notice', text: labels.ai_notice || 'Text și ilustrații create cu ajutorul inteligenței artificiale și verificate de editor.', where: 'pagina de drepturi' },
    { id: 'font_license', text: 'Fontul Andika este distribuit sub SIL Open Font License; textul licenței însoțește fișierele livrate.', where: 'pachet' }];
  if (preset === 'kdp') out.push({ id: 'channel_ai', text: 'La publicarea pe KDP, declară conținutul generat cu AI conform cerinței curente a canalului (verifică formularul la momentul publicării).', where: 'canal' });
  if (preset !== 'digital') out.push({ id: 'proof', text: 'Acceptarea tipografiei/platformei se declară numai cu dovada probei fizice (chitanță/referință).', where: 'livrare' });
  return out;
}

export function buildCandidate({ project, bp, art, v, preset, receipts = [], readiness = null, rights = null, profileRules = null }) {
  const snapshot = snapshotOf({ project, bp, art, v }), inventory = expectedInventory({ project, bp, preset });
  const rc = { schema: RC_SCHEMA, id: uid('rc'), volume: v + 1, preset, createdAt: now(), snapshot, inventory,
    receipts: receipts.filter(r => r.kind === 'final' && r.preset === preset).map(r => ({ book: r.book, lang: r.lang || 'first', name: r.name, sha256: r.sha256, fingerprint: r.fingerprint, inspection: r.inspection ? { ok: r.inspection.ok, version: r.inspection.version } : null })),
    readiness: readiness ? { status: readiness.status, hash: readiness.hash, version: readiness.version } : null, rights: rights ? { eligible: rights.eligible, blockers: (rights.blockers || []).map(b => ({ ref: b.ref, status: b.status })) } : null,
    profileRules, disclosures: disclosures({ project, art, v, preset }),
    proof: { digital: preset === 'digital' ? (readiness?.status === 'PASS' ? 'validated' : 'unvalidated') : 'not_applicable', print: preset === 'digital' ? 'not_applicable' : 'pending', receipt: null },
    state: 'prepared', history: [{ state: 'prepared', at: now() }] };
  rc.hash = canonicalHash({ ...rc, id: undefined, createdAt: undefined, history: undefined }).slice(0, 24);
  return rc;
}

/** Live verification against the current state (nothing is trusted from the stored candidate except what it promised). */
export function verifyCandidate(rc, { project, bp, art, approved, receipts = [], readiness = null, rights = null, fingerprint = null }) {
  const problems = [], add = (code, message, extra = {}) => problems.push({ code, message, ...extra }), v = rc.volume - 1;
  if (!approved) add('STALE_APPROVAL', 'Volumul nu mai are aprobarea finală curentă (o schimbare a redeschis revizia).');
  const cur = snapshotOf({ project, bp, art, v });
  const changed = Object.keys({ ...rc.snapshot.versions, ...cur.versions }).filter(k => JSON.stringify(rc.snapshot.versions[k]) !== JSON.stringify(cur.versions[k]));
  if (changed.length) add('STALE_APPROVAL', `Conținutul s-a schimbat după candidat: ${changed.slice(0, 6).join(', ')}.`, { keys: changed });
  const refsChanged = JSON.stringify(rc.snapshot.refs) !== JSON.stringify(cur.refs); if (refsChanged) add('STALE_REF', 'Referințele originale s-au schimbat după candidat.');
  const final = receipts.filter(r => r.kind === 'final' && r.preset === rc.preset);
  for (const x of rc.inventory) {
    const r = final.find(e => e.book === x.book && (e.lang || 'first') === x.lang && (!fingerprint || e.fingerprint === fingerprint));
    if (!r) add(x.cover ? 'COVER_MISMATCH' : 'EDITION_MISSING', x.cover ? `Coperta separată ${x.book} (${x.lang}) lipsește sau nu corespunde versiunii curente.` : `Ediția ${x.book} (${x.lang}) lipsește sau este depășită.`, { book: x.book, lang: x.lang });
    else { const was = rc.receipts.find(e => e.book === x.book && e.lang === x.lang); if (was && was.sha256 !== r.sha256) add('FILE_CHANGED', `Fișierul ${r.name} a fost înlocuit după candidat.`, { book: x.book }); if (!was) add('EDITION_MISSING', `Ediția ${x.book} (${x.lang}) nu era în candidat; creează un candidat nou.`, { book: x.book }); }
  }
  for (const p of readiness?.pdfs || []) if (p.status === 'fail') add(/-cover$/.test(p.book) ? 'COVER_MISMATCH' : 'FILE_INTEGRITY', `${p.book} (${p.lang}): ${(p.problems || []).slice(0, 2).join(' ') || p.detail || 'verificare eșuată'}`, { book: p.book });
  if (!readiness) add('DESTINATION_UNMEASURED', 'Validarea destinației nu a rulat.');
  else if (readiness.status !== 'PASS') add(readiness.status === 'UNMEASURED' ? 'DESTINATION_UNMEASURED' : 'DESTINATION_NOT_READY', `Destinația ${rc.preset}: ${readiness.status} — ${readiness.checks.filter(c => c.status !== 'pass').map(c => c.id).join(', ')}.`);
  if (!rights) add('RIGHTS_UNKNOWN', 'Registrul drepturilor nu a fost evaluat.');
  else if (!rights.eligible) add('RIGHTS_MISSING', `Drepturi neclarificate pentru lansarea comercială: ${rights.blockers.map(b => `${b.ref} (${b.status})`).slice(0, 4).join(', ')}.`, { blockers: rights.blockers.map(b => b.ref) });
  return { ok: !problems.length, problems, snapshotHash: cur.hash, readinessHash: readiness?.hash || null, at: now() };
}

/** State machine: an operator approval needs a passing live verification and the actual preview seen. */
export function transition(rc, to, { verification, previewed = false } = {}) {
  const from = rc.state, i = STATES.indexOf(from), j = STATES.indexOf(to);
  if (j < 0) throw { status: 400, message: 'Stare necunoscută.' };
  if (to === 'checked' && !verification?.ok) throw { status: 409, code: 'rc_not_verified', message: 'Candidatul nu trece verificarea curentă.', problems: verification?.problems };
  if (to === 'approved') { if (from !== 'checked') throw { status: 409, code: 'rc_state', message: 'Aprobarea cere un candidat verificat.' }; if (!verification?.ok) throw { status: 409, code: 'rc_not_verified', message: 'Candidatul nu mai trece verificarea curentă; creează unul nou.', problems: verification?.problems }; if (previewed !== true) throw { status: 400, code: 'preview_required', message: 'Confirmă că ai văzut previzualizarea reală a cărții înainte de aprobare.' }; }
  if (['exported', 'verified'].includes(to) && (j !== i + 1 || !verification?.ok)) throw { status: 409, code: 'rc_state', message: `Trecerea ${from} → ${to} nu este permisă acum.`, problems: verification?.problems };
  return { ...rc, state: to, history: [...rc.history, { state: to, at: now() }] };
}

/** Physical/platform acceptance is claimed only with a receipt (proof reference). */
export function recordProof(rc, { kind = 'print', status, receipt = null, actor = 'operator@laptop' }) {
  if (kind !== 'print') throw { status: 400, message: 'Numai proba de tipar/platformă se înregistrează manual; validarea digitală vine din măsurători.' };
  if (rc.proof.print === 'not_applicable') throw { status: 400, message: 'Destinația digitală nu are probă fizică.' };
  if (!['accepted', 'rejected', 'pending'].includes(status)) throw { status: 400, message: 'Stare de probă necunoscută.' };
  if (status === 'accepted' && !String(receipt?.reference || '').trim()) throw { status: 400, code: 'receipt_required', message: 'Acceptarea fizică/platformă cere dovada (referința probei sau a chitanței).' };
  return { ...rc, proof: { ...rc.proof, print: status, receipt: status === 'pending' ? null : { reference: String(receipt?.reference || '').slice(0, 200), note: String(receipt?.note || '').slice(0, 500), snapshotHash: rc.snapshot.hash, files: rc.receipts.map(r => r.sha256), actor, at: now() } }, history: [...rc.history, { state: rc.state, proof: status, at: now() }] };
}

/**
 * P8-T03 — commercial status, destination-specific and evidence-based. A candidate speaks only for ITS destination
 * (digital / kdp / print); other destinations are "not_evaluated" until they have their own candidate. Eligible only
 * when: the live verification passes (approval, files, readiness, rights), the candidate was exported and verified,
 * the export is the final deliverable (a source-only/project package is never a commercial deliverable), and — for
 * physical/platform destinations — the proof receipt was recorded for exactly the current snapshot and files.
 */
export const DESTINATIONS = Object.freeze(['digital', 'kdp', 'print']);
export function commercialStatus(rc, { verification, exportKind = 'final' } = {}) {
  const reasons = [], add = (code, message) => reasons.push({ code, message });
  for (const p of verification?.problems || []) if (/^RIGHTS_/.test(p.code)) add(p.code, p.message);
  if (!verification) add('UNVERIFIED', 'Verificarea curentă nu a rulat.');
  else if (verification.problems?.some(p => !/^RIGHTS_/.test(p.code))) add('VERIFICATION_FAILED', `Verificarea curentă nu trece: ${verification.problems.filter(p => !/^RIGHTS_/.test(p.code)).map(p => p.code).slice(0, 4).join(', ')}.`);
  if (exportKind !== 'final') add('SOURCE_ONLY', 'Exportul este un pachet-sursă (proiect/manuscris), nu fișierele finale verificate: nu este un livrabil comercial.');
  if (!['exported', 'verified'].includes(rc.state)) add('NOT_EXPORTED', `Candidatul este „${rc.state}”: livrarea finală nu a fost exportată și verificată.`);
  if (rc.preset === 'digital') { if (rc.proof.digital !== 'validated') add('DIGITAL_UNVALIDATED', 'Validarea digitală (măsurată) nu a trecut.'); }
  else if (rc.proof.print !== 'accepted') add(rc.proof.print === 'rejected' ? 'PROOF_REJECTED' : 'PROOF_PENDING', rc.proof.print === 'rejected' ? 'Proba fizică/platformă a fost respinsă.' : 'Lipsește dovada probei fizice/platformei (chitanță sau referință).');
  else { const r = rc.proof.receipt, cur = verification?.snapshotHash; if (!r?.snapshotHash || (cur && r.snapshotHash !== cur)) add('PROOF_STALE', 'Dovada probei a fost înregistrată pentru alt conținut sau alte fișiere decât cele curente: repetă proba.'); }
  const status = reasons.some(r => /^RIGHTS_/.test(r.code)) ? 'blocked_rights' : reasons.length ? 'not_eligible' : 'eligible';
  return { destination: rc.preset, candidate: rc.id, volume: rc.volume, status, reasons, evidence: { snapshotHash: verification?.snapshotHash || null, readinessHash: verification?.readinessHash || null, proof: rc.proof, rights: rc.rights, state: rc.state },
    otherDestinations: Object.fromEntries(DESTINATIONS.filter(d => d !== rc.preset).map(d => [d, 'not_evaluated'])),
    limitations: ['Evaluare internă pe baza dovezilor înregistrate; nu este consultanță juridică și nu garantează acceptarea de către platformă sau tipografie.'] };
}

/** Export step: the manifest is written next to the verified package; a failing secondary copy never undoes the primary. */
export async function exportRelease({ zip, manifestPath, manifest, writeFile, mirror }) {
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  let m; try { m = { status: 'ok', ...((await mirror([zip, manifestPath])) || {}) }; } catch (e) { m = { status: 'failed', error: String(e?.message || e).slice(0, 300) }; }
  return { zip, manifest: manifestPath, at: now(), mirror: m };
}
