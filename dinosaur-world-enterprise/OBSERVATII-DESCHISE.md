# Dinosaur World Enterprise — observații deschise (nereparate, de reevaluat la nivelul întregii colecții)

Înregistrate la 2026-10-04, după DW01 și DW02. Conform deciziei operatorului, **nu s-a luat nicio decizie creativă sau de
layout** pentru ele și nu s-a modificat nimic.

## O1 — Câmpurile `payoff` din planul V1 (paginile cu cârlig)

DW02 a copiat din manuscris doar tipul, cârligul și pagina răspunsului. Descrierea răspunsului din plan (`turn.payoff`)
a rămas o copie a scopului paginii, diferită de manuscris:

| Pagina | Plan (`turn.payoff`) | Manuscris (`turn.payoff`) |
|---|---|---|
| 1 | Milo se trezește în cuib. | Pietricica este descoperită. |
| 2 | Găsește pietricica. | Atingerea îl pune în mișcare. |
| 4 | Pietricica dispare spre ferigi. | Tia se prezintă. |
| 6 | Milo o invită și urmăresc două sclipiri. | Este reflexia, nu o a doua pietricică. |
| 8 | Începe ploaia; prietenii caută adăpost. | Împart frunza ținută de Tia. |

Impact: necosmetic doar dacă o etapă viitoare citește descrierea răspunsului din plan; verificările actuale cer doar ca
ea să existe. De decis separat (aliniere la manuscris sau păstrare).

## O2 — Întoarceri/dezvăluiri pe aceeași deschidere (spread / layout / print)

Cârligul unei pagini și răspunsul lui pot ajunge pe aceeași deschidere, în funcție de mapare. Problema există în cărți
indiferent de DW02; după DW02 aplicația o vede și pentru V1.

- **Mapare fizică digital și print** (coperta, apoi paginile): V1 1→2; V2 7→8; V3 5→6, 7→8; V4 3→4; V5 5→6; V6 5→6.
- **Mapare KDP** (scena = pereche imagine/text): nicio scurgere.
- **Mapare teoretică a planului** (pagina 1 singură, apoi perechi): V1 2→3, 4→5, 6→7, 8→9; V2 2→3, 4→5, 8→9; V4 8→9;
  V5 2→3, 8→9; V6 8→9 (V2–V6 existau dinainte de DW02).

De reevaluat la etapa de machetă/profil, pentru toată colecția (acceptare argumentată, alt tip de cârlig sau altă așezare).

## O3 — Vederea canonului arăta `finding:DW01` după reconcilierea validă → **REZOLVAT generic** (Creative Upgrade, a+b+c+d+e)

Cauza: constatările de canon ale migrării (`project.canonFindings`) erau listate ca active fără să se țină cont de
deciziile operatorului care le închid. Remediere generică (fără DW/DW01 în cod): `findingStatus(findings, decisions)`
în `server/domain/canon.js` — o constatare este rezolvată numai de o decizie **aprobată** al cărei domeniu o numește
(`scope.conflicts`); vederea canonului (`GET /api/projects/:pid/canon`) întoarce conflictele active și, separat,
`resolvedFindings` cu decizia, actorul, momentul și nota. Pista de audit rămâne neatinsă (`canonFindings` nu se șterge).
Pe proiectul Enterprise: `finding:DW01` nu mai este activ, apare în istoric cu decizia `dmuu63dt630b9e3`. Singurul element
activ rămas este proiecția `series.volumes[0].summary` = **unverified** — lăsată intenționat neverificată (nu există o
evaluare semantică reală care s-o poată marca verificată). Teste de regresie: `tests/86-creative-upgrade.test.mjs`.

## O1/O2 — rămân deschise

Nu au fost reparate. Sunt incluse ca observații deschise în dosarul BEFORE (`CREATIVE-BASELINE.json`:
`findings.observations.payoffMismatches` = 5, `sharedOpenings` = 14 pe mapările digital/print) și sunt intrare pentru o
propunere Creative Upgrade sau pentru revizia de machetă.

## Notă informativă (nu este conflict)

Manuscrisul are două câmpuri de întoarcere: `turn` (cârligul care pleacă de pe pagină) și câmpul mai vechi `page_turn`
(dacă pagina însăși este o dezvăluire). Ele diferă intenționat, de exemplu p2: `page_turn` „reveal” (răspunsul la p1),
`turn` „anticipation” (cârligul spre p3). Nu au fost modificate.
