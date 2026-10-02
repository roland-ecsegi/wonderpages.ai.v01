# PageLayoutPlan — machetă măsurată (P6-T01)

**Scop:** fiecare pagină interioară are o machetă legată de scopul narativ, măsurată cu metrica reală a fontului cărții,
aceeași în planificatorul de pe server, în previzualizare și în exportul PDF.

## Componente

| Componentă | Rol |
|---|---|
| `server/domain/font-metrics.js` | citește TTF-ul Andika (head/hhea/hmtx/cmap 4/12) și produce `public/fonts/andika-metrics.json` cu sha256-ul fontului |
| `scripts/enterprise/font-metrics.mjs` | regenerează metricile după o actualizare a fontului |
| `public/app/layout-measure.js` | **un singur cod de măsurare** (`WPLayout`): rânduri, înălțime, depășire, glife lipsă, încadrare, hash determinist; rulat de browser (previzualizare + export) și de server prin `node:vm` |
| `server/domain/layout.js` | planificatorul: familie, zonă, font, încadrare, constatări, `measurementHash` |
| `GET /api/projects/:pid/layout[?preset=]` | planurile tuturor volumelor cu text |
| `GET /api/projects/:pid/layout/:v[?preset=]` | planul unui volum (dimensiunile imaginilor citite din fișiere) |
| `POST /api/projects/:pid/layout/:v/revision` | revizie de machetă fixată numai pe hash-ul curent (`stale_layout`), refuzată când există blocaje; înregistrare de decizie `layout_revision` |

## Reguli

- **Familie din scop narativ:** machetă existentă validă → păstrată; fără text → `panorama`; întoarcere `reveal` → `surprise`;
  dialog → `dialogue`; plan apropiat → `intimate`; plan larg → `panorama`; acțiuni → `action`. Fiecare pagină are `reason`.
- **Font:** niciodată sub `age_profiles[vârstă].font_pt`. O cerere mai mică (`layout.font_pt`) este refuzată (`FONT_BELOW_PROFILE`); una mai mare este permisă.
- **Depășire:** textul nu se micșorează și nu se taie. Dacă nu încape, se încearcă, în ordine, panorama în aceeași zonă,
  zona opusă, apoi lateral; schimbarea are dovada exactă (`LAYOUT_ADJUSTED`, `adjusted.evidence`). Dacă nimic nu încape:
  `TEXT_OVERFLOW` (blocant) cu depășirea în puncte.
- **Fiecare limbă în spațiul ei:** sursa (`final_v`/`script_v`), ediția nativă (`tr_v`) sau `text_ro` (DW) sunt măsurate separat; macheta aleasă trebuie să încapă pentru toate.
- **Glife:** caracterele absente din Andika → `GLYPH_MISSING` (blocant, cu cod U+). Textul este normalizat NFC (diacritice compuse = descompuse).
- **Font lipsă / schimbat:** `FONT_MISSING`, `FONT_METRICS_MISSING`, `FONT_METRICS_STALE` (blocante): nu se măsoară cu alt font.
- **Încadrare:** cover-fit cu fereastra mutată astfel încât regiunile protejate (`ill.regions`, `ill.qa.regions`, `page.layout.protect`,
  coordonate normalizate) să rămână în zona sigură; imposibil → `CROP_CUTS_INVARIANT` (blocant). Blocul de text nu are voie să
  acopere o regiune protejată (`TEXT_COVERS_INVARIANT`). Aceeași fereastră ajunge în previzualizare (`object-position`) și export (`drawImage` cu sursă).
- **Repetiție:** trei pagini consecutive cu aceeași familie+zonă → `LAYOUT_REPEAT` (de verificat), cu excepția refrenului vizual declarat (`layout.motif` sau `motifs`).
- **Pagină fără text:** validă, fără bloc; nu se generează text.

## Previzualizare = export

- Previzualizarea afișează rândurile planului (`white-space: nowrap`, `<br>`), nu rândurile calculate de CSS.
- Exportul cere planul pentru preset-ul ales, re-măsoară fiecare bloc cu `WPLayout` în browser și se oprește dacă rândurile diferă
  sau dacă hash-ul metricilor diferă; trimite `layout=<measurementHash>` la `/exports`, iar serverul refuză (`stale_layout`) un hash
  care nu mai este cel curent; exportul final cu blocaje de machetă este refuzat (`layout_blocked`). Chitanța finală păstrează `layout.measurementHash`.
- Kerning-ul este ignorat intenționat: suma avansurilor este o limită superioară a lățimii randate.

## Geometrie

Identică cu `public/app/pdf.js`: pagina = trim + 2·bleed (KDP: dimensiunile `printDimensions`), zona sigură = bleed + 0,375 in;
lățimea blocului = lățimea vie × factorul familiei (laterale 0,48); padding 0,55·font; rând 1,38·font; banda sus/jos ≤ 42% din înălțimea vie.

## Gate

Elementele `layout` ale porții poartă planul paginii (`plan`) și problemele blocante (`issues`); un element blocat nu poate fi aprobat.

## Dinosaur World

V1: cele 12 machete existente se păstrează (EN și RO încap la 26 pt în digital, tipar și KDP); sursa nu se modifică.
