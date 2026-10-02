# Intake ghidat: idee / manuscris (P4-T01)

Implementare: `server/domain/intake.js`, rutele `POST /api/intake/infer` și `POST /api/intake/preview` (`server/enterprise-routes.js`), validarea la `POST /api/projects` (`server/index.js`), UI în `public/app/views.js`, `actions.js`, `core.js`.

## Flux

1. **Pe scurt** (opțional, deasupra formularului): operatorul scrie ideea sau lipește manuscrisul. `Propune completarea formularului` cheamă `/api/intake/infer` — o inferență **locală, deterministă, fără AI**, care nu creează nimic. Propunerea arată fiecare valoare cu sursa ei („din text”, „textul tău”, „rezumat din primele fraze — verifică-l”), avertismentele (vârstă în afara benzilor, text peste limită) și câmpurile rămase de ales. `Aplică în formular` (confirmare) sau `Renunță` (anulare, formularul rămâne neschimbat).
2. **Formularul existent** rămâne integral (aceleași câmpuri, aceleași etichete); câmpurile opționale (titlu, observații, personajele tale, manuscrisul) sunt grupate în „Mai multe opțiuni” (progressive disclosure), deschis automat când conțin ceva.
3. **Rezumatul „Ce se va produce”** este calculat de server (`/api/intake/preview`) din exact valorile care se vor trimite: tema, vârsta, limbile (sursă / adaptare naturală), stilul, formatul, **sursa** (idee scurtă, manuscris propriu, pachet de antrenament), structura (6 volume × 12 pagini, numărul de cărți) și erorile de contract. `Creează proiectul` este activ numai pentru un contract valid.
4. **Crearea** trimite `previewHash` (hash canonic al tipului, versiunii lui și valorilor normalizate). Dacă formularul sau versiunea tipului de produs s-au schimbat după rezumat → `409 stale_form`, rezumatul se recalculează. Fără `previewHash` (API-ul existent, importuri, teste vechi) crearea rămâne compatibilă. Proiectul creat este `ready` — pornirea rămâne o acțiune separată, explicită.

## Limite (fără tăiere tăcută)

| Câmp | Limită |
|---|---|
| Descriere scurtă | 2000 caractere |
| Titlu | 160 |
| Observații | 4000 |
| Manuscris (`seed_story`) | 20000 — peste limită: `422 input_too_long` cu limita și lungimea; sugestie: împarte pe volume |

## Sursa proiectului (`project.source.kind`)

`idea` · `manuscript` · `pack` (pornit dintr-un pachet de antrenament) · `import` (pachet importat; sursa originală păstrată în `original`) · `migration` (de ex. Dinosaur World). Afișată ca etichetă în antetul proiectului. Un proiect importat/migrat nu trece prin wizard și nu este rescris.

## Registrul de rute

`PROJECT_TABS` (progres, revizuire, carte, livrare, activitate) și `TAB_ALIASES` (`preview → book`, plus aliasuri românești) în `public/app/core.js`; tab-urile proiectului sunt generate din registru. Testul verifică static că fiecare link `#/p/…/<tab>` din UI duce la un tab real și, în browser, că `#/p/<id>/preview` deschide **Carte** (unde se verifică macheta și limbile). D-ROUTE-PREVIEW → FIXED.

## Dali

Dali poate doar propune completarea formularului (`fill_project`), deschide o pagină sau nota o îmbunătățire; orice altă acțiune din răspunsul modelului (creare, pornire, publicare) este ignorată.

## Limitări

Variantele de concept generate de agenți (Director creativ) sunt în P4-T02 (concept variants / collection matrix); P4-T01 oferă alegerea sursei și propunerea locală. Inferența recunoaște română și engleză.
