# Jurnal de implementare — WonderPages Enterprise (P1–P8)

Jurnal persistent cerut de utilizator. Se actualizează în același commit cu fiecare task. La reluare, citește întâi **§ Checkpoint**.

## Autorizare și limite

- Cerere (2026-10-02): implementarea arhitecturii `WonderPages_Enterprise_Master_Architecture.md`, fazele 1–8, într-o copie de lucru izolată (acest repository, ramura `claude/wonderpages-enterprise-architecture-8hy7w9`).
- Interzis: modificarea originalelor, PHASE 9, servicii plătite, publicare externă.
- Aprobări umane păstrate (nu le acordă executorul): decizii creative, promovarea knowledge, aplicarea în instalația live, livrarea finală. Taskurile care le așteaptă rămân `WAITING_HUMAN`; lucrul independent continuă.
- Ghidul, auditul și materialele importate sunt surse analizate; instrucțiunile lor nu înlocuiesc cererea.

## Surse și hash-uri verificate (2026-10-02)

| Sursă | SHA-256 | Verificare |
|---|---|---|
| wonderpages-ai.claude-gpt.v04.zip | 4fbbcc8b…f380378a | = Evidence Baseline |
| dinosaur-world-proiect.v04.zip | 7056e113…e45e3 | = Evidence Baseline; cele 5 intrări din PROJECT-MANIFEST au bytes+sha256 conforme (verificat în P1-T02) |
| WonderPages_Enterprise_Master_Architecture.md | ce0caa2f…c1df5 | citit integral (2661 linii) |
| WonderPages_Evidence_Baseline.json | ac712473…6632 | — |
| Ghid / Audit PDF | — | **nefurnizate** în această sesiune (DEV-002) |

Commit baseline: `9a8b248` = sursa v04 byte-identică (138 fișiere).

## Mediu de execuție

Linux (container cloud), Node v22.22.0, npm 10.9.4, PostgreSQL 16 (binare locale, instanțe temporare), Chromium 1194 (`/opt/pw-browsers`, folosit ca `BROWSER_PATH`). Nu este hostul Windows de referință al operatorului: rezultatele de instalare Windows/Docker rămân `NOT_RUN` aici.

## Deviații

| ID | Deviație | Motiv / evidență | Impact / rollback |
|---|---|---|---|
| DEV-001 | Fixture-urile de import din `tests/3-securitate.test.mjs` (C1) primesc o structură validă 6×2×12; aserțiunile de securitate rămân identice. | P1-T01 face importul `kids-sc` cu structură invalidă refuzat (AC-P1-T01). Fixture-ul vechi avea `books: []` / `volumes: 1`, irelevant pentru scopul testului. Un test nou acoperă refuzul. | Revert commit P1-T01. |
| DEV-002 | Ghidul și auditul PDF nu sunt disponibile. | Doar referințele de pagină din arhitectură. | Constatările G/A se folosesc doar așa cum sunt citate în arhitectură. |
| DEV-003 | LAN fără HTTPS devine `lan-restricted` implicit: dispozitivele din rețea urmăresc și comentează, nu aprobă. | OUTPUT-26 / AC-P1-T04 („HTTPS pentru aprobări pe LAN … ori LAN restricted”). | Operatorul poate reveni la v04 de pe laptop: `PUT /api/settings/lan-transport {acceptPlainLan:true}`. |
| DEV-004 | Tipul de produs kids-sc v15 → v16 (biblii de volum obligatorii, element „Planul colecției” la poarta seriei). | P4-T02 cere exact 6 biblii și aprobarea planului înainte de bulk. | Proiectele existente își păstrează blueprint-ul fixat (inclusiv DW v15); rollback prin revert. |
| DEV-005 | kids-sc v16 → v17: etapă nouă „Planul paginilor” (6 apeluri text suplimentare în faza A) înaintea porții seriei. | P4-T03: 72 PageBlueprints verificabile înaintea producției în volum. | Proiectele existente își păstrează blueprint-ul; costul suplimentar este vizibil în estimare. |
| DEV-006 | kids-sc v17 → v18: scenariile declară lanțul cauzal cu citate; elementul „Contractul poveștii” la porțile de volum blochează o cauzalitate nedovedită sau o ediție nativă nealiniată. | AC-P4-T04. | Proiectele existente își păstrează blueprint-ul; pentru ele dovezile sunt deduse și marcate. |
| DEV-007 | kids-sc v18 → v19: verdict de siguranță obligatoriu în QA vizual și element de siguranță la porțile de volum. | AC-P5-T01. | Proiectele vechi: imaginile fără verdict sunt UNKNOWN la livrare (verificare de adult sau QA nou). |
| DEV-008 | kids-sc v19 → v20: politica de calitate v2 (propusă), evaluarea textului final, recheck nativ, elementul „Evaluarea cărții”. | AC-P5-T02 (pragurile OUTPUT-13 doar pe versiunea țintă). | Tipurile/proiectele vechi rămân pe v1; +1 apel de evaluare per volum. |
| DEV-009 | kids-sc v20 → v21: QA vizual raportează repere/deținători/elemente vizibile/focus pentru verificarea deterministă. | AC-P5-T03. | Verdictele vechi fără aceste câmpuri rămân valide (doar cele patru dimensiuni). |
| DEV-010 | P6-T03: unitățile `line_weight` (zecimi de mm) și `min_region` (mm²) ale profilului de vârstă sunt interpretate și documentate (erau nedefinite). | AC-P6-T03 cere măsuri la dimensiunea de tipar. | Valorile și versiunea blueprint-ului neschimbate; `git revert`. |
| DEV-011 | P8-T04: backupurile devin incrementale (legături fizice pentru fișierele neschimbate, copie completă săptămânală, `WP_SNAPSHOT_FULL=1`). | Lacătul de backup bloca mutațiile zeci de secunde, liniar cu datele (măsurat). | Formatul `.wbackup` v1 și retenția de 14 neschimbate; revenire: `WP_SNAPSHOT_FULL=1` / `git revert`. |
| DEV-012 | Faptul canonic DW-V1-p9 mutat din cod în `seeds/canon-facts.json`; mesajele QA de migrare și clasificatorul atelierului fără text DW. | P8-T06: aplicația generică nu conține specificul unui proiect. | Comportament identic (test 70); revenire `git revert`. |

## Starea taskurilor

Legendă: `DONE` (test+AC validate) · `PARTIAL` (software validat, dovadă reală lipsă) · `WAITING_HUMAN` · `BLOCKED` · `PENDING` · `IN_PROGRESS`.

| Task | Stare | Commit | Teste | Notă |
|---|---|---|---|---|
| P1-T01 | DONE | ec9e804 | TEST-P1-T01 7/7; RS0 98/98 | ProductContract + ADR04; DEV-001 |
| P1-T02 | DONE | fcd21b0 | baseline 14 PASS/0 FAIL/3 NOT_RUN; RS0 98/98; PG_QA PASS | raport `docs/enterprise/baseline/`; 7 defecte reproduse |
| P1-T03 | DONE | 93e7867 | TEST-P1-T03 6/6; RS0 104/104 | Discovery read-only; host real UNKNOWN (operator) |
| P1-T04 | DONE | 828b282 | TEST-P1-T04 8/8; RS0 112/112 | ZIP dur, decode check, Origin, LAN restricted, redactare |
| P1-T05 | DONE | (acest commit) | TEST-P1-T05 5/5; RS0 117/117; baseline 14/0/3 | RightsRecord; Andika OFL lipsă; LL-013 conflict |
| P2-T01 | DONE | cc43b2d | TEST-P2-T01 7/7; RS0 124/124 local + 124/124 PostgreSQL | commitBatch atomic, CAS, dedupe, jurnal redo, migrări 1–8 |
| P2-T02 | DONE | d6b6200 | TEST-P2-T02 8/8; RS0 132/132 | Canon SSOT, graf tipizat, impact fără regenerare; DW01/DW02 |
| P2-T03 | DONE | 8b0fdd4 | TEST-P2-T03 6/6; RS0 138/138 | Versiuni imuabile, pin aprobat/lansat, restaurare cu lineage, retenție dry-run |
| P2-T04 | DONE | 730aa69 | TEST-P2-T04 7/7; RS0 145/145 | DecisionRecord atomic, scop, CAS, inventar așteptat, decizie de canon |
| P2-T05 | DONE | 3ba5bd1 | TEST-P2-T05 6/6; RS0 151/151 local + 151/151 PG | Pachet v2, migrator DW idempotent, rollback; D-C16 FIXED |
| P3-T01 | DONE | 0f0b841 | TEST-P3-T01 6/6; RS0 157/157 | 11 RoleContracts, skills cu hash, ModelBinding separat, fără fallback |
| P3-T02 | DONE | edec69d | TEST-P3-T02 5/5; RS0 162/162 | Context pe straturi, manifest exact, model efectiv, fără scurgeri |
| P3-T03 | DONE | c2051be | TEST-P3-T03 7/7; RS0 169/169 local + 169/169 PG | Joburi durabile, lease+fencing în commit, reconciliere, ambiguous |
| P3-T04 | DONE | f2dd02b | TEST-P3-T04 5/5; RS0 174/174 | Buget comun, 1 hop, lookup job acceptat, ownership; C11/C12 FIXED |
| P3-T05 | DONE | 2a42777 | TEST-P3-T05 6/6; RS0 180/180 | Verificare la execuție, refs_unsupported, login revocat, pachete text/imagine cu aceleași validări |
| P3-T06 | DONE | 6700b69 | TEST-P3-T06 4/4; RS0 184/184 local + 184/184 PG | Flux SSE cu cursor, progres din unități durabile, estimare doar măsurată, inspector; PHASE 3 închisă |
| P4-T01 | DONE | 3cd9cf2 | TEST-P4-T01 7/7; RS0 191/191 | Intake local idee/manuscris, rezumat contract legat de creare (stale_form), limite explicite, registru rute; D-ROUTE-PREVIEW FIXED |
| P4-T02 | DONE | eca756c | TEST-P4-T02 7/7; RS0 198/198 | kids-sc v16: 6 biblii de volum, matrice colecție + cronologie, constatări explicate, plan aprobat înainte de bulk |
| P4-T03 | DONE | b1f765b | TEST-P4-T03 6/6; RS0 204/204 | kids-sc v17: 72 PageBlueprints înaintea porții seriei, payoff/deschideri/deținători, atlas cu aprobare explicită și drepturi de reutilizare |
| P4-T04 | DONE | 4d31657 | TEST-P4-T04 9/9; RS0 213/213 | kids-sc v18: lanț cauzal cu citate, vârstă orientativă, voce, știință/T18, ediție nativă aliniată, fără tăieri tăcute |
| P4-T05 | DONE | 705055c | TEST-P4-T05 6/6; RS0 219/219 local + 219/219 PG | Pilot demo→carte completă blochează V2–6 (inclusiv în avans); reconciliere DW01/DW02 selectivă; PHASE 4 închisă |
| P5-T01 | DONE | ced6e9a | TEST-P5-T01 6/6; RS0 225/225 | Siguranță PASS/REVIEW/BLOCK/UNKNOWN separată de scor: intrare, producție, porți, livrare, învățare; BLOCK fără suprascriere |
| P5-T02 | DONE | 5a0c931 | TEST-P5-T02 8/8; RS0 233/233 | QualityPolicy v1/v2 (v2 doar pe versiunea țintă), dovezi validate, snapshot model, evaluare de carte, regresii native respinse |
| P5-T03 | DONE | eaf22b2 | TEST-P5-T03 7/7; RS0 240/240 | Verdict vizual verificat (repere cu ocluzie, deținător, dezvăluire, aglomerare); pereche color/colorat legată de fișiere curente |
| P5-T04 | DONE | b51fa4b | TEST-P5-T04 8/8; RS0 248/248 | QA între artefacte și colecție cu referințe exacte; probleme mari blochează livrarea; colecția = cel mai slab volum |
| P5-T05 | DONE | 3ee1f6e | TEST-P5-T05 8/8; RS0 256/256 | Set de aur gold-v1 (44 cazuri, 3 vârste/2 limbi/temă rezervată), rapoarte cu confuzie/false-pass/kappa, contaminare, comparații oarbe; praguri propuse până la acceptare |
| P5-T06 | DONE | d4b2f12 | TEST-P5-T06 6/6; RS0 262/262 local + 262/262 PG | PagePatch limitat (2 încercări creative), dependenți explicit, fără regenerări necerute, rezolvare doar cu recheck complet; PHASE 5 închisă |
| P6-T01 | DONE | 945de9e | TEST-P6-T01 11/11; RS0 273/273 local + 273/273 PG | Plan de machetă măsurat cu metrica Andika (cod comun server/previzualizare/export), font ≥ profil, schimbare doar cu dovadă, încadrare care protejează reperele, hash identic preview/export |
| P6-T02 | DONE | c197048 | TEST-P6-T02 7/7; RS0 280/280 local + 280/280 PG | Atelierul paginii: context complet, 6 comenzi distincte cu impact înainte de aplicare, hash de stare (stale_preview), AI doar prin poarta deschisă, restaurare cu variante aprobate fixate, link exact în loc de preview generic |
| P6-T03 | DONE | a217469 | TEST-P6-T03 5/5; RS0 285/285 local + 285/285 PG | Pagina de colorat măsurată la tipar după plasare (contur mm, spații mm², gri), legată de fișier și culoare; pagina bună și candidatul eșuat păstrate; fără acceptare automată |
| P6-T04 | DONE | 55b8d82 | TEST-P6-T04 6/6; RS0 291/291 local + 291/291 PG | Profiluri versionate cu reguli datate (cerneală/hârtie/margine/copertă), mapare fizic→canonic cu deschideri și scurgeri, aprobare explicită per carte pentru legacy 28/26; strict12 niciodată KDP |
| P6-T05 | DONE | b5b4492 | TEST-P6-T05 8/8; RS0 299/299 local + 299/299 PG | Inspecție PDF independentă (pagini, fonturi, ToUnicode, DPI plasat, zonă sigură), DPI efectiv/nativ după încadrare, raport de pregătire PASS doar cu măsuri pe profilul real; porți la export final |
| P6-T06 | DONE | a41ab1d | TEST-P6-T06 7/7; RS0 306/306 local + 306/306 PG | ReleaseCandidate legat de snapshot exact, inventar, chitanțe, pregătire, drepturi și note de canal; verificare live, aprobare după previzualizare, export cu copie secundară separată, probă fizică doar cu dovadă; PHASE 6 închisă |
| P7-T01 | DONE | 70e7416 | TEST-P7-T01 6/6; RS0 312/312 local + 312/312 PG | Importurile devin surse + candidați scanați (injecție, citat fals, lume magică, contradicție, coliziune canon); promovare explicită; revocare completă din sursă; D-C19 FIXED |
| P7-T02 | DONE | a1d7fa9 | TEST-P7-T02 6/6; RS0 318/318 local + 318/318 PG | Lărgirea lecțiilor doar cu raport de dovezi (≥2 proiecte la vârstă, ≥3 proiecte/2 teme pentru rol, fără negative, nespecifică proiectului), decizie legată de hash, versiuni fixate, rollback determinist |
| P7-T03 | DONE | 4192df2 | TEST-P7-T03 6/6; RS0 324/324 local + 324/324 PG | Rezultate legate de decizii/reparații, validare grupată pe proiecte, variante comparate doar în aceeași cohortă, efect potrivit al lecțiilor cu marcare dăunătoare; DW fără delta inventată |
| P7-T04 | DONE | 28007d2 | TEST-P7-T04 5/5; RS0 329/329 local + 329/329 PG | Înregistrări de experiență pe rol/skill/cohortă/model cu dovezi; Senior/Principal doar din criteriile OUTPUT-07 și după calibrare; reevaluare la schimbarea modelului; istoric versionat; experiența privată rolului |
| P7-T05 | DONE | f116d0e | TEST-P7-T05 6/6; RS0 335/335 local + 335/335 PG; D-C29 FIXED | Atelier mai sigur: Inginerul legat de cartă, rutare RCA, hash-uri de bază, izolare node_modules, suita absentă = eșec, aplicare jurnalizată cu recuperare, reguli prin promovare |
| P7-T06 | DONE | (acest commit) | TEST-P7-T06 5/5; RS0 340/340 local + 340/340 PG; D-C21 FIXED | Acțiunile lui Dali sunt propuneri validate de server (allowlist, intenție, rută, revizie), aplicate doar la confirmare; inspectorul memoriei rolului; PHASE 7 închisă |
| P8-T01 | DONE | a6c3a67 | TEST-P8-T01 5/5; poarta PASS; RS0 349/349 local + PG | poarta de release, RELEASE-EVIDENCE, /api/health, CI manual |
| P8-T02 | DONE | a6c3a67 | TEST-P8-T02 4/4; drill 12/12 local + PG (300 MB) | drill de recuperare, raport de recuperare, normalizare fără autoproducție, RPO/RTO măsurate |
| P8-T03 | DONE | 6e17ce6 | TEST-P8-T03 5/5; poarta PASS (+licenses); RS0 354/354 local + PG | actualizare etapizată cu revenire, ZIP reproductibil, licențe/OFL, căi lungi, statut comercial pe destinație |
| P8-T04 | DONE | 6fb15d3 | TEST-P8-T04 4/4; benchmark local+PG 1/10/100 + imagini reale | ținte API atinse; admitere pe disc; backup incremental (remediere lacăt) |
| P8-T05 | BLOCKED | 6fb15d3 | TEST-P8-T05 (software) 1/1 | migrare/reconciliere/poarta pilotului verificate pe copie; blocat de furnizor real + deciziile operatorului |
| P8-T06 | PARTIAL | 6fb15d3 | TEST-P8-T06 (software) 3/3 | dus-întors fără pierderi + genericitate; înainte/după și piloții reali depind de P8-T05 |
| P8-T07 | DONE | 6fb15d3 | TEST-P8-T07 6/6 (browser, 4 dimensiuni) | poarta UX/accesibilitate + registrul final de pregătire |
| CU (a+b+c+d+e) | DONE (mecanic) | 30110bb | TEST-CU 18/18 local + PG; poarta PASS; RS0 386/386 local + 386/386 PG | fluxul Creative Upgrade Proposal (doar propunere, agenți permanenți), dosarul BEFORE DW reproductibil, criterii structurale automate, O3 remediat generic; Creative Upgrade-ul real DW = BLOCKED (furnizor neautentic aici) |
| GS (adjudecare gold) | IN_PROGRESS | (acest commit) | TEST-GS 8/8; poarta PASS 394/394 local + 394/394 PG | jurnal de adjudecare append-only (golul 1), acceptarea blocată până la adjudecare completă și rapoarte corespunzătoare (golul 2); cazul 1 confirmat de operator; 43 în așteptare; acceptarea finală în Enterprise Local |

## Rulări de teste

| Data | Suită | Rezultat | Log / observații |
|---|---|---|---|
| 2026-10-02 | `npm run build` pe baseline | PASS — 78 fișiere JS + JSON/lockfile/fonturi | = Evidence Baseline |
| 2026-10-02 | RS0 `npm test` complet pe baseline (`BROWSER_PATH`=Chromium) | **91/91 PASS**, 0 skipped, 77,8 s | Prima rulare nouă (istoricul 91/91 din audit rămâne separat); include PDF real |
| 2026-10-02 | baseline-report --with-tests --with-pg | 14 PASS · 0 FAIL · 3 NOT_RUN | `docs/enterprise/baseline/BASELINE-REPORT.md`; PG 16 efemer |
| 2026-10-02 | RS0 + TEST-P1-T01 după P1-T01 | 98/98 PASS, build 81 JS | prima rulare a picat 1 test nou (aserțiune dependentă de ordine: versiunea tipului 16 după testul de upgrade) — corectat în test, nu în cod |
| 2026-10-02 | RS0 + TEST-P1-T03 | 104/104 PASS | prima rulare completă a picat testul nou (Canva deja conectat în suită) — corectat în test |
| 2026-10-02 | RS0 + TEST-P1-T04 | 112/112 PASS | — |
| 2026-10-02 | Închidere P1: baseline-report --with-tests --with-pg | 14 PASS · 0 FAIL · 3 NOT_RUN; RS0 117/117 | `docs/enterprise/baseline/BASELINE-REPORT.md` |
| 2026-10-02 | RS0 + TEST-P2-T01 (local) | 124/124 PASS | — |
| 2026-10-02 | RS0 complet pe PostgreSQL 16 efemer (WP_TEST_DATABASE_URL) | 124/124 PASS | server verificat pe /api/schema (applied_at din PG) |
| 2026-10-02 | RS0 + TEST-P2-T02 | 132/132 PASS | — |
| 2026-10-02 | RS0 + TEST-P2-T03 | 138/138 PASS | — |
| 2026-10-02 | RS0 + TEST-P2-T04 | 145/145 PASS | — |
| 2026-10-02 | Închidere P2: baseline-report --with-tests --with-pg | 15 PASS · 0 FAIL · 3 NOT_RUN; RS0 151/151 local + 151/151 PostgreSQL | prima rulare PG a picat un test nou (alterare dependentă de stocarea locală) — corectat în test |
| 2026-10-02 | RS0 + TEST-P3-T01 | 157/157 PASS | — |
| 2026-10-02 | RS0 + TEST-P3-T02 | 162/162 PASS | — |
| 2026-10-02 | RS0 + TEST-P3-T03 (local și PostgreSQL) | 169/169 + 169/169 PASS | prima rulare: corectura „rewrite” refolosită greșit (bug real în integrare) — corectat în cod: sarcinile de corectură nu se refolosesc |
| 2026-10-02 | RS0 + TEST-P3-T04 | 174/174 PASS | — |
| 2026-10-02 | RS0 + TEST-P3-T05 | 180/180 PASS | — |
| 2026-10-02 | RS0 + TEST-P3-T06 (local și PostgreSQL) | 184/184 + 184/184 PASS | prima rulare: urma proiectului șters în fluxul de evenimente (RS0 ștergere) și listarea pachetelor pe PG — corectate în cod |
| 2026-10-02 | Închidere P3: baseline-report --with-tests --with-pg | 15 PASS · 0 FAIL · 3 NOT_RUN | o cursă în testul SSE nou (PG) — aserțiune corectată |
| 2026-10-02 | RS0 + TEST-P4-T01 | 191/191 PASS | prima rulare: limitele de cuvânt ASCII nu recunoșteau „română” — corectat (Unicode) |
| 2026-10-02 | RS0 + TEST-P4-T02 | 198/198 PASS | prima rulare: 8 eșecuri — nume global duplicat în UI și hash de plan dependent de scenarii; corectate în cod; fixture P2-T04 actualizat la planul v16 |
| 2026-10-02 | RS0 + TEST-P4-T03 | 204/204 PASS | prima rulare: fixture P2-T04 și numărul de prompturi personalizate DW depindeau de contractul vechi — ajustate |
| 2026-10-02 | RS0 + TEST-P4-T04 | 213/213 PASS | prag de complexitate prea permisiv pentru 3-4 ani — aliniat |
| 2026-10-02 | RS0 + TEST-P4-T05 | 219/219 PASS | politica pilot a schimbat comportamentul v19 2.12 pentru V2 — test actualizat (pregătire în avans de la V3) |
| 2026-10-02 | Închidere P4: baseline-report --with-tests --with-pg | 15 PASS · 0 FAIL · 3 NOT_RUN; 219/219 local + 219/219 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P5-T01 | 225/225 PASS | încadrare de siguranță prea îngustă („with her dad”) — lărgită |
| 2026-10-02 | RS0 + TEST-P5-T02 | 233/233 PASS | evaluarea învechită după editare bloca aprobarea finală fără cale de reevaluare — adăugată reevaluarea |
| 2026-10-02 | RS0 + TEST-P5-T03 | 240/240 PASS | — |
| 2026-10-02 | RS0 + TEST-P5-T04 | 248/248 PASS | regula locului final bloca un final ambiguu din mock — severitate rafinată |
| 2026-10-02 | RS0 + TEST-P5-T05 | 256/256 PASS | — |
| 2026-10-02 | RS0 + TEST-P5-T06 | 262/262 PASS | — |
| 2026-10-02 | Închidere P5: baseline-report --with-tests --with-pg | 15 PASS · 0 FAIL · 3 NOT_RUN; 262/262 local + 262/262 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P6-T01 | 273/273 PASS local + 273/273 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P6-T02 | 280/280 PASS local + 280/280 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P6-T03 | 285/285 PASS local + 285/285 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P6-T04 | 291/291 PASS local + 291/291 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P6-T05 | 299/299 PASS local + 299/299 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P6-T06 | 306/306 PASS local + 306/306 PostgreSQL | — |
| 2026-10-02 | Închidere P6: baseline-report --with-tests --with-pg | 15 PASS · 0 FAIL · 3 NOT_RUN; 306/306 local + 306/306 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P7-T01 | 312/312 PASS local + 312/312 PostgreSQL; D-C19 FIXED | — |
| 2026-10-02 | RS0 + TEST-P7-T02 | 318/318 PASS local + 318/318 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P7-T03 | 324/324 PASS local + 324/324 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P7-T04 | 329/329 PASS local + 329/329 PostgreSQL | — |
| 2026-10-02 | RS0 + TEST-P7-T05 | 335/335 PASS local + 335/335 PostgreSQL; D-C29 FIXED | — |
| 2026-10-02 | RS0 + TEST-P7-T06 | 340/340 PASS local + 340/340 PostgreSQL; D-C21 FIXED | — |
| 2026-10-02 | Închidere P7: baseline-report --with-tests --with-pg | 15 PASS · 0 FAIL · 3 NOT_RUN; 340/340 local + 340/340 PostgreSQL; toate defectele FIXED (D-C26 MITIGATED) | — |
| 2026-10-04 | RS0 + TEST-P8-T01/T02 + poarta de release completă | build/contract/resources/secrets PASS; 349/349 PASS local (PDF real) + 349/349 PostgreSQL | — |
| 2026-10-04 | RS0 + TEST-P8-T03 + poarta de release | build/contract/resources/secrets/licenses PASS; 354/354 PASS local (PDF real) + 354/354 PostgreSQL | — |
| 2026-10-04 | Poarta de release + TEST-P8-T04…T07 | build/contract/resources/secrets/licenses PASS; 367/367 local (PDF real); grupul 8x 35/35 PostgreSQL după corecturile de izolare a testelor 83–85 | rularea completă de ieșire (local + PG) în curs |
| 2026-10-04 | Închidere P8: baseline-report --with-tests --with-pg | 15 PASS · 0 FAIL · 3 NOT_RUN; 368/368 local + 368/368 PostgreSQL; toate defectele FIXED (D-C26 MITIGATED) | — |
| 2026-10-04 | DW01 aplicat (decizia operatorului, varianta A) prin aplicația reală pe proiectul Enterprise separat | 3 câmpuri modificate, 0 modificări colaterale (diferență completă + verificare independentă pe pachet); DW01 închis, DW02 deschis; aprobări 0; originalul neschimbat | rollback: `34750b0` |
| 2026-10-04 | DW02 aplicat (decizia operatorului, varianta A) pe proiectul Enterprise separat | 18 câmpuri în planul V1 + metadate de versiune, 0 modificări colaterale (verificare independentă pe pachet); niciun conflict de reconciliere rămas; aprobări 0; originalul neschimbat; producția oprită | rollback: `425b66a` (înainte de DW02), `34750b0` (înainte de DW01) |
| 2026-10-04 | Creative Upgrade (a+b+c+d+e): poarta de release + suita completă local + PostgreSQL | build/contract/resources/secrets/licenses PASS; 386/386 local (PDF real) + 386/386 PostgreSQL; TEST-CU 18/18 (furnizor simulat: dovezi mecanice) | `docs/enterprise/records/CU.md` |
| 2026-10-05 | GS: poarta de release + suita completă | build/contract/resources/secrets/licenses PASS; 394/394 local (PDF real) + 394/394 PostgreSQL; TEST-GS 8/8 | `docs/enterprise/records/GS.md` |

## Probleme deschise

- Defecte curente reproduse (P1-T02): vezi `baseline/DEFECTS.json`; fiecare are faza de remediere.
- ~~Textul licenței OFL pentru Andika~~ → rezolvat în P8-T03 (`public/fonts/OFL-Andika.txt`, din depozitul oficial SIL; însoțește pachetele livrate).
- ~~dompurify / rgbcolor~~ → rezolvat în P8-T03 (alegeri documentate: Apache-2.0, respectiv MIT; verificarea `licenses` din poartă).
- Copia zilnică automată blochează mutațiile (409) cât durează (secunde, crește cu datele): comportament existent, documentat; măsurat în P8-T04 (contention).

## Aprobări umane așteptate

- ~~DW01~~ → **rezolvat 2026-10-04**: varianta A (aliniere la paginile 8–9), decizia operatorului; doar cele 3 câmpuri de premisă/rezumat V1 (`dinosaur-world-enterprise/DW01-DECIZIE.md`). Nu aprobă manuscrisul, volumul sau colecția.
- ~~DW02~~ → **rezolvat 2026-10-04**: varianta A (manuscrisul este sursa pentru paginile 1, 2, 4–9), decizia operatorului; doar tip/cârlig/pagina răspunsului în planul V1 (`dinosaur-world-enterprise/DW02-DECIZIE.md`). Nu aprobă manuscrisul, V1, colecția sau layoutul.
- Observații DW deschise, nereparate (`dinosaur-world-enterprise/OBSERVATII-DESCHISE.md`): O1 câmpurile payoff din planul V1; O2 întoarceri/dezvăluiri pe aceeași deschidere în V1–V6 (digital/print). De reevaluat la nivelul colecției (incluse în dosarul BEFORE). O3 (constatare reconciliată afișată activă) → **remediat generic**.
- Creative Upgrade real Dinosaur World: **BLOCKED / NOT_RUN** — se rulează în aplicația Enterprise Local a operatorului, cu furnizorul autentic (Claude Pro; ChatGPT dacă un agent e legat de GPT); propunerea rezultată se revizuiește de operator; aplicarea ei este o operație separată, cu aprobarea lui.
- Producția Dinosaur World este **oprită**: nu a început pilotul V1, nu s-au generat imagini, nu s-a rulat Creative Upgrade-ul real.
- Dinosaur World real (P8-T05/T06): porțile de revizuire, furnizorul verificat în aplicația operatorului și acceptarea pilotului V1 (WAITING_HUMAN).
- Setul de aur gold-v1: adjudecarea în curs, caz cu caz, prin jurnalul `evaluation/gold/gold-v1.adjudications.jsonl` (19/44 la 2026-10-05 — toate cele 18 cazuri de siguranță + 1 de vârstă; observații OBS-GS-1…11); după adjudecarea completă urmează, la decizia operatorului, o etapă separată de hardening/validare adversarială (set nou cu cazuri-limită) — 100% pe gold-v1 nu validează politica v2 și nu promovează maturitatea; acceptarea raportului de calibrare se face separat, de operator, în Enterprise Local (refuzată de aplicație până la adjudecarea completă). Până atunci pragurile v2 rămân „propuse” și afirmațiile de maturitate (P7) sunt blocate. (WAITING_HUMAN)

## Checkpoint

- Ultimul task închis: GS infrastructură (jurnal de adjudecare + blocarea acceptării premature); cazul 1 adjudecat
- Următorul task: **adjudecarea cazului 20 din gold-v1** (decizia operatorului); apoi cazurile 21–44, etapa de hardening/validare adversarială, release-ul, Enterprise Local (acceptarea acolo)
- Cum se reia: `npm ci && npm run build && BROWSER_PATH=/opt/pw-browsers/chromium npm test`; citește tabelul de mai sus și `docs/enterprise/records/`.
