/**
 * Core children's-book vocabulary EN ↔ RO (concepts, not translations) for the lexicon-bounded fidelity check
 * (OBS-GS-13). Each concept: EN lemmas, RO forms (diacritic-free exact words; `stem*` = prefix; multiword phrases allowed), and a type:
 *   action / object / quality  — counted for meaning change, omission and addition;
 *   light                      — light verbs and evaluative/abstract words used in idioms (have, make, time, good…),
 *                                never counted as omitted/added (avoids penalising natural, non-literal phrasing).
 * Coverage is deliberately bounded: words outside this list are NOT judged (the check reports what it could compare).
 * Built from generic categories (actions, animals, family, food, home, nature, body, colours, feelings), not from cases.
 */
const C = (id, type, en, ro) => ({ id, type, en: en.split('|'), ro: ro.split('|') });
export const CONCEPTS = [
  /* actions */
  C('find', 'action', 'find|discover', 'gaseste|gasesc|gasim|gasit|gasi|gaseau|descoper*'), C('lose', 'action', 'lose', 'pierde|pierd|pierdut|pierdu'),
  C('eat', 'action', 'eat', 'mananca|mananc|mancat|manca|mancam|mancau'), C('drink', 'action', 'drink', 'bea|beau|baut'), C('see', 'action', 'see|watch|look', 'vede|vad|vazut|privest*|priveste|priv*|se uita|se uit*'),
  C('give', 'action', 'give', 'da|dau|dat|dadu|darui*'), C('take', 'action', 'take|grab', 'ia|iau|luat|lua|apuca'), C('carry', 'action', 'carry|bring', 'duce|dus|aduce|adus|poarta|cara'),
  C('open', 'action', 'open', 'deschid*'), C('close', 'action', 'close|shut', 'inchid*'), C('run', 'action', 'run', 'alearg*|fug*'),
  C('walk', 'action', 'walk', 'merge|mers|plimb*'), C('jump', 'action', 'jump|hop', 'sare|sar|sarit|topa*'), C('swim', 'action', 'swim', 'inot*'), C('fly', 'action', 'fly', 'zboa*|zbur*'),
  C('sleep', 'action', 'sleep|nap', 'doarme|dorm|dormi|dormit|atipe*'), C('play', 'action', 'play', 'joaca|joc|jucat|juca|jucam|jucau'), C('sing', 'action', 'sing', 'canta|cant|cantat'), C('laugh', 'action', 'laugh', 'rade|rad|ras|rasul'),
  C('cry', 'action', 'cry|weep', 'plange|plang|plans'), C('hug', 'action', 'hug', 'imbratis*'), C('help', 'action', 'help', 'ajut*'), C('build', 'action', 'build', 'constru*'),
  C('climb', 'action', 'climb', 'urca|urc|urcat|catara|catar*'), C('draw', 'action', 'draw|paint', 'desen*|picte*'), C('read', 'action', 'read', 'citeste|citi|citit'), C('cook', 'action', 'cook|bake', 'gateste|gati|gatit|coace|copt'),
  C('wave', 'action', 'wave', 'face cu mana|facut cu mana|face semn|flutur*'), C('bark', 'action', 'bark', 'latra|latr*'), C('love', 'action', 'love|like', 'iubeste|iubi|iubit|place|placut'),
  C('say', 'light', 'say|tell|speak|talk', 'spune|spus|zice|zis|vorbest*'), C('have', 'light', 'have|get', 'are|avea|avut|au|am|ai|primest*'), C('make', 'light', 'make|do', 'face|fac|facut|facem|faceti'), C('be', 'light', 'be', 'este|e|era|sunt|fi|fost'),
  C('time', 'light', 'time|day|thing|way', 'timp|zi|ziua|lucru|fel'), C('good', 'light', 'good|nice|great|sense', 'bun|buna|frumos|grozav|sens'),
  /* animals */
  C('fox', 'object', 'fox', 'vulp*'), C('dog', 'object', 'dog|puppy', 'caine|cainele|caini|catel*'), C('cat', 'object', 'cat|kitten', 'pisic*'), C('crab', 'object', 'crab', 'crab*'), C('duck', 'object', 'duck', 'rata|rate|rata|ratusca|ratoi*'),
  C('bear', 'object', 'bear', 'urs*'), C('bird', 'object', 'bird', 'pasare|pasarea|pasari*|pasarica'), C('fish', 'object', 'fish', 'peste|pestele|pesti|pestis*'), C('rabbit', 'object', 'rabbit|bunny', 'iepur*'), C('mouse', 'object', 'mouse', 'soarec*|soricel*'),
  C('horse', 'object', 'horse', 'cal|calul|cai|caii'), C('cow', 'object', 'cow', 'vaca|vacile|vaci'), C('goat', 'object', 'goat', 'capra|capre|ied|iedul|iezi'), C('wolf', 'object', 'wolf', 'lup|lupul|lupi|lupii'), C('owl', 'object', 'owl', 'bufnit*'), C('frog', 'object', 'frog', 'broasca|broaste|broscut*'),
  C('dinosaur', 'object', 'dinosaur|dino', 'dinozaur*'), C('robot', 'object', 'robot', 'robot*'), C('butterfly', 'object', 'butterfly', 'flutur*'),
  /* people / family */
  C('grandma', 'object', 'grandma|grandmother|granny', 'bunica|bunici|bunicii'), C('mother', 'object', 'mum|mom|mother|mommy', 'mama|mami|mamei'), C('father', 'object', 'dad|father|daddy', 'tata|tati|tatal'),
  C('friend', 'object', 'friend', 'prieten*'), C('child', 'object', 'child|kid', 'copil|copilul|copii|copiii'), C('girl', 'object', 'girl', 'fata|fetita|fetele|fete'), C('boy', 'object', 'boy', 'baiat|baiatul|baieti|baietii'),
  /* food */
  C('apple', 'object', 'apple', 'mar|marul|mere|merele'), C('pear', 'object', 'pear', 'para|pere|perele'), C('banana', 'object', 'banana', 'banana|banane|bananele'), C('berry', 'object', 'berry', 'bace|fructe|fructele|fruct'), C('bread', 'object', 'bread', 'paine|painea'),
  C('cake', 'object', 'cake', 'tort|tortul|prajitur*'), C('milk', 'object', 'milk', 'lapte|laptele'), C('honey', 'object', 'honey', 'miere|mierea'), C('carrot', 'object', 'carrot', 'morcov*'),
  /* home / things */
  C('home', 'object', 'home|house', 'acasa|casa|casuta'), C('window', 'object', 'window', 'fereastra|ferestre|geam|geamul'), C('door', 'object', 'door', 'usa|usi'), C('bed', 'object', 'bed', 'pat|patul'), C('ball', 'object', 'ball', 'minge|mingea'),
  C('kite', 'object', 'kite', 'zmeu|zmeul'), C('book', 'object', 'book', 'carte|cartea|carti'), C('hat', 'object', 'hat', 'palarie|palaria|caciula'), C('box', 'object', 'box', 'cutie|cutia'), C('mat', 'object', 'mat|rug|carpet', 'covor|covorul|pres'),
  C('boat', 'object', 'boat|ship', 'barca|barci|nava|navei|corabie'), C('car', 'object', 'car', 'masina|masini'), C('toy', 'object', 'toy', 'jucari*'),
  /* nature */
  C('leaf', 'object', 'leaf', 'frunza|frunze|frunzele|frunzuli*'), C('tree', 'object', 'tree', 'copac*|pom|pomul'), C('flower', 'object', 'flower', 'floare|floarea|flori'), C('sun', 'object', 'sun', 'soare|soarele'), C('moon', 'object', 'moon', 'luna|lunii'),
  C('star', 'object', 'star', 'stea|steaua|stele|stelele'), C('rain', 'object', 'rain', 'ploua|ploaie|ploaia'), C('snow', 'object', 'snow', 'zapada|ninge'), C('river', 'object', 'river', 'rau|raul'), C('sea', 'object', 'sea|ocean', 'mare|marea|ocean*'),
  C('hill', 'object', 'hill', 'deal|dealul'), C('forest', 'object', 'forest|wood', 'padure|padurea'), C('park', 'object', 'park', 'parc|parcul'), C('rainbow', 'object', 'rainbow', 'curcubeu*'), C('stone', 'object', 'stone|rock', 'piatra|pietre'),
  C('garden', 'object', 'garden', 'gradina|gradini'), C('sky', 'object', 'sky', 'cer|cerul'), C('pond', 'object', 'pond|lake', 'balta|iaz|lac|lacul'),
  /* body */
  C('hand', 'object', 'hand', 'mana|mainile|maini'),
  /* qualities */
  C('happy', 'quality', 'happy|glad', 'fericit*|bucuros*|vesel*'), C('sad', 'quality', 'sad', 'trist*'), C('big', 'quality', 'big|large', 'mare|mari'), C('small', 'quality', 'small|little|tiny', 'mic|mica|mici|micut*'),
  C('red', 'quality', 'red', 'rosu|rosie|rosii'), C('blue', 'quality', 'blue', 'albastr*'), C('green', 'quality', 'green', 'verde|verzi'), C('yellow', 'quality', 'yellow', 'galben*')
];
