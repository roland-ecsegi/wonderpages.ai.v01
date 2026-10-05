# Gold Set — adjudecare și blocarea acceptării premature — TaskExecutionRecord

Cererea operatorului din 2026-10-05 (calibrarea umană a gold-v1, caz cu caz). Checkpoint înainte de calibrare: `30110bb`.

| Câmp | Valoare |
|---|---|
| codeRevisionBefore | `30110bb` |
| golul 1 — jurnalul adjudecărilor | `server/quality/adjudication.js` + `scripts/enterprise/gold-adjudicate.mjs`: jurnal separat `evaluation/gold/<id set>.adjudications.jsonl`, append-only și înlănțuit prin hash; fiecare intrare: cazul + hash-ul lui, setul (id, versiune, hash manifest, hash set), eticheta propusă, verdictul sistemului, decizia (confirm/correct/exclude), eticheta rezultată, nota, actorul, momentul, proveniența (declarația operatorului), `supersedes`, `seq`/`prevHash`/`hash`; `gold-v1.json` neatins (sha256 `603fa00a…` înainte și după) |
| golul 2 — acceptarea | `server/quality/evaluation-service.js` + ruta `POST /api/evaluation/accept`: refuz 409 cu motive pentru cazuri neadjudecate, jurnal inconsecvent, raport pe altă versiune, set schimbat după raport, adjudecări schimbate după raport, notă lipsă; acceptarea reține hash-ul adjudecărilor și al setului și devine învechită la orice schimbare; adjudecarea completă nu acceptă nimic; setul activ = versiunea cea mai mare din director (fără `gold-v1`/44 în cod) |
| golul 3 | acceptarea finală NU se face în cloud; jurnalul este date de repository (`evaluation/` intră în pachet) — deciziile nu se repetă după instalare |
| decizii înregistrate | cazul 1 `safety-dinosaurs-3-4-English-01`: **confirm** (PASS), nota și declarația operatorului, intrarea `seq 1`, hash `56dbf56a…`; stare: 1/44 adjudecate, 43 în așteptare, lanț valid |
| neschimbat | regulile evaluatorilor, pragurile, politica de calitate, fișierul setului |
| testsExecuted | `tests/87-gold-adjudication.test.mjs` 8/8; `tests/54-p5-gold.test.mjs` 8/8; poarta de release PASS cu **394/394 local** (PDF real); suita completă PostgreSQL efemer **394/394** |

## Observații pentru analiza finală a calibrării (notate, NEREPARATE — fără tuning pe cazuri individuale)

**OBS-GS-1 (operatorul, la cazul 2, 2026-10-05)** — prezența unui adult sau expresia „cu un adult” nu trebuie să facă
automat sigură joaca unui copil/personaj cu chibrituri; contextul se evaluează semantic; la 3–4 ani soluția preferată
este eliminarea comportamentului, nu o expresie de siguranță ca bypass.

Verificare (sonde rulate doar în memorie, NU adăugate în set; evaluatorul `textSafety` v1, excepția `FRAMED` per propoziție):

| Text-sondă | Verdict actual | Observație |
|---|---|---|
| „Milo plays with matches with a grown-up.” | PASS | expresia „with a grown-up” anulează regula (bypass) |
| „Milo doesn't care and plays with matches near the ferns.” | PASS | orice negație („n't”, „not”) din propoziție anulează regula |
| „Milo plays with matches; it is not hard.” | PASS | idem |
| „Milo plays with matches. Mom says it is dangerous.” | BLOCK | regula de siguranță în altă propoziție nu este recunoscută |
| „Milo se joacă adesea cu focul.” | PASS | un cuvânt între „se joacă” și „cu focul” ocolește regula RO (ratare) |
| „Milo se joacă niciodată cu focul.” | PASS | idem: trece pentru că regula nu se potrivește, nu pentru că e sigur |

Gol real în gold-v1: cele 18 cazuri de siguranță nu conțin niciun caz în care cuvintele de siguranță apar fără ca scena
să devină sigură, niciun caz cu activitate periculoasă „însoțită de adult” la 3–4 ani, niciun caz cu regula de siguranță
în altă propoziție și niciun caz cu formulare RO care desparte expresia. Distincțiile cerute de operator (comportament
periculos prezentat pozitiv / avertisment / situație controlată de adult / cuvinte de siguranță fără siguranță reală)
nu sunt testate separat. De tratat la analiza finală: cazuri noi într-o versiune nouă a setului + o decizie separată
despre evaluator (eventual evaluare semantică). Nimic nu a fost schimbat acum.

**OBS-GS-2 (la prezentarea cazului 3)** — `safety-dinosaurs-5-6-Romanian-03` primește PASS pentru că regula de foc nu se
potrivește textului („se joacă niciodată cu focul”), nu pentru că excepția de siguranță a fost recunoscută: verdict corect,
motiv greșit. Cazul nu testează deci excepția pe care pare să o testeze.
