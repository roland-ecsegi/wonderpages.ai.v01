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
