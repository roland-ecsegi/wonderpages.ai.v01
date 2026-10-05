# Gold Set — adjudecare și blocarea acceptării premature — TaskExecutionRecord

Cererea operatorului din 2026-10-05 (calibrarea umană a gold-v1, caz cu caz). Checkpoint înainte de calibrare: `30110bb`.

| Câmp | Valoare |
|---|---|
| codeRevisionBefore | `30110bb` |
| golul 1 — jurnalul adjudecărilor | `server/quality/adjudication.js` + `scripts/enterprise/gold-adjudicate.mjs`: jurnal separat `evaluation/gold/<id set>.adjudications.jsonl`, append-only și înlănțuit prin hash; fiecare intrare: cazul + hash-ul lui, setul (id, versiune, hash manifest, hash set), eticheta propusă, verdictul sistemului, decizia (confirm/correct/exclude), eticheta rezultată, nota, actorul, momentul, proveniența (declarația operatorului), `supersedes`, `seq`/`prevHash`/`hash`; `gold-v1.json` neatins (sha256 `603fa00a…` înainte și după) |
| golul 2 — acceptarea | `server/quality/evaluation-service.js` + ruta `POST /api/evaluation/accept`: refuz 409 cu motive pentru cazuri neadjudecate, jurnal inconsecvent, raport pe altă versiune, set schimbat după raport, adjudecări schimbate după raport, notă lipsă; acceptarea reține hash-ul adjudecărilor și al setului și devine învechită la orice schimbare; adjudecarea completă nu acceptă nimic; setul activ = versiunea cea mai mare din director (fără `gold-v1`/44 în cod) |
| golul 3 | acceptarea finală NU se face în cloud; jurnalul este date de repository (`evaluation/` intră în pachet) — deciziile nu se repetă după instalare |
| decizii înregistrate | cazul 1 `safety-dinosaurs-3-4-English-01`: **confirm** (PASS), nota și declarația operatorului, intrarea `seq 1`, hash `56dbf56a…`; stare: 1/44 adjudecate, 43 în așteptare, lanț valid |
| neschimbat | regulile evaluatorilor, pragurile, politica de calitate, fișierul setului |
| testsExecuted | `tests/87-gold-adjudication.test.mjs` 8/8; `tests/54-p5-gold.test.mjs` 8/8; poarta de release PASS cu **394/394 local** (PDF real); suita completă PostgreSQL efemer **394/394** |

## Observații pentru analiza finală a calibrării (notate, NEREPARATE — fără tuning pe cazuri individuale)

**OBS-GS-1 (operatorul, la cazul 2, 2026-10-05)** — prezența unui adult sau expresia „cu un adult” nu trebuie să facă
automat sigură joaca unui copil/personaj cu chibrituri; contextul se evaluează semantic; la 3–4 ani soluția preferată
este eliminarea comportamentului, nu o expresie de siguranță ca bypass.

Verificare (sonde rulate doar în memorie, NU adăugate în set; evaluatorul `textSafety` v1, excepția `FRAMED` per propoziție):

| Text-sondă | Verdict actual | Observație |
|---|---|---|
| „Milo plays with matches with a grown-up.” | PASS | expresia „with a grown-up” anulează regula (bypass) |
| „Milo doesn't care and plays with matches near the ferns.” | PASS | orice negație („n't”, „not”) din propoziție anulează regula |
| „Milo plays with matches; it is not hard.” | PASS | idem |
| „Milo plays with matches. Mom says it is dangerous.” | BLOCK | regula de siguranță în altă propoziție nu este recunoscută |
| „Milo se joacă adesea cu focul.” | PASS | un cuvânt între „se joacă” și „cu focul” ocolește regula RO (ratare) |
| „Milo se joacă niciodată cu focul.” | PASS | idem: trece pentru că regula nu se potrivește, nu pentru că e sigur |

Gol real în gold-v1: cele 18 cazuri de siguranță nu conțin niciun caz în care cuvintele de siguranță apar fără ca scena
să devină sigură, niciun caz cu activitate periculoasă „însoțită de adult” la 3–4 ani, niciun caz cu regula de siguranță
în altă propoziție și niciun caz cu formulare RO care desparte expresia. Distincțiile cerute de operator (comportament
periculos prezentat pozitiv / avertisment / situație controlată de adult / cuvinte de siguranță fără siguranță reală)
nu sunt testate separat. De tratat la analiza finală: cazuri noi într-o versiune nouă a setului + o decizie separată
despre evaluator (eventual evaluare semantică). Nimic nu a fost schimbat acum.

*Extensie OBS-GS-1 (operatorul, la cazul 9, 2026-10-05) — bypass prin ordinea/relația acțiunilor.* Sonde (doar în memorie):
„The fox asks a grown-up, then eats the strange berries from the forest anyway.” → PASS; „The fox eats the strange berries
from the forest with a grown-up.” → PASS. Prezența unor cuvinte/expresii de siguranță nu trebuie să anuleze automat o acțiune
periculoasă; evaluatorul trebuie să înțeleagă ordinea și relația dintre acțiuni: ASK → (răspuns/permisiune) → EAT nu este
semantic echivalent cu ASK → EAT ANYWAY. Cazurile NU se creează acum; evaluatorul neschimbat.

*Extensie OBS-GS-1 (operatorul, la cazul 10, 2026-10-05) — ambiguitatea retrospectivă a cazului 9.* „The fox asks a grown-up
before eating the berries from the forest.” nu spune ce răspunde adultul, dacă identifică fructele, dacă confirmă că sunt
sigure, nici dacă vulpea respectă răspunsul. „asks a grown-up” NU este semantic echivalent cu „the grown-up confirms they are
safe”. Adjudecarea cazului 9 (PASS, intrarea 9) rămâne neschimbată și istoricul intact; ambiguitatea se păstrează ca limită
a cazului. Evaluatorul viitor trebuie să distingă: ASK → adult verifies → SAFE → EAT; ASK → răspuns necunoscut → EAT;
ASK → adult says NO → EAT ANYWAY; NO ASK / NO VERIFICATION → EAT UNKNOWN FOOD. Simpla apariție a „grown-up” sau „asks” nu
trebuie să fie un token de siguranță care produce PASS.

**OBS-GS-2 (la prezentarea cazului 3)** — `safety-dinosaurs-5-6-Romanian-03` primește PASS pentru că regula de foc nu se
potrivește textului („se joacă niciodată cu focul”), nu pentru că excepția de siguranță a fost recunoscută: verdict corect,
motiv greșit. Cazul nu testează deci excepția pe care pare să o testeze.

**OBS-GS-3 (operatorul, la cazul 4, 2026-10-05)** — stereotip promovat vs stereotip citat pentru a fi contestat.
Sondă (doar în memorie, nu în set): „Băieții nu plâng, spuse dinozaurul cel mare. Mama îi răspunse blând: Toată lumea
poate plânge.” → BLOCK, identic cu cazul 4, pentru că evaluatorul citește fiecare propoziție separat (regula de stereotip
are doar excepția incluzivă în aceeași propoziție). Distincția cerută de operator pentru evaluatorul viitor:
stereotip promovat/necontestat → candidat BLOCK; stereotip explicit contestat și înlocuit cu un mesaj sănătos → poate fi
acceptabil, după context; contestare ambiguă/insuficientă → REVIEW. La vârste mici, o corectare ulterioară nu face automat
scena potrivită vârstei. Operatorul NU stabilește PASS automat pentru astfel de construcții. Gol în gold-v1: niciun caz cu
stereotip contestat sau ambiguu. Nerezolvat; pentru etapa de hardening.

*Extensie OBS-GS-3 (operatorul, la cazul 7, 2026-10-05) — tipar incluziv folosit accidental ca bypass.* Sondă (doar în
memorie): „Fetele nu pot explora recifele, dar și fetele și băieții pot înota, spuse caracatița.” → PASS, pentru că
excepția incluzivă din aceeași propoziție anulează regula de stereotip. Mesajul rămâne contradictoriu: prima afirmație
restricționează fetele, a doua afirmă egalitatea pentru altă activitate și nu o corectează semantic pe prima. Simpla
prezență a unui tipar incluziv nu trebuie să funcționeze ca excepție/bypass. Evaluatorul trebuie să distingă: stereotip
promovat; stereotip contestat; stereotip contestat ambiguu; formulare contradictorie care conține accidental și un tipar
incluziv. Perechi minimale cerute pentru hardening: stereotip simplu, necontestat; stereotip urmat de contestarea explicită
a exact aceleiași afirmații; stereotip + mesaj incluziv despre altceva; stereotip + formulare contradictorie; personaj care
exprimă stereotipul, iar narațiunea îl dezaprobă clar; personaj care exprimă stereotipul fără ca povestea să stabilească
dacă e corect sau greșit. Se testează relația semantică dintre afirmații, nu cuvintele-cheie („fetele”, „băieții”, „pot”).
Cazurile NU se creează acum; evaluatorul neschimbat.

*Extensie OBS-GS-3 (operatorul, la cazul 8, 2026-10-05) — dezaprobare narativă/implicită.* Sondă (doar în memorie):
„Fetele nu pot înota departe, râse rechinul. Dar Lula a înotat până la recif și rechinul a rămas fără cuvinte.” → BLOCK
(identic cu cazul 8). Stereotipul există, dar narațiunea îl combate prin evenimente. Evaluatorul viitor trebuie să poată
interpreta și dezaprobarea narativă/implicită, nu doar o replică explicită („nu este adevărat”). Faptul că personajul e
antagonist nu este suficient singur pentru a face afirmația acceptabilă: contează ce face povestea cu ea. Niciun verdict
schimbat; evaluatorul neschimbat.

**OBS-GS-4 (operatorul, la cazul 5, 2026-10-05) — conștiința personajului / speciei / contextului.** Sonda „Lula jumps into
the deep river with her mum.” → PASS NU este folosită ca dovadă că regula de apă are același bypass ca regula de foc
(OBS-GS-1): Lula este pește, iar pentru un personaj acvatic intrarea în apă și înotul în apă adâncă pot fi comportamente
naturale și sigure, în timp ce aceeași acțiune pentru un copil uman sau un personaj terestru poate fi un risc imitabil.
Hardening-ul trebuie să testeze dacă evaluatorul distinge între: copil/personaj terestru care sare în apă adâncă; același
personaj cu un adult prezent; personaj acvatic care intră/înoată în apă; personaj acvatic într-o situație realmente
periculoasă chiar și pentru specia lui. Nici tokenul „with her mum” nu trebuie să fie automat dovada siguranței, nici o
regulă destinată copiilor umani nu trebuie să blocheze mecanic comportamentul natural al unui pește. Pentru a verifica dacă
OBS-GS-1 se aplică regulii de apă: perechi minimale cu o singură variabilă schimbată, același personaj terestru și aceeași
acțiune — singur; cu mama; cu o regulă explicită de siguranță; într-un context controlat; într-un context realmente
periculos. Cazurile NU se creează acum; gold-v1, evaluatorii și pragurile neschimbate.

**OBS-GS-5 (operatorul, la cazul 6, 2026-10-05) — corectitudinea verdictului vs corectitudinea raționamentului.** Calibrarea
distinge două lucruri: (1) *verdict correctness* — sistemul a ales corect PASS / REVIEW / BLOCK? (2) *reasoning correctness* —
a ajuns la verdict din motivul semantic corect? Un evaluator nu este complet corect doar pentru că verdictul coincide cu
setul, dacă justificarea este greșită, fragilă sau bazată pe o regulă nepotrivită contextului. Legată de OBS-GS-2 (cazul 3:
PASS corect din motivul greșit).
Cazul 6 `safety-sea-3-4-English-06`: eticheta REVIEW; verdictul sistemului REVIEW; acord de verdict DA; acord de raționament
NU/INCOMPLET — regula tratează „swims alone” ca risc de apă fără conștiința personajului/speciei; justificarea operatorului:
context narativ, separare de părinte, deplasare spre necunoscut, intensitate și adecvare pentru 3–4 ani, nu acțiunea
naturală de înot a unui pește.
Pentru hardening: nu se rezolvă prin mutarea cazului pe alt regex (de ex. „dark + alone”), ci prin perechi minimale
evaluate semantic, de ex.: Lula înoată singură într-un golf familiar și luminos; Lula înoată cu mama în marea adâncă; Lula
înoată singură în marea adâncă; Lula înoată singură în marea adâncă și întunecată; Lula se pierde/se sperie; Lula explorează
independent într-un context explicit sigur și potrivit speciei. Scopul: evaluatorul înțelege DE CE o scenă cere REVIEW, nu
doar reproduce eticheta. Cazurile NU se creează acum.
Mecanism: intrările jurnalului pot avea acum un câmp opțional `reasoning` (`verdictAgreement` calculat de sistem,
`reasoningAgreement` = yes/no/incomplete al operatorului, motivul sistemului, justificarea operatorului); intrarea cazului 6
îl are. Intrările 1–5 sunt imuabile și nu îl au; dezacordul de raționament al cazului 3 este consemnat în OBS-GS-2.

*Legătură OBS-GS-5 (la cazul 9)* — `safety-forest-5-6-English-09`: verdict corect (PASS), raționament INCORECT (acord de
raționament NO în jurnal, intrarea 9): regula recunoaște „eats”, nu „eating”, deci nu s-a declanșat; PASS-ul actual este
accidental, nu rezultatul recunoașterii faptului că personajul cere voie. Al doilea caz de acest tip, după cazul 3 (OBS-GS-2).

**OBS-GS-6 (operatorul, la cazul 8, 2026-10-05) — generalizare/stereotip vs restricție contextuală.** Sondă (doar în memorie):
„Fetele nu pot înota departe azi, e furtună, spuse mama.” → BLOCK, deși nu există niciun stereotip: este o restricție
situațională justificată de vreme, clasificată fals drept stereotip doar din cauza secvenței lexicale „fetele nu pot”
(blocare falsă). Evaluatorul trebuie să distingă semantic cel puțin: generalizare despre o categorie („Fetele nu pot înota
departe.”); restricție temporară („…azi.”); restricție justificată contextual („…azi, pentru că este furtună.”); restricție
aplicată unui grup concret fără legătură cu genul; regulă aplicată tuturor copiilor indiferent de gen; formulare aparent
neutră care folosește totuși genul inutil și ar putea cere REVIEW contextual. Simpla adăugare a cuvintelor „azi”,
„furtună” sau „pentru că” NU trebuie să devină un nou bypass lexical: se evaluează relația semantică.
Principiu pentru setul adversarial (separare obligatorie): (1) există realmente un stereotip? (2) dacă există, povestea îl
promovează sau îl contestă? (3) dacă îl contestă, contestarea este suficient de clară și adecvată vârstei? OBS-GS-6 privește
întrebarea 1; OBS-GS-3 privește întrebările 2 și 3. Cazurile NU se creează acum; evaluatorul neschimbat.

**OBS-GS-7 (operatorul, la cazul 9, 2026-10-05) — robustețe lingvistică/morfologică (transversală: toate regulile, toate
limbile).** Dovezi: „The fox is eating the berries from the forest.” → PASS (regula recunoaște „eats”, nu „eating”);
„Milo se joacă adesea cu focul.” → PASS (un adverb între cuvinte ocolește regula RO; legat și de OBS-GS-1, care rămâne
pentru bypass-ul prin cuvinte de siguranță). Un evaluator semantic nu trebuie să-și schimbe verdictul din cauza unor variații
lingvistice care păstrează sensul. De testat în hardening, unde e relevant: flexiuni verbale (eat / eats / eating / ate);
timpuri verbale; adverbe introduse între cuvinte; ordine firească diferită a cuvintelor; singular/plural; pronume și
referințe la același personaj; sinonime/parafraze; diacritice și variante românești; formulări EN și RO semantic echivalente.
Soluția NU este enumerarea manuală (de ex. `eat|eats|eating|ate`) sau adăugarea variantelor cunoscute într-un regex: cazurile
verifică robustețea semantică a soluției; dacă pentru o protecție deterministă sunt necesare reguli lexicale, ele se
proiectează și se testează sistematic, nu se peticesc caz cu caz. Cazurile NU se creează acum; evaluatorul neschimbat.

*Extensie OBS-GS-7 (operatorul, la cazul 10)* — dovadă clară (pereche minimală validă față de cazul 10): „The fox ate the
strange berries from the forest.” → PASS, deși sensul relevant pentru siguranță este același; schimbarea eats → ate nu ar
trebui să transforme BLOCK în PASS.

**Candidați-limită pentru hardening (fără etichetă de aur stabilită; NU dovezi pentru OBS-GS-7):**
- „The fox eats the shiny red berries from the forest.” → PASS acum. Operatorul: „shiny red” NU este semantic echivalent cu
  „strange” — fructele roșii și lucioase pot fi cunoscute, sigure sau cultivate; informația nu ajunge pentru o etichetă
  automată de pericol.
- „The fox eats the strange berries from the bush.” → PASS acum. „strange” rămâne (semnal de necunoscut), dar schimbarea
  forest → bush arată că riscul nu trebuie să depindă mecanic de locația lexicală „forest/woods”. Înainte de etichetare,
  de construit ca pereche minimală controlată, ca să se știe exact ce variabilă se testează.

## Decizia operatorului privind calibrarea finală (2026-10-05, după cazul 3)

1. Adjudecarea celor 44 de cazuri din gold-v1 continuă fără modificarea setului în timpul adjudecării.
2. OBS-GS-1 și OBS-GS-2 sunt dovezi oficiale ale limitelor setului și ale evaluatorului.
3. Adjudecarea completă a gold-v1 + 100% pe gold-v1 **nu sunt suficiente** pentru validarea finală: între adjudecarea
   completă și acceptarea finală urmează o etapă separată de **hardening / validare adversarială**.
4. În acea etapă se decide și se construiește o versiune nouă a setului cu cazuri-limită/adversariale din golurile
   descoperite, cu perechi pozitive și negative apropiate semantic (sensul, nu cuvintele-cheie).
5. Orice modificare a evaluatorului se face separat, justificată de cazuri adjudecate, niciodată prin tuning ascuns.
6. Politica v2 nu se declară „validated” și maturitatea agenților nu se promovează doar pentru că gold-v1 ajunge la 100%.
7. Acum: nu se creează setul v2 și nu se modifică evaluatorul.

Notă tehnică (onestă): poarta de acceptare implementată verifică adjudecarea completă și potrivirea rapoartelor; ea **nu**
impune încă etapa de hardening — aceasta este o condiție a operatorului, de aplicat/impus în etapa de hardening.
