# RCA și îmbunătățirea continuă mai sigură (P7-T05)

Fluxul atelierului (`server/improve.js`) leagă acum: **incident → cauză → patch izolat → verificări complete → operator →
aplicare jurnalizată → rezultat**.

| Pas | Regulă |
|---|---|
| Rutare RCA | `classifyIncident`: defect de **conținut** (pagină, scenă, personaj, colorat) → reparația în carte (atelierul paginii / reparația țintită), fără patch de cod; **infrastructură** (autentificare, token, cotă, rețea) → constrângere „nu se modifică poveștile/scenele/prompturile de conținut” (verificare care respinge schimbări în `blueprints/` sau `seeds/`); altfel patch de cod izolat. |
| Legarea Inginerului (C29) | `engineerBinding()`: carta rolului (`text:claude-code`) și legarea modelului trebuie să fie consistente; înainte de apel, `assertExecutable('claude-code-text')`. |
| Hash de bază | analiza reține hash-ul arborelui aplicației; dacă codul se schimbă după analiză, aprobarea este refuzată (`stale_analysis`). Copia de lucru reține hash-ul fiecărui fișier live; la aplicare, orice fișier schimbat între timp → `stale_patch`. |
| Izolare | copia nu are legătura la `node_modules` cât timp Inginerul editează (legătura apare doar pentru verificări și se elimină după); o scriere în dependențe (node_modules propriu sau semnătura modulelor instalate schimbată) pică verificarea. |
| Verificări | sintaxă server/interfață, JSON, fișiere protejate, test de pornire, suita de teste pentru orice schimbare de cod; **o suită absentă din copie este eșec**, nu „trecută”. |
| Aplicare jurnalizată | backup → jurnal `applying` → copiere → jurnal `applied`; la pornire, o aplicare întreruptă se anulează automat din backup și îmbunătățirea revine la „propunere”. |
| Reguli | regulile propuse de o îmbunătățire devin **candidați** de cunoaștere (sursă `improvement`), promovați prin poarta P7-T02; anularea îmbunătățirii revocă și regulile (cod + reguli coerente). |
| Rezultat | `it.outcome` + `Ledger kind: improvement_outcome`. |

**Dinosaur World:** un defect editorial DW se rutează către reparația conținutului; o eroare de autentificare a unui furnizor
nu rescrie povestea.
