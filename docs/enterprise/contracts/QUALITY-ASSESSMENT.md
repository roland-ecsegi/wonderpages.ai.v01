# QualityAssessment: editorial, ediție nativă și carte (P5-T02)

Implementare: `server/quality/assessment.js`; integrarea în `critique_revise` (`server/engine.js`); etapa nouă `critic_final` și elementul `book` (`kids-sc` **v20**); `GET /api/projects/:pid/assessment/:v`, `POST /api/projects/:pid/assessment/:v/refresh` (reevaluare fără rescriere); `bookHTML` (ui.js).

## Politici versionate

| Politică | Status | Regula de trecere | Se aplică |
|---|---|---|---|
| v1 | activă | medie ≥ pragul etapei; criteriile critice ≥ 7 (comportamentul existent) | tipuri fără `quality_policy` (inclusiv proiectele vechi, DW v15) |
| v2 | **propusă** (OUTPUT-13) | medie ≥ 8; T01 și T08 ≥ 8; niciun criteriu < 7; dovezi validate | numai tipul care o declară (`kids-sc` v20) |

Evaluările istorice nu se reetichetează: fiecare evaluare poartă politica și versiunea ei. Pragurile v2 se calibrează pe setul de aur în P5-T05.

## Evaluarea unui text (`wonderpages.quality-assessment/1`)

- **Acoperire**: exact cele 18 coduri T01–T18 (păstrate), fără lipsuri, duplicate sau coduri necunoscute; altfel evaluarea este invalidă (fail-closed).
- **Dovezi**: fiecare citat (al criteriilor și al problemelor) trebuie să existe în textul evaluat (normalizare de diacritice/ghilimele/punctuație; prefixul „Pagina N:” ignorat). Sub v2 un citat inventat face răspunsul invalid: criticul este întrebat o dată din nou, apoi etapa eșuează închis. Sub v1 se consemnează.
- **Snapshot**: politica, agentul, modelul și sursa lui, manifestul de context și promptul criticului.
- **Legată de versiune**: hash-ul conținutului salvat. O editare ulterioară face evaluarea învechită.

## Evaluarea cărții (`wonderpages.book-assessment/1`)

Un volum nu trece din 12 pagini bune izolate: secvența 1..12, lanțul cauzal până la o consecință în ultima treime și o ultimă pagină cu text (P4-T04), blocajele contractului de poveste și **evaluarea curentă** a textului final (etapa `critic_final` evaluează textul lustruit, fără rescriere). Siguranța rămâne separată (P5-T01) și nu intră în scor. Elementul „Evaluarea cărții” blochează poarta finală până trece; după o editare, „Reevaluează textul curent” rulează doar criticul.

## Reparații verificate

- Orice reparație este reverificată pe setul complet (inclusiv etapa nativă: `recheck` forțat sub v2; nicio „îmbunătățire după preferințe” fără recheck sub v2).
- O reparație nativă care introduce un defect determinist nou (calc, cuvânt netradus, nume schimbat, pagină goală) sau scade un criteriu este **regresie**: versiunea de dinainte se păstrează și regresia se consemnează în evaluare (`regressionRejected`).

## Dinosaur World

V1 se poate evalua proaspăt (citatele verificate pe textul existent), fără rescriere; DW își păstrează politica tipului său (v1); EN/RO comparate pe aceleași 12 pagini.
