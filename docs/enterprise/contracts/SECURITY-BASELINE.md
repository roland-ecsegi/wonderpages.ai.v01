# Security baseline P1–P8 (P1-T04)

Checklist executabil: `GET /api/security/posture` (doar pe laptop) și `tests/22-p1-security.test.mjs`. Full auth/SSO/RBAC/tenant/pentest rămân în P9-B; produsul constrained **nu** se descrie ca SaaS public securizat.

| Control | Implementare | Test |
|---|---|---|
| Bind local implicit | serverul ascultă pe 127.0.0.1/::1; 0.0.0.0 numai cu LAN activ (v04, păstrat) | posture `BIND` |
| LAN opt-in cu cod și sesiuni HttpOnly/SameSite=Strict, 30 zile, 5 încercări/minut | `lan.js` (v04, păstrat) | sesiune expirată/falsificată refuzată |
| Transport LAN | `lan-https` cu certificatul operatorului; **fără HTTPS → `lan-restricted`**: dispozitivele din rețea urmăresc și comentează, dar nu aprobă/decid/editează/livrează/pornesc. Revenirea la comportamentul v04 cere acceptarea explicită, de pe laptop: `PUT /api/settings/lan-transport {acceptPlainLan:true}` (`lan-plain-accepted`, risc documentat) | `transportMode`, `remoteMutationBlocked` |
| Host / CSRF / Origin | Host străin 403 (v04); antet `x-wp` obligatoriu (v04); **Origin cross-site pe cereri de modificare → 403** (nou) | RS0 `3-securitate`; Origin străin |
| Arhive neîncrezătoare | `security/safe-zip.js` folosit de importul de proiect și de training: traversal, căi absolute, `\`, duplicate (inclusiv case-insensitive), symlink, criptare, metodă necunoscută, CRC, dimensiune declarată ≠ reală, număr de fișiere, plafon per intrare/total | unit + API |
| MIME + decode | imaginile importate și referințele de proiect nou trebuie să fie, după octeți, tipul declarat; altfel sunt respinse (import: omise și raportate în jurnal) | API |
| Nicio execuție din pachete | pachetele sunt date; niciun script nu rulează (v04, păstrat) | RS0 C1 |
| Credențiale DB legacy | seturile cunoscute se încearcă **numai pentru o bază loopback** (migrare locală legacy); folosirea lor apare ca avertisment în posture (`DB_CONTAINER` loopback); fără rotație automată | `candidates()` |
| Instalare nouă | `instaleaza.bat` generează o parolă aleatoare de 24 de caractere când volumul nu există; Docker publică PostgreSQL doar pe `127.0.0.1:5433` | verificare statică (Windows NOT_RUN aici) |
| Secrete | tokenuri Canva/Drive criptate AES-256-GCM cu cheie locală (v04); **exportul de proiect nu conține cheia/settings/lan/tokenuri**; **consola/jurnalul redactează** chei `sk-…`, `Bearer`, parole din URL, `*_token`, `client_secret`, cookie `wp_session` | test export + `redact` |
| API keys | interzise în modul principal; eliminate din procesele copil (v04) și clasificate `unavailable` (P1-T03) | RS0 |
| Workspace Inginer | copie separată (v04); izolarea completă în P7-T05 | RS0 atelier |
