# UX / accesibilitate — poarta finală (P8-T07)

Măsurat în browserul real (Chromium headless, `tests/84-p8-ux.test.mjs`, auditul din `tests/ux-audit.mjs`) pe toate
vederile principale: panou, proiecte, proiect nou, progres, revizuire, carte, atelierul paginii (toate cele 13 pagini),
livrare, activitate, învățare, agenți, îmbunătățiri, setări, tipuri de produs.

| Verificare | Regulă | Rezultat |
|---|---|---|
| Lățimi | 375 (mobil), 768, 1440 px și 1440 px la zoom 200% | fără derulare orizontală a paginii |
| Controale accesibile | fiecare control vizibil este în ecran (sau într-un container derulabil propriu) | 0 abateri |
| Nume accesibile | fiecare control are nume (text, `aria-label`, etichetă) | 0 abateri |
| Ținte (mobil) | ≥ 24×24 px CSS (WCAG 2.5.8); linkurile din text, eticheta casetelor și regiunile cu zoom (echivalent la dimensiune normală) exceptate conform regulii | 0 abateri |
| Regiune live | `#toasts` (`role=status`, `aria-live=polite`) există de la încărcare | da |
| Dialog | focusul intră în dialog, Tab/Shift+Tab rămân în el, Escape îl închide și focusul revine la buton; dialog numit | da |
| Focus vizibil | stil `:focus-visible` la navigarea cu tastatura | da |
| Titlu pe pagină | fiecare rută are titlul ei | da |
| Blocaje cu acțiune | fiecare `.banner.err` / `.notice.err` vizibil conține un link sau un buton | 0 abateri |
| Stări | instalare goală (duce la proiect nou / setări), limită de abonament, eroare de autentificare, cale de ieșire lungă | fiecare cu acțiune, fără depășire |

## Corecturi făcute de poartă
- regiunea live permanentă în `index.html` (era creată abia la primul mesaj);
- titlul lung al proiectului se taie cu „…” în propria cutie (ieșea din ecran pe mobil);
- „Toate proiectele” și etichetele casetelor ≥ 24 px; câmpul de fișier al formularului are nume;
- butoanele edițiilor din Livrare trec sub titlu la ≤ 1100 px (ieșeau din ecran la 768 px și la zoom 200%);
- banda de eroare din revizuire duce la Activitate; „Canva nu este conectat” duce la Setări.

## Limite
Auditul este automat (geometrie, nume, focus, stări); nu înlocuiește un test cu cititor de ecran real sau cu utilizatori.
Contrastul culorilor nu este măsurat automat aici (tema existentă a trecut auditul inițial al aplicației).
