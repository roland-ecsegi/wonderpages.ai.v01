# Contracte de poveste, vârstă și localizare (P4-T04)

Implementare: `server/domain/story-contracts.js`; note structurate pentru critic în `lintScript` (`server/engine.js`); elementul `story` la porțile `review_1` și `review_2` (`kids-sc` **v18**); `GET /api/projects/:pid/story/:v`; randarea `storyHTML` (ui.js).

Toate verificările sunt deterministe și **citabile** (pagină, citat, regulă). Ele sunt intrări de QA pentru critic și pentru tine, nu un verdict literar.

## Lanțul cauzal (AC: manuscrisul dovedește scop → alegere → consecință)

- v18: scenariul declară `story_bible.causality` = `{goal, choice, consequence}` fiecare cu `page` și un **citat exact** din textul paginii.
- Verificări: pagina există (altfel blochează), citatul se găsește pe pagină (`CAUSALITY_QUOTE`), ordinea scop ≤ alegere < consecință (`CAUSALITY_ORDER`, blochează când este declarată), alegerea aparține protagonistului (`CHOICE_NOT_PROTAGONIST`).
- Fără declarație (proiecte vechi, DW): dovezile sunt **deduse** secvențial (scop devreme → alegere a protagonistului după el → consecință după alegere) și marcate „dedus; verifică”. Dacă nicio pagină nu arată o legătură → `CAUSALITY_UNPROVEN` (blochează aprobarea volumului).

## Vârstă (bugete orientative, fără plafon rigid)

Metrici reale: cuvinte, propoziții, lungimea medie a propoziției, cuvinte lungi, dialog. Pragurile medii orientative (3-4: ~10, 5-6: ~14, 7-8: ~20 de cuvinte pe propoziție) semnalează complexitatea nepotrivită (`AGE_COMPLEXITY` peste +25 %, `AGE_VOCABULARY`). Bugetul de cuvinte al volumului este **ghid** (`BUDGET_GUIDANCE`, minor): macheta reală decide (P6) și nimic nu se taie automat. Paginile fără text intenționate (`page_type: "wordless"`) sunt permise.

## Voce, știință, lume (T18)

- `VOICE_SWITCH` (naratorul trece la persoana I; replicile din ghilimele nu contează), `TENSE_SWITCH` (EN).
- `SCIENCE_CLAIM`: erori factuale frecvente în cărțile pentru copii (pterozaurii nu sunt dinozauri; oameni și dinozauri împreună — permis doar într-o lume fantastică declarată; liliecii nu sunt orbi; curcubeu noaptea; Soarele în jurul Pământului; Luna fără lumină proprie), cu corectura.
- `T18_WORLD`: efect prezentat ca magie într-o lume fără magie (politica lumii vine din canonul colecției, nu dintr-o regulă globală).

## Ediția nativă (aliniată pe pagini) și tăieri

- `TR_MISALIGNED` / `TR_EMPTY` (blochează): același număr de pagini, fiecare pagină cu text (o pagină fără text a sursei rămâne fără text).
- `TR_NAME` (numele nu se traduc), `TR_CALQUE` (calcuri din engleză în română: „face sens” → „are sens”, „în ordine să” → „ca să”, „au avut un timp bun” → „s-au distrat”, …), `TR_UNTRANSLATED` (cuvinte funcționale englezești rămase).
- `TEXT_CUT`: o pagină care pierde peste jumătate din cuvinte între scenariu → final sau final → ediția nativă fără `cut_note` explicit. Promptul de adaptare cere ca orice omisiune să fie notată.

## Dinosaur World V1 (doar citire)

EN 335 / RO 344 cuvinte (identic cu raportul editorial v04), ediția RO aliniată pe cele 12 pagini, 0 blocaje; lanțul cauzal dedus (DW nu îl declară). Premisele nu se modifică aici: doar printr-o propunere de canon (P4-T05).
