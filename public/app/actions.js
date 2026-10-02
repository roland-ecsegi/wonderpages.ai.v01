let manualDocument=null;
const documentLabels={characters:'Personaje',name:'Nume',id:'Identificator',canonical_description:'Identitate vizuală canonică',approximate_age:'Vârstă aproximativă',desire:'Dorință',fear:'Frică',goal:'Obiectiv',flaw:'Defect',strength:'Calitate',relationships:'Relații',voice:'Voce și vocabular',gestures:'Gesturi',visual_landmarks:'Repere anatomice',side:'Partea personajului',body_region:'Regiunea corpului',anchor:'Poziția față de reperele corpului',relative_size:'Dimensiune relativă',shape:'Formă',colour:'Culoare',occlusion_rule:'Când poate fi ascuns',pages:'Pagini',n:'Număr',text:'Text',page_type:'Tipul paginii',emotion:'Emoție',new_information:'Informație nouă',image_added_value:'Ce adaugă imaginea',story_bible:'Planul poveștii',premise:'Premisă',theme:'Temă',protagonist:'Protagonist',obstacle:'Obstacol',inciting_incident:'Incident declanșator',escalation:'Escaladare',climax_choice:'Alegerea decisivă',resolution:'Rezolvare',ending:'Final',world_rules:'Regulile lumii',storyboard:'Storyboard',shot:'Plan',angle:'Unghi',focal_action:'Acțiunea principală',direction:'Direcție',lighting:'Lumină',rationale:'Scop narativ',turn:'Legătura cu pagina următoare',hook:'Anticipare',payoff_page:'Pagina răspunsului',payoff:'Răspuns',spread:'Spread / pagini vizibile simultan',layout:'Machetă',text_zone:'Zona textului',title:'Titlu',collection_title:'Titlul colecției'};
const documentValue=parts=>parts.reduce((o,k)=>o[k],manualDocument.content);
function emptyDocumentValue(v){if(Array.isArray(v))return [];if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,emptyDocumentValue(x)]));return typeof v==='boolean'?false:typeof v==='number'?0:'';}
function collectDocumentEditor(){for(const el of document.querySelectorAll('#modal [data-document-path]')){const parts=JSON.parse(el.dataset.documentPath),key=parts.pop(),parent=documentValue(parts);parent[key]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;}}
function documentFields(v,parts=[]){
 const field=parts.at(-1),label=documentLabels[field]||String(field||'Document').replace(/_/g,' '),p=esc(JSON.stringify(parts));
 if(Array.isArray(v))return '<fieldset style="min-width:0;margin:10px 0"><legend>'+esc(label)+'</legend>'+v.map((x,i)=>'<div class="panel panel-pad" style="margin:8px 0">'+documentFields(x,[...parts,i])+'<button class="btn sm ghost" data-act="document-array-remove" data-path="'+p+'" data-index="'+i+'">Elimină elementul '+(i+1)+'</button></div>').join('')+'<button class="btn sm" data-act="document-array-add" data-path="'+p+'">Adaugă</button></fieldset>';
 if(v&&typeof v==='object')return '<fieldset style="min-width:0;margin:10px 0"><legend>'+esc(typeof field==='number'?'Elementul '+(field+1):label)+'</legend>'+Object.entries(v).map(([k,x])=>documentFields(x,[...parts,k])).join('')+'</fieldset>';
 const attr='data-document-path="'+p+'" aria-label="'+esc(label)+'"';
 return '<label class="field" style="display:block;margin:8px 0">'+esc(label)+(typeof v==='boolean'?'<input type="checkbox" '+attr+' '+(v?'checked':'')+'>':typeof v==='number'?'<input class="input" type="number" '+attr+' value="'+v+'">':'<textarea class="textarea" style="min-height:65px" '+attr+' '+(field==='id'&&v?'readonly':'')+'>'+esc(v??'')+'</textarea>')+'</label>';
}
function showDocumentEditor(){openModal('<h3>Editează documentul</h3><p class="small">Salvarea creează o versiune nouă. Aprobările elementelor afectate se reverifică. Reperele sunt legate de corpul personajului, inclusiv când perspectiva le ascunde.</p>'+documentFields(manualDocument.content)+'<div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn primary" data-act="artifact-edit-save">Salvează</button></div>');}
function artifactVersionHTML(c){
  const images=[['color','Imagine color'],['lineart','Pagină de colorat']].filter(([k])=>c?.[k]);
  const rendered=images.length?'<div class="ap-imgs">'+images.map(([k,label])=>'<figure><figcaption>'+label+'</figcaption><img src="'+fileUrl(c[k])+'" alt="'+label+'" style="max-width:100%;height:auto"></figure>').join('')+'</div>':c?.pages?'<h4>'+esc(c.title||'Pagini')+'</h4>'+(c.pages||[]).map(pg=>'<p><b>Pagina '+esc(pg.n)+'</b><br>'+esc(pg.text||'Pagină fără text')+'</p>').join(''):c?.characters?(c.characters||[]).map(ch=>'<p><b>'+esc(ch.name)+'</b><br>'+esc(ch.canonical_description||'')+'</p>').join(''):'';
  return rendered+'<details '+(rendered?'':'open')+'><summary>Detalii complete</summary><pre>'+esc(JSON.stringify(c,null,2))+'</pre></details>';
}
/* WonderPages.AI — Ferestre de dialog și acțiunile butoanelor (delegare de evenimente).
   Scripturi clasice încărcate în ordine (core, views, ui, actions, pdf); împart același spațiu global. */
/* ============================================================
   ACTIONS
   ============================================================ */
/* audit WCAG 4.1.3 + 2.2.1: one permanent live region; errors stay until closed, other messages for 6 s */
function toast(msg, kind) {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const isErr = kind === 'error' || /nu a (putut|reușit)|eroare|nu răspunde|refuz|lipsește|invalid/i.test(String(msg));
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  const x = document.createElement('button'); x.className = 'x'; x.type = 'button'; x.setAttribute('aria-label', 'Închide mesajul'); x.textContent = '×'; x.onclick = () => t.remove(); t.appendChild(x);
  box.appendChild(t); if (!isErr) setTimeout(() => t.remove(), 6000);
}
/* audit WCAG 2.4.3 / 4.1.2: the dialog has a name, keeps the focus inside and gives it back when it closes */
let modalReturn = null;
function openModal(html) {
  const back = document.activeElement; closeModal(); modalReturn = back;
  const m = document.createElement('div'); m.className = 'modal-back'; m.id = 'modal';
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(m);
  const d = m.querySelector('.modal'); const h = d.querySelector('h1,h2,h3'); if (h) { h.id = h.id || 'modal-title'; d.setAttribute('aria-labelledby', h.id); } else d.setAttribute('aria-label', 'Dialog');
  setTimeout(() => $('#modal textarea, #modal input, #modal select, #modal button:not(.ghost)')?.focus() || $('#modal button')?.focus(), 30);
}
function closeModal() { const m = $('#modal'); if (!m) return; m.remove(); const r = modalReturn; modalReturn = null; if (r && document.contains(r)) r.focus?.(); }
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return; const m = $('#modal .modal'); if (!m) return;
  const f = [...m.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
  if (!f.length) return; const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } else if (!m.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
});
/* confirmation for actions that cannot be undone or touch many elements at once (audit UX) */
function confirmAct(title, text, okLabel, fn, danger = false) {
  openModal(`<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn ${danger ? 'danger' : 'primary'}" id="confirm-ok">${esc(okLabel)}</button></div>`);
  $('#confirm-ok').onclick = async () => { closeModal(); try { await fn(); } catch (e) { toast(e.message || 'Acțiunea nu a reușit.', 'error'); } };
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copiat.'); }
  catch { openModal(`<h3>Copiază promptul</h3><textarea class="textarea" style="min-height:200px;font:12.5px/1.5 var(--mono)" readonly>${esc(text)}</textarea><div class="foot"><button class="btn primary" data-act="modal-close">Gata</button></div>`); setTimeout(() => $('#modal textarea')?.select(), 40); }
}

async function createProject() {
  const t = typeBySlug(S.wiz.slug); if (!t) return;
  $('[data-act="start"]')?.setAttribute('disabled', '');
  try {
    const refs = (S.wiz.files || []).map(x => ({ name: x.name, mime: x.mime, data: x.url.split(',')[1] }));
    const r = await api('POST', '/projects', { typeSlug: t.slug, input: { ...S.wiz.values }, options: { ...S.wiz.options }, refs, previewHash: S.wiz.preview?.formHash ?? undefined, source: S.wiz.source || undefined });   // P4-T01: bound to what you confirmed
    S.wiz = { slug: null, values: {}, step: 2, errors: {}, options: { images: imagesOk() }, files: [] };
    await loadState(); location.hash = `#/p/${r.id}/progress`; toast('Proiect creat. Apasă „Pornește lucrul” când vrei să înceapă.');
  } catch (e) { if (e.code === 'stale_form') { S.wiz.preview = null; loadPreview(); } toast('Proiectul nu a putut fi creat: ' + e.message); $('[data-act="start"]')?.removeAttribute('disabled'); }
}
/* P4-T01: the contract preview is computed by the server from exactly the values that will be sent */
function loadPreview() {
  const t = typeBySlug(S.wiz.slug); if (!t) return; const sent = JSON.stringify(S.wiz.values);
  api('POST', '/intake/preview', { typeSlug: t.slug, input: { ...S.wiz.values }, source: S.wiz.source || undefined }).then(p => { if (JSON.stringify(S.wiz.values) === sent) { S.wiz.preview = p; render(); } }).catch(e => { S.wiz.preview = { valid: false, errors: [{ message: e.message }], languages: [], source: { label: '—' } }; render(); });
}

function decisionModal(d) {
  const p = curProject(); const g = S.bp.gates?.[p.gate.key] || {};
  if (d === 'approved') return openModal(`<h3>Aprobă: ${esc(gateLabel(p))}</h3><p class="muted">${esc(g.approve_hint || 'Generarea continuă cu etapa următoare.')}</p><div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn primary" data-act="do-decide" data-d="approved">Aprobă și continuă</button></div>`);
  if (d === 'approved_with_notes') return openModal(`<h3>Aprobă cu note</h3><p class="muted small">Generarea continuă, iar notele devin constrângeri pentru toate etapele următoare.</p><div class="field" style="margin-top:14px"><textarea class="textarea" id="d-note" aria-label="Nota sau motivul" placeholder="Ex.: fundaluri mai luminoase; bunica să apară și în volumul 4; evită cuvântul „fricos”."></textarea></div><div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn primary" data-act="do-decide" data-d="approved_with_notes">Aprobă cu aceste note</button></div>`);
  if (d === 'needs_correction') {
    const pats = g.correctable || [];
    const vol = p.gate.vol; const inVol = k => vol == null || !/_\d+(_\d+)?$/.test(k) ? true : k.startsWith('ill_') ? k.split('_')[1] === String(vol) : k.endsWith('_' + vol);
    const keys = Object.keys(S.art).filter(k => pats.some(pt => globMatch(pt, k) != null) && inVol(k)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const withCm = new Set(S.comments.filter(c => c.status === 'open' && c.gateKey === p.gate.key).map(c => c.artifactKey));
    const cur = S.sel[p.id];
    const lab = k => k.startsWith('ill_') ? 'Ilustrație, ' + pageLabel(...k.split('_').slice(1).map(Number)) : defFor(S.bp, k).label;
    return openModal(`<h3>Cere corecții</h3><p class="muted small">AI-ul modifică doar documentele bifate, ține cont de comentariile deschise pe ele, apoi redeschide revizuirea.</p>
      <div class="field" style="margin-top:14px"><span class="lbl">Ce trebuie corectat</span><textarea class="textarea" id="d-note" aria-label="Nota sau motivul" placeholder="Descrie corecția. Comentariile ancorate se adaugă automat."></textarea></div>
      <div class="field"><span class="lbl">Documente vizate</span><div class="targets">${keys.map(k => `<label class="check small"><input type="checkbox" class="d-target" value="${esc(k)}" ${withCm.has(k) || (!withCm.size && k === cur) ? 'checked' : ''}> ${esc(lab(k))}${withCm.has(k) ? ' <span class="faint">(are comentarii)</span>' : ''}</label>`).join('') || '<span class="faint small">Niciun document corectabil.</span>'}</div></div>
      <div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn primary" data-act="do-decide" data-d="needs_correction">Trimite corecțiile</button></div>`);
  }
  if (d === 'rejected') return openModal(`<h3>Respinge</h3><p class="muted small">Motivul e păstrat și transmis AI-ului ca direcție de evitat la reluare.</p>
    <div class="field" style="margin-top:14px"><span class="lbl">Motiv</span><textarea class="textarea" id="d-note" aria-label="Nota sau motivul" placeholder="Ce nu funcționează?"></textarea></div>
    <div class="field"><span class="lbl">Ce urmează</span><div class="stack small">
      <label class="check"><input type="radio" name="rj" value="phase" checked> Reia faza curentă de la început</label>
      <label class="check"><input type="radio" name="rj" value="all"> Reia tot proiectul de la brief</label>
      <label class="check"><input type="radio" name="rj" value="archive"> Arhivează proiectul</label></div></div>
    <div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn danger" data-act="do-decide" data-d="rejected">Respinge</button></div>`);
}
async function doDecide(d) {
  const p = curProject(); if (!p?.gate) return closeModal();
  const note = ($('#d-note')?.value || '').trim();
  if ((d === 'approved_with_notes' || d === 'needs_correction' || d === 'rejected') && !note) { toast('Scrie mai întâi nota sau motivul.'); $('#d-note')?.focus(); return; }
  const targets = $$('.d-target:checked').map(x => x.value);
  if (d === 'needs_correction' && !targets.length) { toast('Bifează cel puțin un document de corectat.'); return; }
  const restart = $('input[name="rj"]:checked')?.value || 'phase';
  closeModal();
  try { await api('POST', `/projects/${p.id}/decide`, { decision: d, note, targets, restart }); if (!(d === 'rejected' && restart === 'archive')) location.hash = `#/p/${p.id}/progress`; }
  catch (e) { toast(e.message); }
}
function regenModal(key) {
  const [, v, pg] = key.split('_').map(Number);
  const has = S.art[key]?.content?.color;
  openModal(`<h3>${has ? 'Redesenează' : 'Desenează'}: ${esc(pageLabel(v, pg))}</h3><p class="muted small">Canva desenează pagina color, apoi pagina de colorat pornind de la ea. Restul cărții rămâne neatins.</p>
    <div class="field" style="margin-top:14px"><span class="lbl">Instrucțiune <span class="opt">(opțional)</span></span><textarea class="textarea" id="rg-note" aria-label="Ce vrei schimbat la regenerare" placeholder="Ex.: personajul să zâmbească și să fie mai aproape; cer de dimineață."></textarea></div>
    <div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn primary" data-act="do-regen" data-key="${esc(key)}">${has ? 'Redesenează' : 'Desenează'}</button></div>`);
}
function sketchStageFor(v) {
  const stages = S.bp.stages.filter(s => s.handler === 'canva_images');
  const ok = stages.filter(s => S.art[`${s.source}_${v}`]);
  return (ok[ok.length - 1] || stages[0])?.key;
}
async function startRedo(p, keys, instruction, label) {
  const [, v] = keys[0].split('_').map(Number);
  try { await api('POST', `/projects/${p.id}/task`, { targets: keys, feedback: instruction, redoStage: sketchStageFor(v), label }); } catch (e) { toast(e.message); }
}
async function saveText(v, pg) {
  const p = curProject(); const src = bookInfo(p).src(v); if (!src) return;
  const text = ($('#edit-text')?.value || '').trim();
  const c = clone(src.key.startsWith('tr_') ? S.art[src.key].content : src.c); if (!c.pages?.[pg - 1]) return;
  if (c.pages[pg - 1].text === text) { S.editing = null; render(); return; }
  c.pages[pg - 1].text = text;
  try { await api('POST', `/projects/${p.id}/artifacts/${src.key}`, { content: c, note: `Editare manuală, pagina ${pg}` }); } catch (e) { toast(e.message); return; }
  S.editing = null; document.activeElement?.blur(); toast('Text salvat ca versiune nouă.'); render();
}
async function addComment(key) {
  const p = curProject(); const body = ($('#cm-body')?.value || '').trim();
  if (!body) { $('#cm-body')?.focus(); return; }
  const quote = S.composer?.key === key ? S.composer.quote : '';
  await api('POST', `/projects/${p.id}/comments`, { artifactKey: key, quote, body, severity: $('#cm-must')?.checked ? 'must' : 'note', gateKey: p.gate?.key || null, round: p.gate?.round || null, author: 'local' });
  S.composer = null; $('#cm-body').value = ''; document.activeElement?.blur(); render();
}
async function studioSave(dup) {
  const t = typeBySlug(S.route.slug);
  let obj; try { obj = JSON.parse($('#studio-json').value); } catch (e) { S.studio.errors = ['JSON invalid: ' + e.message]; S.studio.text = $('#studio-json').value; render(); return; }
  if (dup) { obj.slug = (obj.slug || 'tip') + '-copie-' + Math.random().toString(36).slice(2, 5); obj.name = (obj.name || '') + ' (copie)'; obj.full_name = (obj.full_name || obj.name) + ''; obj.version = 1; obj.status = 'draft'; }
  const errs = validateBlueprint(obj);
  S.studio.text = $('#studio-json').value; S.studio.errors = errs;
  if (errs.length) { render(); return; }
  if (!dup && obj.slug !== t.slug) { S.studio.errors = ['„slug” nu se poate schimba la publicare. Folosește „Duplică ca tip nou”.']; render(); return; }
  if (!dup) obj.version = Number(t.version || 0) + 1;
  obj.updatedAt = now();
  try { await api('PUT', '/types/' + (dup ? obj.slug : t.slug), obj); await loadState(); } catch (e) { toast('Nu s-a putut salva: ' + e.message); return; }
  toast(dup ? 'Tip nou creat ca ciornă.' : `Versiunea ${obj.version} a fost publicată.`);
  S.studio = { slug: null, text: '', errors: null };
  location.hash = '#/studio/' + obj.slug;
}

const ACT = {
  'blueprint-upgrade': el => confirm('Schimbă contractul proiectului', 'Textele și imaginile se păstrează. Toate aprobările se refac. Contractul precedent se salvează pentru revenire; nu sunt completate automat detalii necunoscute.', async()=>{try{await api('POST','/projects/'+S.cur+'/blueprint-upgrade',{restore:el.dataset.restore==='1'});await loadProject();render();}catch(e){toast(e.message);}}, 'Schimbă contractul'),
  'artifact-edit': el => { manualDocument={key:el.dataset.key,content:clone(S.art[el.dataset.key].content)}; if(manualDocument.key==='bible')for(const ch of manualDocument.content.characters||[]){for(const field of ['approximate_age','desire','fear','goal','flaw','strength','voice','gestures'])ch[field]??='';ch.relationships??=[];ch.visual_landmarks??=[];} showDocumentEditor(); },
  'artifact-edit-save': async () => { try{collectDocumentEditor();await api('POST','/projects/'+S.cur+'/artifacts/'+manualDocument.key,{content:manualDocument.content,note:'Document editat explicit, fără apel AI'});closeModal();await loadProject();render();}catch(e){toast(e.message);} },
  'document-array-add': el => { collectDocumentEditor();const parts=JSON.parse(el.dataset.path),arr=documentValue(parts),key=parts.at(-1);arr.push(key==='visual_landmarks'?{id:'',side:'left',body_region:'',anchor:'',relative_size:'',shape:'',colour:'',occlusion_rule:''}:arr.length?emptyDocumentValue(arr[0]):'');showDocumentEditor(); },
  'document-array-remove': el => { collectDocumentEditor();documentValue(JSON.parse(el.dataset.path)).splice(Number(el.dataset.index),1);showDocumentEditor(); },
  'layout-edit': el => { const pg=S.art[el.dataset.key]?.content?.pages?.[Number(el.dataset.p)-1]; openModal('<h3>Macheta paginii '+el.dataset.p+'</h3><label>Familie<select id="layout-family" class="select">'+['action','dialogue','surprise','panorama','intimate'].map(x=>'<option '+(pg?.layout?.family===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label><label>Zonă text<select id="layout-zone" class="select">'+['bottom','top','left','right'].map(x=>'<option '+((pg?.layout?.text_zone||pg?.text_zone)===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label><label class="row"><input type="checkbox" id="layout-motif" '+(pg?.layout?.motif?'checked':'')+'> Refren vizual intenționat (repetarea machetei este voită)</label><div class="foot"><button class="btn" data-act="layout-save" data-key="'+esc(el.dataset.key)+'" data-p="'+el.dataset.p+'">Salvează macheta</button></div>'); },
  'layout-save': async el => { const c=clone(S.art[el.dataset.key].content), pg=c.pages[Number(el.dataset.p)-1];pg.layout={family:$('#layout-family').value,text_zone:$('#layout-zone').value,...($('#layout-motif')?.checked?{motif:true}:{})};pg.text_zone=pg.layout.text_zone;try{await api('POST','/projects/'+S.cur+'/artifacts/'+el.dataset.key,{content:c,note:'Machetă ajustată local'});closeModal();await loadProject(S.cur);render();}catch(e){toast(e.message);} },
  'artifact-history': async el => { try {const h=await api('GET','/projects/'+S.cur+'/artifacts/'+el.dataset.key+'/history');openModal('<h3>Istoric și comparație</h3><details open><summary>Acum · versiunea '+h.current.version+'</summary>'+artifactVersionHTML(h.current.content)+'</details>'+h.versions.map(v=>'<details><summary>Versiunea '+v.version+' · '+esc(v.note||'')+'</summary>'+artifactVersionHTML(v.content)+'<button class="btn" data-act="artifact-restore" data-key="'+esc(el.dataset.key)+'" data-version="'+v.version+'">Revino la această versiune</button></details>').join(''));}catch(e){toast(e.message);} },
  'artifact-restore': async el => { try {await api('POST','/projects/'+S.cur+'/artifacts/'+el.dataset.key+'/restore',{version:Number(el.dataset.version)});closeModal();await loadProject(S.cur);render();toast('Versiune restaurată; aprobările dependente trebuie reverificate.');}catch(e){toast(e.message);} },
  'manual-media': el => { openModal('<h3>Încarcă o corectură din ChatGPT sau Canva</h3><p>Se păstrează versiunile anterioare. Culoarea nouă cere revizuire și actualizarea paginii de colorat.</p><input type="file" id="manual-file" accept="image/png,image/jpeg"><label class="check"><input type="checkbox" id="manual-review">Am verificat anatomia, acțiunea, continuitatea și lizibilitatea acestei corecturi.</label><div class="foot"><button class="btn" data-act="manual-media-save" data-key="'+esc(el.dataset.key)+'" data-mode="'+esc(el.dataset.mode)+'">Încarcă</button></div>'); },
  'manual-media-save': async el => { const f=$('#manual-file')?.files?.[0];if(!f)return toast('Alege un fișier.');try {const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(f);});await api('POST','/projects/'+S.cur+'/artifacts/'+el.dataset.key+'/media',{data,mode:el.dataset.mode,review:!!$("#manual-review")?.checked});closeModal();await loadProject(S.cur);render();}catch(e){toast(e.message);} },
  'filter': el => { S.filter = el.dataset.f; render(); },
  'read-mode': el => { S.readMode = el.dataset.m; render(); },
  'dali-toggle': () => { S.dali.open = !S.dali.open; S.dali.last = Date.now(); daliSave(); paintDali(); if (S.dali.open) setTimeout(() => $('#rb-in')?.focus(), 30); },
  'dali-min': () => { S.dali.open = false; daliSave(); paintDali(); },
  'dali-end': () => (S.dali.msgs.length ? confirmAct('Închei conversația cu Dali?', 'Conversația se șterge.', 'Încheie', () => daliEnd(true)) : daliEnd(true)),
  'dali-send': () => daliSend($('#rb-in')?.value),
  'dali-tour': () => { S.dali.msgs.push({ role: 'user', text: 'Prezintă-mi aplicația' }); daliTourMenu(); },
  'dali-tour-pick': el => el.dataset.k === '_menu' ? daliTourMenu('Ce altceva vrei să-ți prezint?') : daliTourPick(el.dataset.k),
  'dali-improve': () => { S.dali.msgs.push({ role: 'user', text: 'Notează o îmbunătățire' }); S.dali.msgs.push({ role: 'dali', text: 'Sigur. Descrie-mi pe scurt ce vrei îmbunătățit sau ce problemă ai văzut; o formulez eu clar și o trec în listă.' }); S.dali.improve = true; S.dali.last = Date.now(); daliSave(); paintDali(); setTimeout(() => $('#rb-in')?.focus(), 30); },
  'dali-fill': el => { const a = S.dali.msgs[Number(el.dataset.m)]?.actions?.[Number(el.dataset.i)]; if (a) daliFill(a.values || {}); },
  'imp-start': el => api('POST', `/improvements/${el.dataset.id}/start`, {}).then(() => toast('Inginerul analizează; primești propunerea aici.')).catch(e => impBusy(e)),
  'imp-approve': el => api('POST', `/improvements/${el.dataset.id}/approve`).then(() => toast('Aprobat. Inginerul lucrează într-o copie separată.')).catch(e => impBusy(e)),
  'imp-retry': el => openModal(`<h3>Mai încearcă</h3><p class="small muted">Spune ce nu-ți place la propunere sau ce ar trebui să fie altfel.</p><div class="field" style="margin-top:10px"><textarea class="textarea" id="imp-comment" aria-label="Ce ar trebui să fie altfel"></textarea></div><div class="foot"><button class="btn ghost" data-act="modal-close">Renunță</button><button class="btn primary" data-act="imp-do-retry" data-id="${esc(el.dataset.id)}">Trimite</button></div>`),
  'imp-do-retry': el => { const c = ($('#imp-comment')?.value || '').trim(); if (!c) { toast('Scrie un comentariu.'); return; } closeModal(); api('POST', `/improvements/${el.dataset.id}/retry`, { comment: c }).then(() => toast('Inginerul pregătește o propunere nouă.')).catch(e => impBusy(e)); },
  'imp-cancel': el => api('POST', `/improvements/${el.dataset.id}/cancel`).then(() => toast('Anulat; îmbunătățirea rămâne în listă.')).catch(e => toast(e.message)),
  'imp-stop': el => api('POST', `/improvements/${el.dataset.id}/stop`).catch(e => toast(e.message)),
  'imp-resolve': el => openModal(`<h3>Aplic îmbunătățirea?</h3><p class="small muted">Fișierele modificate se copiază în aplicație, iar versiunea de dinainte se păstrează (poți reveni oricând). Dacă s-a schimbat cod, aplicația repornește singură în câteva secunde.</p><div class="foot"><button class="btn ghost" data-act="modal-close">Renunță</button><button class="btn primary" data-act="imp-do-resolve" data-id="${esc(el.dataset.id)}">Rezolvat</button></div>`),
  'imp-do-resolve': el => { closeModal(); api('POST', `/improvements/${el.dataset.id}/resolve`).then(r => { toast(r.restart === 'auto' ? 'Aplicat. Aplicația repornește; pagina se reîncarcă singură.' : r.restart === 'manual' ? 'Aplicat. Repornește aplicația (opreste.bat, apoi scurtătura) ca să intre în vigoare.' : 'Aplicat.'); if (r.restart === 'auto') setTimeout(() => location.reload(), 15000); if (r.restart === 'reload') setTimeout(() => location.reload(), 1500); }).catch(e => toast(e.message)); },
  'imp-reject': el => api('POST', `/improvements/${el.dataset.id}/reject`, {}).then(() => toast('Respinsă; aplicația rămâne neschimbată.')).catch(e => toast(e.message)),
  'imp-rollback': el => openModal(`<h3>Revii la versiunea de dinainte?</h3><p class="small muted">Fișierele schimbate de această îmbunătățire se înlocuiesc cu cele vechi, iar aplicația repornește.</p><div class="foot"><button class="btn ghost" data-act="modal-close">Renunță</button><button class="btn danger" data-act="imp-do-rollback" data-id="${esc(el.dataset.id)}">Revino</button></div>`),
  'imp-do-rollback': el => { closeModal(); api('POST', `/improvements/${el.dataset.id}/rollback`).then(r => { toast('Revenit.'); if (r.restart === 'auto') setTimeout(() => location.reload(), 15000); if (r.restart === 'reload') setTimeout(() => location.reload(), 1500); }).catch(e => toast(e.message)); },
  'imp-f': el => { S.impF = el.dataset.f; render(); },
  'imp-new': () => impModal(),
  'imp-edit': el => impModal(S.impr.find(i => i.id === el.dataset.id)),
  'skip': () => { const m = document.getElementById('main'); m?.focus(); m?.scrollIntoView(); },
  'backup-now': () => api('POST', '/backups').then(r => { toast('Copie salvată: ' + r.file+(r.mirror?.error ? '. Copia secundară a eșuat: '+r.mirror.error : ''),r.mirror?.error?'error':undefined); S.backups = null; render(); }).catch(e => toast(e.message, 'error')),
  'backup-restore': el => { const f = el.dataset.file;
    openModal(`<h3>Restaurezi baza de date?</h3><p class="muted">Proiectele, documentele și aprobările revin la starea din <b>${esc(f)}</b>. Înainte, aplicația salvează automat starea de acum. Apoi aplicația repornește.</p><div class="field" style="margin-top:12px"><label class="lbl" for="rs-confirm">Scrie RESTAUREAZĂ ca să confirmi</label><input class="input" id="rs-confirm" autocomplete="off"></div><div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn danger" id="rs-ok">Restaurează</button></div>`);
    $('#rs-ok').onclick = async () => { const c = $('#rs-confirm').value; try { const r = await api('POST', '/backups/restore', { file: f, confirm: c }); closeModal(); toast(`Restaurat din ${r.restored}. Copia stării anterioare: ${r.safety}. ${r.restart === 'auto' ? 'Aplicația repornește; pagina se reîncarcă singură.' : 'Repornește aplicația (opreste.bat, apoi scurtătura WonderPages).'}`); if (r.restart === 'auto') setTimeout(() => location.reload(), 12000); } catch (e) { toast(e.message, 'error'); } }; },
  'imp-del': el => confirmAct('Ștergi îmbunătățirea?', 'Dispare din listă definitiv.', 'Șterge', () => api('DELETE', '/improvements/' + el.dataset.id).then(loadImprovements), true),
  'imp-save': el => { const b = { title: $('#imp-t').value, category: $('#imp-c').value, priority: $('#imp-p').value, description: $('#imp-d').value }; closeModal(); (el.dataset.id ? api('PUT', '/improvements/' + el.dataset.id, b) : api('POST', '/improvements', b)).then(loadImprovements).catch(e => toast(e.message)); },
  'pz': el => { const h = $(`[data-panzoom="${el.dataset.k}"]`); if (!h?._zoom) return; el.dataset.z === 'fit' ? h._fit() : h._zoom(el.dataset.z === 'in' ? 1.25 : 0.8); },
  'tl-gate': () => { location.hash = `#/p/${S.cur}/review`; },
  'rev-mode': el => { S.revMode = el.dataset.m; render(); },
  'open-doc': el => { S.revMode = 'docs'; S.sel[S.cur] = el.dataset.key; render(); },
  'ap-filter': el => { S.apFilter = el.dataset.f; render(); },
  'it': el => setItems([{ id: el.dataset.id, state: el.dataset.s }]),
  'it-more': el => itemMore(el.dataset.id),
  'it-set': el => { const note = ($('#it-note')?.value || '').trim(); if (el.dataset.s !== 'rejected' && !note) { toast('Scrie ce trebuie schimbat.'); return; } const engine = $('#it-engine')?.value || undefined; const code = $('#it-code')?.value || undefined; const mode = $('#it-mode')?.value || undefined; closeModal(); setItems([{ id: el.dataset.id, state: el.dataset.s, note, engine, code, mode }]); },
  'ap-all': () => { const pend = S.review.items.filter(i => i.state === 'pending'); const imgs = pend.filter(i => i.kind === 'image').length;
    confirmAct(`Aprobi toate cele ${pend.length} elemente rămase?`, `Aprobarea înseamnă că le-ai văzut și sunt bune de tipar${imgs ? `, inclusiv ${imgs} imagini` : ''}. Verifică-le înainte; poți anula ulterior doar cerând modificări.`, `Aprobă ${pend.length} elemente`, () => setItems(pend.map(i => ({ id: i.id, state: 'approved' })))); },
  'ap-apply': () => api('POST', `/projects/${S.cur}/items/apply`).then(() => toast('Se aplică modificările. Primești elementele înapoi când sunt gata.')).catch(e => toast(e.message)),
  'ap-done': () => confirmAct('Finalizezi aprobarea?', 'Poarta se închide și producția trece la etapa următoare.', 'Finalizează', () => api('POST', `/projects/${S.cur}/gate/complete`).then(() => { toast('Aprobare finalizată. Producția continuă.'); location.hash = `#/p/${S.cur}/progress`; })),
  'view': el => { S.viewer = { id: el.dataset.id }; paintViewer(); },
  'view-close': () => { S.viewer = null; paintViewer(); },
  'view-step': el => { const list = (S.review?.items || []).filter(i => i.kind === 'image' || i.kind === 'ref'); const n = list.findIndex(i => i.id === S.viewer.id) + Number(el.dataset.d); if (list[n]) { S.viewer = { id: list[n].id }; paintViewer(); } },
  'tip': el => toast(el.dataset.msg),
  'lan-save': () => api('PUT', '/settings/lan', { enabled: $('#lan-on').checked, code: $('#lan-code').value }).then(() => { toast('Setări de rețea salvate.'); return loadState(); }).then(() => { S.qr = null; render(); }).catch(e => toast(e.message)),
  'lan-qr': () => api('GET', '/lan/qr').then(r => { S.qr = r; render(); }).catch(e => toast(e.message)),
  'lan-logout': () => confirmAct('Deconectezi toate dispozitivele?', 'Telefonul, tableta și celelalte calculatoare vor trebui să reintroducă codul.', 'Deconectează', () => api('POST', '/settings/lan/logout-all').then(() => toast('Toate dispozitivele trebuie să reintroducă codul.')), true),
  'train-start': el => startFromPack(el.dataset.id),
  'train-del': el => confirmAct('Ștergi pachetul de antrenament?', 'Exemplele și tiparele de greșeli ale pachetului nu se mai folosesc.', 'Șterge', () => api('DELETE', '/training/' + el.dataset.id).then(loadTraining), true),
  'save-images': () => api('PUT', '/settings/images', { engine: $('#img-engine').value, fallback: $('#img-fallback').checked }).then(() => { toast('Motorul de imagini a fost salvat.'); return loadState(); }).then(render).catch(e => toast(e.message)),
  'gpt-check': () => api('POST', '/chatgpt/check').then(() => loadState()).then(render).catch(e => toast(e.message)),
  'gpt-text-test': el => { el.disabled = true; el.textContent = 'Verific…'; api('POST', '/chatgpt/text-test').then(r => toast(r.ok ? 'GPT-6-Sol răspunde prin Codex.' : `Răspuns neașteptat: ${r.reply}`)).catch(e => toast(e.message)).finally(() => render()); },
  'gpt-login': () => api('POST', '/chatgpt/login').then(() => toast('S-a deschis autentificarea ChatGPT pe laptop. După ce termini, apasă „Verifică”.')).catch(e => toast(e.message)),
  'gpt-test': el => { el.disabled = true; el.textContent = 'Generez…'; api('POST', '/chatgpt/test').then(r => toast(`ChatGPT a generat imaginea de test (${Math.round(r.bytes / 1024)} KB).`)).catch(e => toast(e.message)).finally(() => render()); },
  'save-canva': () => api('PUT', '/settings/canva', { allowance: Number($('#cv-al').value), resetDay: Number($('#cv-day').value), pauseMin: Number($('#cv-p').value) }).then(() => { toast('Setările Canva au fost salvate.'); return loadState(); }).then(render).catch(e => toast(e.message)),
  'save-budget': () => api('PUT', '/settings/budget', { budget5h: Number($('#budget').value), budget7d: Number($('#budget7')?.value || 0) }).then(r => { toast(`Buget salvat: ${r.budget5h} apeluri pe 5 ore${r.budget7d ? `, ${r.budget7d} pe 7 zile` : ''}.`); return loadState(); }).then(render).catch(e => toast(e.message)),
  'notif': () => Notification.requestPermission().then(() => render()),
  'diag': el => { el.disabled = true; el.textContent = 'Verific…'; api('GET', '/diagnostic').then(d => { S.diag = d.checks; render(); }).catch(e => toast(e.message)); },
  'agent-model': el => api('PUT', `/agents/${el.dataset.id}`, { model: el.value }).then(() => { toast('Model salvat.'); loadExtra('agents'); }).catch(e => toast(e.message)),
  'delete-project': () => { const p = curProject(); if (!p) return; openModal(`<h3>Ștergi definitiv „${esc(p.title || '')}”?</h3>
    <p class="muted small">Se șterg proiectul din baza de date, imaginile de lucru, înregistrările de învățare și consum, livrările locale și copiile lor din folderul secundar, plus urmele din backupurile gestionate de aplicație. Statisticile vechi de învățare fără proveniență pe proiect se resetează pentru toate proiectele. Nu se poate anula.</p>
    <p class="small" style="margin-top:8px">Arhiva originală de import rămâne la tine, deci poți importa proiectul din nou. Dacă ai creat materiale în Canva, acestea rămân în contul Canva; raportul de după ștergere îți arată linkurile pentru eliminare manuală.</p>
    <p class="small" style="margin-top:8px"><a href="/api/projects/${esc(p.id)}/export.zip" download>Exportă o copie înainte de ștergere</a></p>
    <div class="field" style="margin-top:12px"><label class="lbl" for="del-confirm">Scrie <b>ȘTERGE</b> ca să confirmi</label><input class="input" id="del-confirm" autocomplete="off"></div>
    <div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn danger" data-act="do-delete">Șterge definitiv</button></div>`); },
  'do-delete': el => { const pid = S.cur; const c = ($('#del-confirm')?.value || '').trim(); if (!['ȘTERGE', 'STERGE', 'ŞTERGE'].includes(c.toUpperCase())) { toast('Scrie ȘTERGE ca să confirmi.'); return; }
    el.disabled = true; el.textContent = 'Șterg…';
    api('DELETE', `/projects/${pid}`, { confirm: c }).then(async r => { closeModal(); await loadState(); location.hash = '#/projects'; render(); showPurgeReport(r); }).catch(e => { el.disabled = false; el.textContent = 'Șterge definitiv'; toast(e.message, 'error'); }); },
  'book-lang': el => { S.book.lang = el.dataset.l; S.editing = null; render(); },
  'browse-output': el => { S.browseTarget = el.dataset.target || 'out-dir'; browseFolder($('#' + S.browseTarget)?.value || ''); },
  'save-mirror': () => api('PUT', '/settings/output-mirror', { dir: $('#mirror-dir').value.trim() || null }).then(r => { toast(r.dir ? 'Livrările se vor copia și în ' + r.dir : 'Copia a fost oprită.'); return loadState(); }).then(render).catch(e => toast(e.message)),
  'stop-mirror': () => api('PUT', '/settings/output-mirror', { dir: null }).then(() => { toast('Copia a fost oprită.'); return loadState(); }).then(render).catch(e => toast(e.message)),
  'use-gdrive-mirror': () => { $('#mirror-dir').value = S.gdriveLocal.suggested; ACT['save-mirror'](); },
  'fs-go': el => browseFolder(el.dataset.path),
  'fs-pick': el => { closeModal(); const t = S.browseTarget || 'out-dir'; $('#' + t).value = el.dataset.path; ACT[t === 'mirror-dir' ? 'save-mirror' : 'save-output'](); },
  'save-output': () => api('PUT', '/settings/output', { dir: $('#out-dir').value.trim() }).then(r => { toast('Fișierele finale vor ajunge în ' + r.dir); return loadState(); }).then(render).catch(e => toast(e.message)),
  'save-drive-folder': () => api('PUT', '/settings/drive-folder', { folder: $('#drive-folder').value.trim() }).then(r => { toast('Folder Google Drive: ' + r.name); return loadState(); }).then(render).catch(e => toast(e.message)),
  'lesson-scope': el => api('POST', `/lessons/${el.dataset.id}/scope`, { scope: el.dataset.scope, age: el.dataset.age || null }).then(() => { toast('Regula se aplică acum mai larg.'); loadExtra('agents'); }).catch(e => toast(e.message)),
  'calib': el => api('POST', `/calibration/${el.dataset.age}`, { calibrated: el.dataset.on === '1' }).then(() => loadExtra('learning')).catch(e => toast(e.message)),
  'add-rule': el => { const id = el.dataset.id; api('POST', '/lessons', { agent: id, text: $('#rule-' + id).value, age: $('#rule-age-' + id).value || null }).then(() => { toast('Regulă adăugată. Se aplică de acum.'); loadExtra('agents'); }).catch(e => toast(e.message)); },
  'cv-load': async () => { try { const [k, t] = await Promise.all([api('GET', '/canva/brand-kits').catch(e => ({ items: [], err: e.message })), api('GET', '/canva/brand-templates')]); S.canvaBrand = { kits: k.items, templates: t.items }; if (k.err) toast(k.err); if (!t.items.length) toast('Nu am găsit șabloane de brand cu câmpuri de date în contul Canva.'); render(); } catch (e) { toast(e.message, 'error'); } },
  'cv-save': async () => { const p = curProject(); const kit = $('#cv-kit')?.value || null, tpl = $('#cv-tpl')?.value || null; const C = S.canvaBrand || {};
    try { await api('PUT', `/projects/${p.id}/canva-brand`, { brandKitId: kit, brandKitName: (C.kits || []).find(x => x.id === kit)?.name || null, templateId: tpl, templateName: (C.templates || []).find(x => x.id === tpl)?.name || null }); await loadProject(); toast('Alegerea Canva a fost salvată.'); render(); } catch (e) { toast(e.message, 'error'); } },
  'cv-cover': el => canvaStep(el, 'canva-cover', 'Coperta e gata în Canva; PDF-ul e salvat la proiect.'),
  'cv-export': el => canvaStep(el, 'canva-export', 'PDF-ul copertei a fost exportat din nou.', S.art[`canva_${el.dataset.v}`]?.content?.blocked),
  'cv-promo': el => canvaStep(el, 'canva-promo', 'Formatele de promovare sunt gata.'),
  'proposal': el => api('POST', `/proposals/${el.dataset.id}`, { accept: el.dataset.a === '1', scope: el.dataset.scope }).then(() => { toast(el.dataset.a === '1' ? 'Lecția a fost adăugată.' : 'Propunerea a fost respinsă.'); loadExtra('learning'); }).catch(e => toast(e.message, 'error')),
  'golden-run': el => api('POST', '/golden/run', { variant: $('#golden-variant')?.value || null }).then(() => { toast('Setul de aur a pornit. Rezultatele apar aici.'); setTimeout(() => loadExtra('learning'), 1500); }).catch(e => toast(e.message, 'error')),
  'golden-base': el => api('POST', '/golden/baseline', { runId: el.dataset.id }).then(() => { toast('Rularea e acum referința.'); loadExtra('learning'); }).catch(e => toast(e.message, 'error')),
  'bandit-reset': el => confirmAct('Repornești competiția?', 'Variantele retrase concurează din nou cu câștigătoarea.', 'Repornește', () => api('POST', '/bandit/reset', { stage: el.dataset.s }).then(() => loadExtra('learning'))),
  'thr-set': el => api('PUT', '/thresholds', { age: el.dataset.age, stage: 'critic', value: el.dataset.v === '' ? null : Number(el.dataset.v) }).then(() => { toast('Pragul a fost actualizat.'); loadExtra('learning'); }).catch(e => toast(e.message, 'error')),
  'lesson-keep': el => api('POST', `/lessons/${el.dataset.id}/keep`).then(() => { toast('Lecția rămâne activă.'); loadExtra('learning'); }).catch(e => toast(e.message, 'error')),
  'lesson': el => { const go = () => api('POST', `/lessons/${el.dataset.id}`, { status: el.dataset.s }).then(() => loadExtra(location.hash.startsWith('#/learning') ? 'learning' : 'agents')); if (el.dataset.s === 'active') return go().catch(e => toast(e.message, 'error')); confirmAct('Scoți regula?', 'Agenții nu o mai aplică de acum.', 'Scoate regula', go, true); },
  'save-persona': el => api('PUT', `/agents/${el.dataset.id}`, { persona: $('#persona-' + el.dataset.id).value }).then(() => { toast('Instrucțiuni salvate.'); loadExtra('agents'); }).catch(e => toast(e.message)),
  'gdrive-upload': el => { el.disabled = true; el.textContent = 'Se încarcă…'; api('POST', `/projects/${S.cur}/gdrive`).then(r => toast('Încărcat în Google Drive.')).catch(e => toast(e.message)).finally(() => render()); },
  'coverwrap': el => exportCoverWrap(Number(el.dataset.v)),
  'package': () => packageAll(),
  'open-folder': () => api('POST', `/projects/${S.cur}/open-folder`).then(r => toast('Folder: ' + r.path)).catch(e => toast(e.message)),
  'claude-login': () => api('POST', '/claude/login').then(() => toast('S-a deschis fereastra oficială Claude. Autentifică-te, apoi apasă „Verifică”.')).catch(e => toast(e.message)),
  'claude-check': el => { el.disabled = true; el.textContent = 'Verific…'; api('POST', '/claude/check').then(loadState).then(render).catch(e => toast(e.message)); },
  'rm-file': el => { S.wiz.files.splice(Number(el.dataset.i), 1); render(); },
  'pick-type': el => { initWizard(el.dataset.slug); location.hash = '#/new/' + el.dataset.slug; },
  'wiz-next': () => {
    const t = typeBySlug(S.wiz.slug); const errors = {};
    (t.input_schema.fields || []).forEach(f => { const v = S.wiz.values[f.key]; if (f.type === 'languages' && !(v || []).length) errors[f.key] = 'Alege cel puțin o limbă.'; if (!['images', 'languages'].includes(f.type) && f.required && !String(v ?? '').trim()) errors[f.key] = 'Câmp obligatoriu.'; });
    S.wiz.errors = errors; if (!Object.keys(errors).length) { S.wiz.step = 3; S.wiz.preview = null; loadPreview(); window.scrollTo(0, 0); } render();
  },
  'wiz-back': () => { S.wiz.step = 2; S.wiz.preview = null; render(); },
  'reassess': el => api('POST', `/projects/${S.cur}/assessment/${el.dataset.v}/refresh`).then(() => toast('Reevaluarea a pornit; elementul se actualizează când termină.')).catch(e => toast(e.message, 'error')),   // P5-T02
  'safety-review': el => openModal(`<h3>Verificare de siguranță (adult)</h3><p class="muted small">Confirmă că ai verificat elementul și că este potrivit vârstei. Aceasta este o verificare a operatorului, nu un test cu familii.</p><div class="field" style="margin-top:12px"><textarea class="textarea" id="sf-reason" placeholder="Ce ai verificat și de ce este potrivit"></textarea></div><div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn primary" data-act="do-safety-review" data-v="${esc(el.dataset.v)}" data-subject="${esc(el.dataset.subject)}">Confirm</button></div>`),
  'do-safety-review': el => { const reason = $('#sf-reason')?.value || ''; closeModal(); api('POST', `/projects/${S.cur}/safety/review`, { v: Number(el.dataset.v), subject: el.dataset.subject, reason }).then(() => { toast('Verificarea a fost înregistrată.'); return loadProject(); }).then(render).catch(e => toast(e.message, 'error')); },   // P5-T01
  'reconcile-apply': el => { const choices = {}; const d1 = $('#rc-DW01')?.value; if (d1) choices.DW01 = d1; const pages = {}; document.querySelectorAll('[data-rc-page]').forEach(x => { if (x.value) pages[x.dataset.rcPage] = x.value; }); if (Object.keys(pages).length) choices.DW02 = pages;
    if (!Object.keys(choices).length) return toast('Alege cel puțin o schimbare.');
    confirmAct('Aplici alegerile?', 'Se schimbă doar câmpurile alese; decizia ta se înregistrează. Aprobările rămân de făcut.', 'Aplică', () => api('POST', `/projects/${S.cur}/reconcile/apply`, { choices, reportHash: el.dataset.hash }).then(r => { toast(`Aplicat: ${r.applied.length} schimbări.`); return loadProject(); }).then(render).catch(e => toast(e.message, 'error'))); },   // P4-T05
  'intake-infer': () => { const text = $('#intake-text')?.value || ''; S.wiz.intake = { text }; api('POST', '/intake/infer', { typeSlug: S.wiz.slug, text }).then(r => { S.wiz.intake = { text, result: r }; render(); }).catch(e => { S.wiz.intake = { text, error: e.message }; render(); }); },
  'intake-apply': () => { const r = S.wiz.intake?.result; if (!r) return; for (const [k, v] of Object.entries(r.values)) S.wiz.values[k] = Array.isArray(v) ? [...v] : v; S.wiz.intake = { text: S.wiz.intake.text }; toast('Formularul a fost completat; verifică fiecare câmp.'); render(); },
  'intake-cancel': () => { S.wiz.intake = { text: S.wiz.intake?.text || '' }; render(); },
  'start': () => createProject(),
  'run': el => startOrSwitch(el.dataset.pid),
  'pause': el => api('POST', `/projects/${el.dataset.pid}/pause`).then(() => toast('Se pune pe pauză după pasul în curs. Nimic nu se pierde.')).catch(e => toast(e.message)),
  'stop-now': el => openModal(`<h3>Oprești imediat?</h3><p class="muted small">Elementele terminate rămân salvate; pasul aflat chiar acum în lucru se reface când continui. Pentru o pauză fără nicio pierdere, folosește „Pune pe pauză”.</p><div class="foot"><button class="btn ghost" data-act="modal-close">Anulează</button><button class="btn danger" data-act="do-stop-now" data-pid="${esc(el.dataset.pid)}">Oprește imediat</button></div>`),
  'do-stop-now': el => { closeModal(); api('POST', `/projects/${el.dataset.pid}/stop`).catch(e => toast(e.message)); },
  'do-switch': el => { closeModal(); api('POST', `/projects/${el.dataset.pid}/switch`).then(r => toast(r.pausing ? `„${r.pausing}” se pune pe pauză; apoi pornește automat proiectul ales.` : 'Pornește.')).catch(e => toast(e.message)); },
  'import-project': () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.zip'; i.onchange = () => { const f = i.files[0]; if (!f) return; toast('Import în curs…'); fetch('/api/projects/import', { method: 'POST', headers: { 'x-wp': '1' }, body: f }).then(async r => { const j = await r.json().catch(() => ({ message: r.status === 413 ? 'Fișierul e prea mare.' : r.status === 403 ? 'Importul se face doar de pe laptop.' : 'Răspuns neașteptat de la server.' })); if (!r.ok) throw j; toast(`Proiect importat: ${j.title}. Toate aprobările se refac de către tine.`); location.hash = `#/p/${j.id}/progress`; }).catch(e => toast(e.message || 'Importul nu a reușit.', 'error')); }; i.click(); },
  'canva-logout': () => confirmAct('Deconectezi Canva?', 'Imaginile nu se mai pot genera cu Canva până te reconectezi.', 'Deconectează', () => api('POST', '/canva/logout').then(loadState).then(render), true),
  'inspect': el => { const key = el.dataset.key || $('#inspect-key')?.value; if (!key) return; api('GET', `/projects/${S.cur}/inspect/${encodeURIComponent(key)}`).then(r => { S.inspect = r; render(); }).catch(e => { S.inspect = { pid: S.cur, key, error: e.message }; render(); }); },   // P3-T06
  'job-resolve': el => confirmAct(el.dataset.a === 'retry' ? 'Reiei unitatea?' : 'Anulezi unitatea?', el.dataset.a === 'retry' ? 'Furnizorul poate fi întrebat din nou: consumul se poate dubla.' : 'Unitatea rămâne neterminată; o poți reface ulterior.', el.dataset.a === 'retry' ? 'Reia' : 'Anulează', () => api('POST', `/projects/${S.cur}/jobs/${encodeURIComponent(el.dataset.key)}/resolve`, { action: el.dataset.a }).then(() => { toast('Decizie înregistrată.'); return loadProject(); }).then(render).catch(e => toast(e.message, 'error'))),
  'sel': el => { S.sel[S.cur] = el.dataset.key; S.composer = null; render(); $('#reader') && ($('#reader').scrollTop = 0); },
  'cm-scope': el => { S.cmScope = el.dataset.s; render(); },
  'cm-add': el => addComment(el.dataset.key),
  'cm-clear': () => { S.composer = null; render(); },
  'cm-resolve': el => api('PATCH', `/projects/${S.cur}/comments/${el.dataset.id}`, { status: 'resolved' }).catch(e => toast(e.message, 'error')),
  'cm-reopen': el => api('PATCH', `/projects/${S.cur}/comments/${el.dataset.id}`, { status: 'open' }).catch(e => toast(e.message, 'error')),
  'sel-comment': () => { const s = S._selection; if (!s) return; S.composer = s; $('.sel-btn')?.remove(); render(); setTimeout(() => $('#cm-body')?.focus(), 20); },
  'decide': el => decisionModal(el.dataset.d),
  'do-decide': el => doDecide(el.dataset.d),
  'modal-close': () => closeModal(),
  'vol': el => { S.book.v = Number(el.dataset.v); S.book.picked = true; S.editing = null; render(); },
  /* P6-T04: explicit approval of the legacy KDP presentation (never changes the 12 canonical pages) */
  'pp-approve': el => { const b = el.dataset.book, ink = $('#pp-ink-' + b)?.value, paper = $('#pp-paper-' + b)?.value || 'white'; confirmAct('Aprobi prezentarea legacy KDP?', 'Cele 12 pagini canonice rămân aceleași; doar prezentarea de publicare (Poveste 28 / Colorat 26, copertă separată) se aprobă pentru această carte.', 'Aprob', async () => { await api('POST', `/projects/${S.cur}/print-profile`, { profile: 'kdp', book: b, ink, paper }); await loadProject(S.cur); render(); }); },
  'pp-revoke': el => api('POST', `/projects/${S.cur}/print-profile`, { profile: 'kdp', book: el.dataset.book, approve: false, note: 'retras din Livrare' }).then(() => loadProject(S.cur)).then(render).catch(e => toast(e.message, 'error')),
  /* P6-T02: page workbench */
  'wb-page': el => { location.hash = `#/p/${S.cur}/book/${S.wb.v + 1}/${el.dataset.p}`; },
  'wb-close': () => { S.wb = null; location.hash = `#/p/${S.cur}/book`; },
  'wb-cancel': () => { if (S.wb) { S.wb.impact = null; S.wb.payload = null; render(); toast('Nicio modificare: impactul a fost doar previzualizat.'); } },
  'wb-preview': async () => {
    const w = S.wb; if (!w?.cmd) return; const val = id => $(id)?.value;
    const payload = w.cmd === 'exact' ? { language: val('#wb-lang') || 'first', from: val('#wb-from') || '', to: val('#wb-to') || '' } : ['style', 'semantic'].includes(w.cmd) ? { language: val('#wb-lang') || 'first', note: val('#wb-note') || '' } : ['color', 'line'].includes(w.cmd) ? { note: val('#wb-note') || '' } : { family: val('#wb-family'), zone: val('#wb-zone'), motif: !!$('#wb-motif')?.checked };
    try { w.impact = await api('POST', `/projects/${S.cur}/workbench/${w.v + 1}/${w.p}/preview`, { command: w.cmd, payload }); w.payload = payload; render(); setTimeout(() => $('#wb-impact')?.focus?.(), 20); } catch (e) { toast(e.message, 'error'); }
  },
  'wb-commit': async () => {
    const w = S.wb; if (!w?.impact) return;
    try { const r = await api('POST', `/projects/${S.cur}/workbench/${w.v + 1}/${w.p}/commit`, { command: w.cmd, payload: w.payload, previewHash: w.impact.previewHash }); w.impact = null; w.cmd = null; toast(r.started ? 'Modificarea țintită a pornit; pagina revine la revizie când e gata.' : r.verify?.ok ? 'Aplicat; nimic altceva nu s-a schimbat.' : 'Aplicat, dar s-au schimbat și alte unități: ' + (r.verify?.unrequested || []).join(', '), r.verify && !r.verify.ok ? 'error' : undefined); await loadProject(S.cur); await loadWorkbench(); }
    catch (e) { if (e.code === 'stale_preview') { w.impact = null; render(); } toast(e.message, 'error'); }
  },
  'wb-restore': el => confirmAct('Restaurezi versiunea ' + el.dataset.version + '?', 'Se creează o versiune nouă cu conținutul ei; trecutul nu se rescrie, iar dependenții se revalidează.', 'Restaurează', async () => { const r = await api('POST', `/projects/${S.cur}/artifacts/${el.dataset.key}/restore`, { version: Number(el.dataset.version) }); toast(`Restaurat ca v${r.version}` + ((r.rebound || []).some(x => x.status === 'stale') ? '; dependenții cu altă scenă rămân depășiți.' : '.')); await loadProject(S.cur); await loadWorkbench(); }),
  'mode': el => { S.book.mode = el.dataset.m; render(); },
  'edit-text': el => { S.editing = { v: Number(el.dataset.v), p: Number(el.dataset.p) }; render(); setTimeout(() => $('#edit-text')?.focus(), 20); },
  'cancel-edit': () => { S.editing = null; document.activeElement?.blur(); render(); },
  'save-text': el => saveText(Number(el.dataset.v), Number(el.dataset.p)),
  'regen': el => regenModal(el.dataset.key),
  'do-regen': el => { const p = curProject(); const note = ($('#rg-note')?.value || '').trim(); closeModal(); startRedo(p, [el.dataset.key], note, 'Redesenare pagină'); location.hash = `#/p/${p.id}/progress`; },
  'fill-missing': el => {
    const p = curProject(); const v = Number(el.dataset.v); const P = S.bp.structure.pages;
    const keys = []; for (let i = 0; i <= P; i++) { const c = S.art[`ill_${v}_${i}`]?.content; if (!(c?.color && c?.lineart)) keys.push(`ill_${v}_${i}`); }
    if (keys.length) { startRedo(p, keys, '', `Desenare volumul ${v + 1}`); location.hash = `#/p/${p.id}/progress`; }
  },
  'copy': el => {
    if (el.dataset.key) return copyText(S.art[el.dataset.key]?.content?.prompt || '');
    const node = S.sel[S.cur]; const list = S.art[node]?.content?.prompts || [];
    copyText(list[Number(el.dataset.textIdx)]?.prompt || '');
  },
  'export': el => exportBook(Number(el.dataset.v), el.dataset.b, { lang: el.dataset.l }),
  'deliver': el => serverDeliver(Number(el.dataset.v)),
  'gdrive-vol': el => { el.disabled = true; api('POST', `/projects/${S.cur}/gdrive?volume=${el.dataset.v}`).then(() => toast('Volumul a fost urcat în Google Drive.')).catch(e => toast(e.message)).finally(() => render()); },
  'archive': () => confirmAct('Arhivezi proiectul?', 'Nu mai apare în lucru; îl poți readuce oricând din Proiecte.', 'Arhivează', () => api('POST', `/projects/${S.cur}/archive`, { archived: true })),
  'unarchive': () => api('POST', `/projects/${S.cur}/archive`, { archived: false }).catch(e => toast(e.message, 'error')),
  'studio-validate': () => { let o; try { o = JSON.parse($('#studio-json').value); S.studio.errors = validateBlueprint(o); } catch (e) { S.studio.errors = ['JSON invalid: ' + e.message]; } S.studio.text = $('#studio-json').value; render(); },
  'studio-save': () => studioSave(false),
  'studio-dup': () => studioSave(true)
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && ACT[el.dataset.act] && !el.disabled) { e.preventDefault(); ACT[el.dataset.act](el, e); return; }
  if (e.target.id === 'modal') closeModal();
});
/* audit WCAG 2.1.1: elements that act like buttons but are not <button> (timeline, thumbnails) answer to Enter and Space */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest?.('[data-act][role="button"]'); if (!el || el.matches('button,a,input,select,textarea')) return;
  if (ACT[el.dataset.act]) { e.preventDefault(); ACT[el.dataset.act](el, e); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.trainImport !== undefined && el.files?.[0]) { const f = el.files[0]; el.value = ''; toast('Import în curs…'); fetch('/api/training/import', { method: 'POST', headers: { 'x-wp': '1' }, body: f }).then(async r => { const j = await r.json().catch(() => ({ message: r.status === 413 ? 'Fișierul e prea mare.' : r.status === 403 ? 'Importul se face doar de pe laptop.' : 'Răspuns neașteptat de la server.' })); if (!r.ok) throw j; toast(`Pachet importat: ${j.name}`); loadTraining(); }).catch(e => toast(e.message || 'Importul nu a reușit.', 'error')); return; }
  if (el.dataset.textfile) { const k = el.dataset.textfile, file = el.files[0]; if (file) file.text().then(t => { S.wiz.values[k] = t; el.value = ''; el.blur(); render(); toast('Povestea a fost încărcată.'); }); return; }
  if (el.dataset.optEngine) { S.wiz.options.image_engine = el.dataset.optEngine; return; }
  if (el.dataset.langs) { const k = el.dataset.langs; S.wiz.values[k] = $$(`input[data-langs="${k}"]:checked`).map(x => x.value); el.blur(); render(); return; }
  if (el.dataset.files) {
    const max = Number(el.dataset.max) || 6; const list = [...el.files].filter(f => /^image\/(png|jpeg|webp)$/.test(f.type));
    const big = list.filter(f => f.size > 12 * 1024 * 1024); if (big.length) toast('Imaginile peste 12 MB au fost ignorate.');
    Promise.all(list.filter(f => f.size <= 12 * 1024 * 1024).map(f => new Promise(res => { const rd = new FileReader(); rd.onload = () => res({ name: f.name, mime: f.type, url: rd.result }); rd.readAsDataURL(f); })))
      .then(arr => { S.wiz.files = [...(S.wiz.files || []), ...arr].slice(0, max); el.value = ''; el.blur(); render(); });
    return;
  }
  if (el.dataset.field) { S.wiz.values[el.dataset.field] = el.value; if (S.wiz.errors[el.dataset.field]) { delete S.wiz.errors[el.dataset.field]; } }
  if (el.dataset.opt) { S.wiz.options[el.dataset.opt] = el.checked; el.blur(); render(); }
  if (el.dataset.actChange === 'wb-cmd' && S.wb) { S.wb.cmd = el.value || null; S.wb.impact = null; el.blur(); render(); return; }
  if (el.dataset.actChange === 'ver') { S.viewVersion[S.cur + '/' + el.dataset.key] = el.value; el.blur(); render(); }
  if (el.dataset.actChange === 'tree-sel') { S.sel[S.cur] = el.value; S.composer = null; el.blur(); render(); return; }
  if (el.dataset.actChange === 'agent-model') { ACT['agent-model'](el); el.blur(); return; }
  if (el.dataset.actChange === 'lset') { api('PUT', '/learning/settings', { [el.dataset.k]: el.checked }).then(() => { toast('Setare salvată.'); loadExtra('learning'); }).catch(err => toast(err.message, 'error')); el.blur(); return; }
  if (el.dataset.actChange === 'preset') { S.preset = el.value; el.blur(); render(); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.field) S.wiz.values[el.dataset.field] = el.value;
  if (el.dataset.bind === 'q') { S.q = el.value; clearTimeout(S._qt); S._qt = setTimeout(() => { const pos = el.selectionStart; doRender(); const n = $('[data-bind="q"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 200); }
});
/* select text in the reader to comment on a fragment */
function showSelBtn() {
  {
    const reader = $('#reader'); $('.sel-btn')?.remove(); S._selection = null;
    if (!reader) return;
    const sel = window.getSelection(); const text = sel && sel.toString().trim();
    if (!text || text.length < 3 || !reader.contains(sel.anchorNode)) return;
    const r = sel.getRangeAt(0).getBoundingClientRect(); const rr = reader.getBoundingClientRect();
    S._selection = { key: S.sel[S.cur], quote: text.slice(0, 400) };
    const b = document.createElement('button'); b.className = 'btn sm primary sel-btn'; b.dataset.act = 'sel-comment'; b.textContent = 'Comentează';
    b.style.left = (r.left - rr.left + r.width / 2) + 'px'; b.style.top = (r.top - rr.top + reader.scrollTop) + 'px';
    reader.appendChild(b);
  }
}
function showPurgeReport(r) {
  const removed = (r.removed || []).map(x => `<li>${esc(x)}</li>`).join('');
  const outside = (r.outside || []).map(o => `<li><b>${esc(o.where)}</b>: ${esc(o.note)}${(o.links || []).length ? `<ul>${o.links.map(link => `<li><a href="${extUrl(link)}" target="_blank" rel="noopener noreferrer">${esc(link)}</a></li>`).join('')}</ul>` : ''}</li>`).join('');
  openModal(`<h3>Raport de ștergere: ${esc(r.title || 'proiect')}</h3><p class="small">${r.errors?.length ? 'Ștergerea are pași neterminați. Verifică erorile de mai jos.' : 'Curățarea gestionată de aplicație s-a încheiat.'}</p>
    ${removed ? `<h4 style="margin-top:12px">Șterse</h4><ul class="small">${removed}</ul>` : ''}
    ${r.errors?.length ? `<div class="notice err small" style="margin-top:10px"><b>Pași neterminați</b><ul>${r.errors.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    ${outside ? `<h4 style="margin-top:12px">În conturi externe</h4><ul class="small">${outside}</ul>` : ''}
    <div class="foot"><button class="btn primary" data-act="modal-close">Închide</button></div>`);
}
document.addEventListener('mouseup', e => { if (e.target.closest && e.target.closest('.sel-btn')) return; setTimeout(showSelBtn, 10); });
if (matchMedia('(pointer:coarse)').matches) document.addEventListener('selectionchange', () => { clearTimeout(S._selT); S._selT = setTimeout(showSelBtn, 450); });
/* v19: one Canva step for one approved volume (autofill, export, resize); a blocked export shows the open comments */
async function canvaStep(el, route, ok, force) {
  const p = curProject(); const v = Number(el.dataset.v); S.cvBusy = v; render();
  try { const r = await api('POST', `/projects/${p.id}/${route}?volume=${v}${force ? '&force=1' : ''}`); await loadProject(); toast(r?.blocked ? 'Există comentarii nerezolvate în Canva; rezolvă-le sau exportă oricum.' : ok); }
  catch (e) { toast(e.message, 'error'); } finally { S.cvBusy = null; render(); }
}
