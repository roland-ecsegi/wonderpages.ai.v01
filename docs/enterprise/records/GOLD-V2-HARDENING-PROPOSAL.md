# Gold v2 / Hardening — PROPUNERE (PROPOSAL ONLY)

**Stare: PROPUNERE, NEAPROBATĂ. Nimic din acest document nu este implementat sau început.** Nu s-a creat niciun caz, nu s-a
etichetat nimic și nu s-a modificat niciun evaluator, politică, prag sau gardă. Fiecare punct derivă din adjudecarea gold-v1
(`GS.md`, `GS-CLOSURE.md`), cu trimitere la observația (OBS-GS-n) sau la cazul care îl justifică. Ce nu poate fi trasat la o dovadă
adjudecată nu apare aici. Pragurile numerice și mecanismele (determinist sau bazat pe model) sunt **decizii ale operatorului**:
documentul le propune ca întrebări, nu ca alegeri făcute. Nu se folosesc servicii plătite și nu se publică nimic extern fără aprobare
explicită.

## 1. Ce ar trebui reparat în evaluatori

Ordinea: întâi ce e determinist și ieftin, apoi ce cere înțelegere semantică. Fiecare schimbare se face separat, e justificată de
cazuri adjudecate și se măsoară înainte/după, niciodată prin ajustare ascunsă (decizia operatorului de după cazul 3).

| # | Reparație | Justificare |
|---|---|---|
| E1 | Un motiv (cod de motiv plus mesaj pentru operator) pentru **fiecare** condiție de respingere activă: media, criteriu critic, minim pe criteriu, dovadă. Media exactă și cea afișată apar separat în raport. | OBS-GS-19: cazul 43 (v1 fără motiv, v2 cu motiv parțial); probele de la cazurile 39 și 42 |
| E2 | Semantica pragului: decizia pe valoarea exactă, rotunjirea doar la afișare (varianta A), sau contract explicit „rounded ≥ 8” (varianta B). **Alegerea e a operatorului.** | OBS-GS-19 (7,9556 → acceptat) |
| E3 | Validarea deterministă a formatului (număr de pagini față de blueprint; lungimea textului față de ghidul de vârstă, cu toleranța declarată), separat de nota criticului. | cazul 42 (T08) |
| E4 | Validarea dovezii la calitate: de la existență la **relevanță și suport**. Partea deterministă: semnalarea aceleiași dovezi folosite la mai multe criterii și a dovezii fără legătură cu criteriul. | OBS-GS-18 (aceeași frază pentru T01–T18) |
| E5 | Siguranță: context semantic în locul excepțiilor bazate pe expresii („cu un adult”); ordinea și relația acțiunilor; poziția narativă (promovat vs contestat); specia sau contextul personajului; intensitate și recuperare potrivite vârstei. | OBS-GS-1, 3, 4, 6, 8, 10 |
| E6 | Robustețe lingvistică: morfologie și lematizare (eats/eating), cuvinte intercalate, parafrază. | OBS-GS-7 (transversală) |
| E7 | Normalizare fără coliziuni semantice (diacritice); paritate EN ↔ RO verificată pe perechi. | OBS-GS-9 |
| E8 | Vârstă: potrivire multidimensională (dificultatea vocabularului ≠ lungimea cuvântului, sintaxă, abstracție, densitate, intensitate). | OBS-GS-11, OBS-GS-10 |
| E9 | Localizare: verificarea fidelității SOURCE ↔ TARGET (mutație, omisiune, adăugare); identificarea contextuală a limbii în locul listelor de cuvinte; tokenuri de conținut netraduse; naturalețe dincolo de catalogul de calcuri. | OBS-GS-13, 14 |
| E10 | Știință: identitatea entității plus atributele din canon (Character Bible) → relație → timp → modul lumii → afirmație → verdict cu motiv relațional; poziție narativă și fereastra de corectare. | OBS-GS-15, 16, 17; OBS-GS-7 |
| E11 | Garda de acceptare: să impună finalizarea etapei de hardening înainte de acceptarea finală. Azi verifică doar adjudecarea completă și potrivirea rapoartelor. | GS.md (nota după cazul 3); GS-CLOSURE §6 |

Pentru E5–E10 mecanismul nu se alege acum (OBS-GS-14: nicio bibliotecă de detecție a limbii, model sau alt mecanism nu e ales). Dacă
o soluție ar cere un model, asta e o decizie separată a operatorului, cu limitele contractului de furnizori. Nu se folosesc servicii
plătite și nici token-ul sesiunii cloud.

## 2. Ce ar trebui reparat în setul de aur

- **G1. Integritate:**
  - detecția automată a duplicatelor exacte și aproape exacte, prin hash pe stimul;
  - metadatele de temă și vârstă trebuie susținute de conținut;
  - nicio pseudo-acoperire prin etichete.
  - Justificare: OBS-GS-12 (21–24; 38/39 corelate; metadatele fără efect la calitate).
- **G2. Câmpuri pe caz** (o versiune nouă a schemei setului, propusă, nu aplicată): proprietatea testată, familia de reguli, axele
  de independență (stimul, temă, proprietate/tipar, regulă, conținut), proveniența etichetei (cine și când, independent de autorul
  evaluatorului). Justificare: OBS-GS-12, OBS-GS-20; taxonomia de la cazul 30.
- **G3. Cazuri de calitate cu conținut real.** Fiecare caz are textul lui, iar dovezile sunt citate relevante pentru fiecare criteriu.
  Notele trebuie justificate de conținut, nu introduse ca numere. Justificare: OBS-GS-18, OBS-GS-20.
- **G4. Echilibru pozitiv/negativ pe proprietate.** Controale pozitive pentru fiecare proprietate și pentru fiecare split. Justificare:
  știința are un singur pozitiv; vârsta nu are niciun pozitiv în setul rezervat (OBS-GS-12).
- **G5. Regresie pentru fiecare defect demonstrat.** Fiecare defect din GS-CLOSURE §5 devine cel puțin un caz de aur cu etichetă
  adjudecată. Probele de azi rămân dovezi și nu devin cazuri automat; devin cazuri doar după adjudecare.

## 3. Perechi minimale controlate care lipsesc

Fiecare pereche schimbă **o singură** variabilă. Mai jos sunt doar direcțiile; etichetele se stabilesc la adjudecare.

| Familie | Perechi | Justificare |
|---|---|---|
| Siguranță | acțiune periculoasă cu vs fără expresie de siguranță; aceeași acțiune în altă ordine sau relație; stereotip promovat vs contestat; tipar incluziv real vs folosit ca ocolire; personaj acvatic vs terestru în aceeași scenă; obiect periculos în sens literal vs metaforic | OBS-GS-1, 3, 4, 6, 8 |
| Lingvistic | forme flexionare (eats/eating/ate); cuvânt intercalat; parafrază cu același sens | OBS-GS-7 |
| Limbi | același stimul EN ↔ RO; perechi cu diacritice care se ciocnesc | OBS-GS-9 |
| Vârstă | cuvânt lung dar ușor vs cuvânt scurt dar dificil; aceeași lungime cu abstracție diferită | OBS-GS-11 |
| Localizare | token comun folosit cu sens românesc vs englezesc („are”); token de conținut netradus; mutație de sens; omisiune; adăugare nesusținută; traducere naturală dar neliterală; calc cunoscut vs calc nevăzut | OBS-GS-13, 14 |
| Știință | pterozaur→dinozaur vs pterozaur→reptilă zburătoare; pasăre→dinozaur; co-apariție vs coexistență; mit afirmat vs demontat vs corectat imediat sau târziu; formulare canonică vs parafrază; specia în propoziție vs doar în canon | OBS-GS-15, 16, 17 |
| Calitate | aceeași medie din distribuții diferite; un criteriu foarte slab ascuns de note mari; dovadă relevantă vs irelevantă pentru aceeași notă; dovadă refolosită la alt criteriu | OBS-GS-18, 20 |

## 4. Cazuri la frontieră care lipsesc

- **Pragurile de calitate**, cu conținut care justifică nota (nu numere arbitrare):
  - T01 și T08 la 7,9 / 8,0 / 8,1;
  - minimul pe criteriu la 6,9 / 7,0;
  - media exactă sub 8 care rotunjită devine 8,0 (note zecimale);
  - criteriu critic vs necritic la aceeași valoare.
  - Justificare: OBS-GS-19, 20; cazurile 40–44.
- **Vârstă:** media lungimii propozițiilor în jurul pragului benzii (3–4: 12,5) și al pragului cuvintelor lungi. Justificare: OBS-GS-11.
- **Localizare:** variante gramaticale ale calcurilor cunoscute; calcuri parțiale. Justificare: cazurile 27, 28, 31.
- **Știință:** simplificare potrivită vârstei vs afirmație falsă; referent ambiguu. Justificare: OBS-GS-15.

## 5. Acoperirea care lipsește

- Vârsta pe 5–6 și 7–8 și în română; un control pozitiv de vârstă în setul rezervat (OBS-GS-12, cazul 25).
- Toate instanțele regulilor universale: minimul pe criteriu pe mai multe criterii, nu doar T13 (OBS-GS-12, cazul 41).
- T07 „Safety and values” și relația cu poarta de siguranță (cazul 42).
- Concepte științifice și formulări noi; o regulă din catalog pe un caz negativ de aur pentru fiecare regulă (`moon-light` lipsește).
- Evaluarea la nivel de poveste (mai multe pagini), pe lângă nivelul de pagină (OBS-GS-17).
- Mai multe teme și pentru calitate; aici tema e azi doar o etichetă.

## 6. Coduri de motiv și explicabilitate care lipsesc

Denumirile de mai jos sunt ilustrative, nu un contract de API.

- La calitate, câte un cod pentru fiecare condiție activă: `QUALITY_MEAN_BELOW_THRESHOLD`, `QUALITY_CRITICAL_BELOW_THRESHOLD`,
  `QUALITY_CRITERION_BELOW_MINIMUM`, `QUALITY_EVIDENCE_NOT_FOUND`, plus valoarea obținută, pragul și criteriul (OBS-GS-19).
- La știință, un motiv relațional, nu „tokenul X găsit”. Exemplu: „entity Pip is canonically a pterosaur; pterosaurs are not dinosaurs”
  (OBS-GS-15, 16).
- La siguranță și localizare, motivul indică regula și fragmentul, iar raportul separă „verdict corect” de „motiv corect” (OBS-GS-2, 5).
- Pentru operator și Dali: fiecare blocaj conduce spre acțiune, adică ce condiție a eșuat și ce trebuie reparat (OBS-GS-19, cazul 43).

## 7. Decizii de politică pe care operatorul trebuie să le ia înainte de construcție

1. Semantica pragurilor: exact vs rotunjit (E2).
2. Un minim universal vs minime pe criteriu, clase de criterii sau minime care țin cont de aplicabilitate (OBS-GS-20, cazul 41).
3. T07: ce aparține porții de siguranță și ce rămâne în calitate; pragul T07 (cazul 42).
4. Concepția greșită corectată (pe aceeași pagină, mai târziu, ambiguu): PASS, REVIEW sau alt verdict; fereastra de corectare; unitatea
   de evaluare (OBS-GS-17).
5. Ce simplificări științifice sunt acceptabile pe vârste (OBS-GS-15).
6. Dacă evaluatorii semantici pot folosi modele: în ce condiții, cu ce furnizor, cu ce cost și cu ce limite (fără servicii plătite fără
   aprobare).
7. Cine adjudecă etichetele: doar operatorul sau și un al doilea evaluator uman; cum se rezolvă dezacordurile.
8. Numerele minime pe proprietate și pe split pentru criteriile de acceptare (§12).

## 8. Ce trebuie testat adversarial

- Familiile de ocolire demonstrate: expresii de siguranță, ordinea acțiunilor, tipare incluzive, adverbe intercalate, flexiuni,
  diacritice (OBS-GS-1, 3, 7, 9).
- Parafraze ale fiecărei concepții greșite din catalog și concepții necatalogate (OBS-GS-7, 17).
- Demontări și negații pentru fiecare regulă științifică (OBS-GS-17: reprodus pe 2 concepte).
- Tokenuri comune între EN și RO (OBS-GS-14).
- Răspunsuri de critic cu dovezi fabricate, irelevante, refolosite sau trunchiate (OBS-GS-18).
- Valori zecimale exact în jurul pragurilor (OBS-GS-19).
- Stimuli adversariali scriși de **alt autor** decât autorul regulilor (OBS-GS-20).

## 9. Separarea calibrării de setul rezervat

- Setul rezervat se definește **față de afirmația evaluată**, nu doar prin temă. Axele sunt: temă, proprietate, familie de reguli,
  concept nevăzut, parafrază nevăzută (OBS-GS-12, cazurile 31, 36, 44).
- Verificarea de contaminare se face și pe familia de reguli sau tipar, nu doar pe hash-ul stimulului.
- Setul rezervat se **sigilează** înainte de orice schimbare de evaluator: hash publicat în jurnal, conținut nevăzut de cel care ajustează.
- Setul rezervat se rulează o singură dată pe fiecare versiune de evaluator. Nimic nu se ajustează pe baza lui.
- Raportul arată calibrarea și setul rezervat separat, cu matricea de independență pentru fiecare caz rezervat.

## 10. Evitarea circularității

- Etichetele se stabilesc **orb**: operatorul etichetează conținutul înainte să vadă verdictul sistemului (OBS-GS-20; GOLD-SET.md
  prevede deja comparații oarbe).
- Rolurile se separă: autorul regulilor nu scrie singur etichetele cazurilor care îi testează regulile. Proveniența se consemnează pe caz.
- Cazurile de calitate pornesc de la conținut și judecată editorială, nu de la praguri. Pragurile se compară apoi cu etichetele, nu invers.
- Fiecare decizie de prag se consemnează ca decizie editorială a operatorului, separat de acordul politicii cu eticheta (cele trei
  întrebări din OBS-GS-20).

## 11. Demonstrarea generalizării reale

- Seturi rezervate pe proprietate: calcuri nevăzute, concepte științifice nevăzute, parafraze nevăzute, combinații noi de condiții.
- Perechi de paritate EN ↔ RO raportate separat.
- Raportare pe axe: formulare canonică vs parafrază, pozitiv vs negativ, limbă, vârstă, nivel de pagină vs nivel de poveste.
- Fiecare raport declară ce afirmații permite și ce afirmații nu permite (modelul din GS-CLOSURE §9–§10).
- Fără producție Dinosaur World și fără V1 Pilot în această etapă: setul rămâne sintetic sau referențiat, cu drepturile declarate.

## 12. Criterii de acceptare propuse pentru Gold v2

Numerele se stabilesc de operator (§7, punctul 8). Criteriile sunt propuse, nu decise.

1. 100% adjudecat prin jurnal append-only, cu proveniență; zero duplicate; verificările de integritate trec.
2. Pentru fiecare proprietate testată: minimum N pozitive și N negative în calibrare și minimum M în setul rezervat, plus perechi
   minimale și cazuri la frontieră pentru fiecare prag.
3. Setul rezervat e sigilat înainte de orice schimbare de evaluator; contaminarea pe familie de reguli e verificată.
4. Fiecare defect din GS-CLOSURE §5 are cel puțin un caz de regresie. Fiecare defect e fie reparat (demonstrat înainte/după), fie
   acceptat explicit de operator ca limită cunoscută.
5. Raționament: niciun NO în setul rezervat. Orice INCOMPLETE e justificat și consemnat. Explicația e completă, cu un motiv pentru
   fiecare condiție activă, la 100% din cazurile de calitate.
6. Pragurile sunt decise de operator înainte de rularea setului rezervat. Comparația v1/v2, sau a versiunii următoare, se raportează
   separat.
7. Raportul folosește formulări limitate la dovezi; afirmațiile interzise rămân interzise până când dovezile le susțin.
8. Acceptarea se face **doar de operator, în Enterprise Local**, iar garda impune finalizarea hardening-ului (E11).

## Ordinea propusă (dacă și când operatorul aprobă)

1. Deciziile de politică (§7).
2. Construcția Gold v2, cu setul rezervat sigilat.
3. Rularea evaluatorului actual pe Gold v2, ca bază care documentează defectele.
4. Reparații una câte una (§1), fiecare justificată și măsurată.
5. Rerularea calibrării.
6. O singură rulare a setului rezervat.
7. Raportul.
8. Acceptarea operatorului în Enterprise Local.

Nimic din această ordine nu începe fără aprobarea explicită a operatorului.
