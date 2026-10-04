# Registrul final de pregătire (P8-T07 — poarta finală, cu constrângerile explicite)

Starea la închiderea fazei 8. „Pregătit” înseamnă **verificat în copia de lucru, cu dovezile indicate**; nimic din acest
registru nu este o afirmație de piață, de pregătire SaaS Enterprise sau de probă fizică de tipar.

## Fazele 1–8

| Faza | Stare | Dovezi |
|---|---|---|
| P1–P7 | toate taskurile DONE | `docs/enterprise/records/P1.md` … `P7.md`; suita completă local + PostgreSQL la fiecare închidere |
| P8-T01 poarta de release | DONE | `scripts/enterprise/release-gate.mjs`, `RELEASE-EVIDENCE.json` în fiecare pachet, `GET /api/health`, CI doar manual |
| P8-T02 recuperare | DONE | `docs/enterprise/baseline/RECOVERY-DRILL.json` (local + PostgreSQL, 300 MB) |
| P8-T03 instalare/actualizare | DONE | `scripts/actualizare.mjs` (smoke, hash-uri protejate, revenire), ZIP reproductibil, licențe + OFL |
| P8-T04 capacitate | DONE (cu remediere) | `docs/enterprise/baseline/CAPACITY.json`, `CAPACITY-REAL-ASSETS.json`; backup incremental |
| P8-T05 DW real | **BLOCKED** | `docs/enterprise/migration/DW-P8-STATUS.json` — furnizor real verificat + deciziile operatorului |
| P8-T06 înainte/după | **PARTIAL** | dus-întors fără pierderi + genericitate demonstrate; comparația înainte/după și piloții reali depind de P8-T05 |
| P8-T07 UX/accesibilitate | DONE | `tests/84-p8-ux.test.mjs`, `docs/enterprise/contracts/UX-ACCESSIBILITY.md` |

## Porți dure principale (verificate)

Contractul de produs 6×2×12; un singur proiect activ; aprobările invalidate la schimbare; siguranța (BLOCK oprește
volumul); calitatea pe dovezi; machetă măsurată; profilul de tipar aprobat explicit; inspecția PDF independentă;
candidatul de release legat de toate dovezile; cunoașterea în carantină și promovarea guvernată; acțiunile Dali doar
propuse; poarta de release; restaurare fără producție automată; admitere pe spațiu liber.

## Constrângeri explicite (ce NU este pretins)

| Constrângere | Ce lipsește | Cine o ridică |
|---|---|---|
| Producția reală Dinosaur World | ieșiri reale prin furnizor verificat sau schimb manual; DW01/DW02; porțile; pilotul V1; V2–6 | operatorul (decizii) + furnizorul din aplicația lui |
| Înainte/după DW | artă „după”; fără ea nu se raportează nicio diferență vizuală | după P8-T05 |
| Setul de aur gold-v1 | adjudecarea etichetelor și acceptarea calibrării (`POST /api/evaluation/accept`); până atunci pragurile v2 sunt „propuse” și maturitatea agenților rămâne „unproven” | operatorul |
| Pregătirea pentru tipar / canal | probă fizică / acceptarea platformei cu chitanță; destinațiile rămân „nemăsurat” fără ele | operatorul |
| CI pe GitHub | workflow-ul manual nu a fost declanșat din această sesiune (fără publicare externă) | operatorul |
| Windows | `instaleaza.bat` și fluxul de actualizare pe Windows nu au fost rulate aici (testat pe Linux) | operatorul, pe laptopul de referință |
| Hostul de referință | capacitatea și RPO/RTO sunt măsurate pe acest host, nu pe al clientului | operatorul |
| PHASE 9 (multi-tenant / SaaS) | neactivată, conform cererii | — |

## Cum se reia
`npm ci && npm run build && BROWSER_PATH=… npm test`; poarta completă: `node scripts/enterprise/release-gate.mjs`;
starea DW: `node scripts/enterprise/dw-status.mjs`; drill: `node scripts/enterprise/recovery-drill.mjs --pg`;
capacitate: `node scripts/enterprise/capacity-bench.mjs --pg`.
