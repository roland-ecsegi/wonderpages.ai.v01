# Atelierul paginii — comenzi cu impact înainte de aplicare (P6-T02)

**Rută UI:** `#/p/<proiect>/book/<volum>/<pagină>` (pagina 0 = coperta). Fiecare pagină din tab-ul Carte are butonul „Atelier”;
elementele de machetă din Revizuire duc exact la pagina lor (linkul generic „preview” a fost eliminat; aliasul rămâne pentru rutele vechi).

## Ce arată

| Zonă | Conținut |
|---|---|
| Miniaturi | cele 12 pagini + coperta, cu semne: QA negativ ✗, colorat depășit ↺, machetă blocată ⚠, pagină fără text ∅, ilustrație în așteptare |
| Pânza | perechea Poveste / Colorat cu macheta măsurată (P6-T01) și încadrarea ei |
| Limbi | textul fiecărei limbi (sursă, ediție nativă sau `text_ro`) cu numărul de rânduri măsurate și dacă încape |
| Distribuție / obiecte | numele din biblie |
| Contractul scenei | scenă, acțiuni, ce nu apare încă, efecte, compoziție |
| Verificări | verdictul vizual + colorat (P5-T03) și constatările de machetă |
| Versiuni | istoricul imuabil (P2-T03): curentă, aprobată/fixată, restaurată din; restaurarea creează o versiune nouă |

## Comenzi

| Comandă | AI | Se schimbă | Devine depășit | Apeluri |
|---|---|---|---|---|
| `exact` înlocuire exactă | nu | `<text>#pN` (limba aleasă) | pagina nativă (revalidare) când se corectează sursa | 0 |
| `style` ajustare stilistică | da (mode `adjust`) | `<text>#pN` | pagina nativă | 1 text |
| `semantic` rescriere semantică | da (mode `rewrite`) | `<text>#pN` | culoarea, colorarea, pagina nativă, QA | 1 text |
| `color` reparație culoare | da | `ill:color` | `ill:line` | 1 imagine + 1 QA vizual |
| `line` doar colorat | da | `ill:line` | — (culoarea are același hash) | derivare + QA linie |
| `layout` doar machetă | nu | `layout:v:p` (doar `page.layout`) | — | 0 |

## API

- `GET /api/projects/:pid/workbench/:v/:p` — vederea paginii (v 1-based, p 0…12).
- `POST …/preview {command, payload}` — impactul (schimbări, depășite, neatinse, apeluri, note, impactul din graful de dependențe
  pentru `exact`, celelalte modificări care s-ar aplica împreună la poartă) și `previewHash`. **Nu scrie nimic** (anularea nu lasă urme).
- `POST …/commit {command, payload, previewHash}` — refuzat cu `stale_preview` dacă volumul s-a schimbat între timp.
  `exact` și `layout` se aplică local, se verifică pe hash-urile tuturor unităților volumului (`verify.changed` / `unrequested`)
  și se înregistrează ca decizie `workbench`. Comenzile cu AI trec prin poarta de revizie deschisă (reparația țintită P5-T06:
  plan limitat, 2 încercări creative, verificare înainte/după, apelurile exacte în raport); fără poartă → `needs_gate`;
  element lipsă/blocat → `item_not_applicable` (de ex. colorarea depășită se derivă la aprobarea culorii noi).

## Garanții

- Doar unitățile afectate se schimbă; frații rămân identici (verificat pe hash-uri).
- Variantele aprobate sunt fixate și nu sunt eliminate de retenție; restaurarea creează o revizie nouă și re-leagă sau lasă depășiți dependenții.
- Nicio regenerare a întregii cărți dintr-o comandă de pagină.
