---
name: ruleaza-teste
description: Ce teste există și ce trebuie să treacă după orice schimbare de cod. Folosește-o înainte să închei o implementare în atelier.
---
# Testele aplicației

- `npm test -- --quick` pornește o copie temporară a aplicației cu Claude, Canva și ChatGPT simulate (`tests/mocks`, `tests/shim`). Nu atinge datele reale și nu consumă abonamente.
- Fișiere: `1-productie` (fluxul cap-coadă), `2-unelte` (Dali, agenți, atelier), `3-securitate` (atacurile din audit trebuie să eșueze), `4-optimizare` (versiunea 19), `5-invatare` (module testate direct).
- `WP_ONLY=4 npm test -- --quick` rulează doar fișierele care încep cu 4.
- Un prompt nou sau schimbat are nevoie de un răspuns în `tests/mocks/bin/claude.cjs` (după un marcaj de text din prompt), altfel mock-ul răspunde „unknown”.
- Atelierul rulează singur „testul de pornire” și suita rapidă; o schimbare care le pică nu se aplică.
