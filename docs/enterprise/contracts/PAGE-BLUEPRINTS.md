# PageBlueprints (72) și canonul vizual (P4-T03)

Implementare: `server/domain/page-blueprints.js`, `server/domain/atlas.js`, etapa `page_plans` și elementele `pageplans`/`atlas` la poarta seriei (`blueprints/kids-sc.json` **v17**, `server/engine.js`), `GET /api/projects/:pid/pageplans`, `GET /api/projects/:pid/atlas`, vizualizarea `pageplan` (views.js) și randarea la aprobare (ui.js).

## PageBlueprint

Planul unei pagini fizice, înaintea oricărui manuscris sau imagini. ID-uri `V1-P01 … V6-P12` (exact 72). Câmpuri: funcția narativă (`role`), momentul (`beat`), scopul, **emoția**, **schimbarea de stare** (`new_information`), **ce adaugă imaginea** (`image_added_value`), acțiunile vizibile (cine ține ce obiect și **cu ce**), personajele, obiectele, locul, întoarcerea paginii (`turn`: quiet / question / reveal, `hook`, `payoff_page`, `payoff`), storyboard și zona textului.

Surse: artefactele `plan_<v>` produse de etapa nouă **Planul paginilor** (faza A, după distribuție, înaintea porții seriei: nimic nu se scrie în volum înainte de aprobarea planului) sau, pentru proiecte vechi (Dinosaur World), `series.volumes[].page_plan` — citite, niciodată rescrise. Scenariile primesc planul aprobat al volumului (`{{plan_volume}}`) și păstrează funcțiile, dezvăluirile și întoarcerile.

## Verificări

| Cod | Severitate | Regula |
|---|---|---|
| PAGE_COUNT | blochează | exact 72 de ID-uri unice (lipsă, duplicat, în plus) |
| PAGE_FIELDS | blochează | fiecare pagină are funcție, emoție, valoarea imaginii și schimbarea de stare |
| MISSING_PAYOFF | important (mic: răspuns nedescris) | un cârlig are o pagină de răspuns ulterioară, existentă |
| SPREAD_LEAK | important | răspunsul (sau prima apariție dezvăluită) nu este pe aceeași deschidere fizică cu întrebarea |
| WRONG_HOLDER | important | obiectul este ținut doar cum permite anatomia (de ex. Tia: botul; Milo: ambele mâini); deținătorul este pe pagină; obiectul nu apare înainte de introducerea lui |

Maparea fizică (ADR04, strict12): interiorul începe pe o pagină din dreapta; deschideri 2-3, 4-5, 6-7, 8-9, 10-11; p1 și p12 singure. Parametrul `firstSide` permite maparea inversă; profilul de randare o rafinează în P6-T04. Un răspuns pe aceeași deschidere nu este „ascuns”.

## Canonul vizual (atlas)

Cerințe derivate din canon: protagonistul — față, profil, spate, expresii; ceilalți — față, profil, expresii. Stări: `covered_original` (referința proprie a operatorului, byte-for-byte, hash), `covered_approved` (fișă generată **aprobată explicit** la poarta seriei, cu hash-ul curent), `proposed`/`missing` (propunere de job nou, cu aprobare vizuală; nimic nu devine aprobat implicit), `inactive_rights` (reutilizare dintr-o altă carte sau stoc fără `RightsRecord` clarificat `atlas:<id>` — nu se folosește ca referință). Numai intrările active ajung în `activeReferences`.

## Contextul reperelor (DW03)

`landmarkContext` scoate copia JSON a reperelor încorporată în `canonical_description` **numai din prompt** și transmite reperele o singură dată, structurat (`relative_size` JSON-string → obiect). Datele brute rămân neschimbate (hash verificat în test).

## Dinosaur World (doar citire)

72 PageBlueprints din `page_plan`, 0 blocaje; 7 cârlige cu răspunsul pe aceeași deschidere sub maparea strict12 (de decis la P4-T05, împreună cu DW02); cele 2 PNG originale (Milo, Tia) identice cu manifestul; Pip și vederile lipsă rămân propuneri.
