# Registrul comportamentelor protejate (P1-T02)

Fiecare comportament are un validator sau un test. „RS0” = suita originală (`tests/1-…` – `tests/13-…`); testele `2x-…` sunt adăugate de transformare. Lista se extinde în fiecare fază.

| ID | Comportament protejat | Sursă | Enforcement / test |
|---|---|---|---|
| PB01 | 6 volume × Story+Coloring × 12 pagini + coperți; benzi 3–4/5–6/7–8; o vârstă per colecție | U, C03 | `domain/product-contract.js`; `tests/20-p1-contract` |
| PB02 | Ediții lingvistice = variante ale aceleiași cărți (EN+RO → 18 cărți, 1 Product Type) | U | `editionsFor`; `tests/20` |
| PB03 | Profil digital 14 pagini; KDP legacy 28/26 + copertă wrap separată; strict12 nu e KDP-ready | C23, ADR04 | `printprofile.js`, `profileCompatibility`; RS0 „KDP cere coperta…”, „scenele diferă de paginile fizice…”; `tests/20` |
| PB04 | Import: ID nou, stare Pregătit, aprobări resetate, etape lucrate păstrate `imported`, fără autorun | C17 | RS0 „export și import de proiect…”, C1 |
| PB05 | Aprobarea se invalidează când conținutul (chiar de aceeași lungime) se schimbă; livrarea refuzată fără aprobare finală | C14, C24 | RS0 „aprobarea se invalidează…”, „v03: amprenta…”, „livrarea e refuzată…” |
| PB06 | Critică cu 18 criterii exacte, medie ≥8, critice ≥7, maximum două corecții | C13 | RS0 „v19 1.7…”, „v03: critică incompletă…” |
| PB07 | Corecturi locale: color/lineart separate, înlocuire exactă fără AI, pagini nevizate neschimbate | C14 | RS0 „v03 acceptare: pagina 4…”, „pagina 7…”, „înlocuirea exactă…” |
| PB08 | Un singur proiect activ; pauză sigură; repornirea transformă running în paused/awaiting_review | C07, C08 | RS0 „un singur proiect activ”, „ștergere: nu în timp ce…” |
| PB09 | Backup DB+fișiere+manifest, retenție 14 automate + manuale, restaurare, copie secundară cu eșec explicit | C25 | RS0 `11-snapshot`, `13-backup-display`; `PG_QA` |
| PB10 | Securitate: CSP, anti-CSRF (`x-wp`), anti-rebinding, rute localOnly, zip-bomb, OAuth state, Drive `drive.file`, tokenuri criptate | C26 | RS0 `3-securitate` |
| PB11 | Fără chei API plătite spre Claude/Codex; limitele abonamentului raportate separat, fără fallback tăcut | C09, ADR13 | RS0 „cheile API nu ajung…”, „limita Codex…”, „diagnostic: fără API plătit” |
| PB12 | 11 identități permanente (ID, nume, persona/model personalizate) | C04 | RS0 „agenți și lecții”, „agenții aleg separat…” (registru P3-T01) |
| PB13 | Dali ghidează, completează formularul, notează îmbunătățiri | C21 | RS0 „Dali: …” (limita de autoritate P7-T06) |
| PB14 | Atelier: copie separată, checks, testul de pornire, scripturile de pornire protejate, rollback | C22 | RS0 „atelier: …” |
| PB15 | Learning: lecții pe scope, retrospectivă aplicată doar cu acord, set de aur, calibrare | C18 | RS0 `4-optimizare`, `5-invatare` |
| PB16 | Ștergere definitivă cu confirmare; nimic din proiect nu rămâne; copiile de siguranță păstrează celelalte proiecte | purge.js | RS0 `6-stergere` |
| PB17 | Aplicația v04 nu preîncarcă DW; zero proiecte noi implicit la instalare | DW07 | inventar; DW doar în `reference/` (în afara release) |
| PB18 | Originalele (ZIP v04, ZIP DW, arhitectura) nu se modifică | cerință | hash-uri în `reference/README.md`; `DW_REFERENCE` în baseline |

Defectele curente care **nu** sunt comportament protejat (se corectează în faza indicată) sunt în `baseline/DEFECTS.json`.
