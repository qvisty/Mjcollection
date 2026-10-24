/* ============================================================
   MJ Vinylsamling — album-database
   Alle LP-udgivelser hvor Michael Jackson har medvirket.
   `wiki` er sidens titel på engelsk Wikipedia — bruges til at
   hente coverbilledet automatisk (se js/covers.js).
   ============================================================ */

const CATEGORIES = {
  studie:     { label: "Michael solo",     emoji: "🎤", color: "#e8b93c" },
  jackson5:   { label: "Jackson 5",        emoji: "✋", color: "#e0653a" },
  jacksons:   { label: "The Jacksons",     emoji: "👨‍👦‍👦", color: "#4fa3d1" },
  soundtrack: { label: "Soundtracks",      emoji: "🎬", color: "#8f6fd1" },
  opsamling:  { label: "Opsamlinger",      emoji: "💿", color: "#5bbd8b" },
  special:    { label: "Særudgivelser",    emoji: "✨", color: "#d15b9e" },
  duet:       { label: "Duetter",          emoji: "🤝", color: "#4fd1b5" },
};

/* Formater — LP'er og singler følges hver for sig, så begge dele
   har deres egen fremdrift at samle på */
const FORMATS = {
  lp:     { label: "Album", emoji: "💿", plural: "album" },
  single: { label: "Singler", emoji: "🎵", plural: "singler" },
};

/* Vejledende prisniveau for et brugt eksemplar i pæn stand.
   Det er et groft skøn ud fra oplagsstørrelse og hvor svær
   pladen er at opdrive — den rigtige dagspris står på Discogs,
   som der linkes til inde på hver plade. */
const PRICE_BANDS = {
  billig:    { label: "ca. 20-60 kr.",   hint: "Lommepenge-venlig" },
  lav:       { label: "ca. 60-150 kr.",  hint: "Nem at finde brugt" },
  mellem:    { label: "ca. 150-350 kr.", hint: "Dukker jævnligt op" },
  hoej:      { label: "ca. 350-800 kr.", hint: "Svær at finde" },
  megethoej: { label: "800 kr. og op",   hint: "Sjælden — undersøg prisen grundigt" },
};

/* Sjældenhed:
     rare:  true  → ✨ Sjælden (svær at opdrive)
     grail: true  → 💎 Hellig gral (de absolut sværeste — nærmest
                    umulige at finde; grail forudsætter rare) */

const ALBUMS = [
  /* ---------- Solo-studiealbum ---------- */
  { id: "got-to-be-there", price: "mellem", title: "Got to Be There", artist: "Michael Jackson", year: 1972, category: "studie", label: "Motown",
    wiki: "Got to Be There",
    desc: "Michaels allerførste soloalbum — han var kun 13 år, da det udkom!" },
  { id: "ben", price: "mellem", title: "Ben", artist: "Michael Jackson", year: 1972, category: "studie", label: "Motown",
    wiki: "Ben (album)",
    desc: "Titelsangen om rotten Ben blev Michaels første nummer 1-hit som solist." },
  { id: "music-and-me", price: "mellem", title: "Music & Me", artist: "Michael Jackson", year: 1973, category: "studie", label: "Motown",
    wiki: "Music & Me",
    desc: "Et blødt og fint album — på coveret sidder Michael med en akustisk guitar." },
  { id: "forever-michael", price: "mellem", title: "Forever, Michael", artist: "Michael Jackson", year: 1975, category: "studie", label: "Motown",
    wiki: "Forever, Michael",
    desc: "Michaels sidste studiealbum for Motown, med hittet \"Just a Little Bit of You\"." },
  { id: "off-the-wall", price: "lav", title: "Off the Wall", artist: "Michael Jackson", year: 1979, category: "studie", label: "Epic",
    wiki: "Off the Wall (album)",
    desc: "Det første album med Quincy Jones — disco-mesterværket der gjorde Michael til superstjerne." },
  { id: "thriller", price: "lav", title: "Thriller", artist: "Michael Jackson", year: 1982, category: "studie", label: "Epic",
    wiki: "Thriller (album)", rare: false,
    desc: "Verdens bedst sælgende album nogensinde! Beat It, Billie Jean, Thriller — hit efter hit." },
  { id: "bad", price: "lav", title: "Bad", artist: "Michael Jackson", year: 1987, category: "studie", label: "Epic",
    wiki: "Bad (album)",
    desc: "Fem singler fra samme album gik nummer 1 i USA — det var aldrig sket før." },
  { id: "dangerous", price: "mellem", title: "Dangerous", artist: "Michael Jackson", year: 1991, category: "studie", label: "Epic",
    wiki: "Dangerous (Michael Jackson album)",
    desc: "Med det vilde, detaljerede cover malet af kunstneren Mark Ryden. \"Black or White\" og \"Remember the Time\"." },
  { id: "history", price: "hoej", title: "HIStory: Past, Present and Future, Book I", artist: "Michael Jackson", year: 1995, category: "studie", label: "Epic",
    wiki: "HIStory",
    desc: "Kæmpe dobbeltalbum: én plade med hits og én med helt nye sange som \"Earth Song\"." },
  { id: "invincible", price: "hoej", title: "Invincible", artist: "Michael Jackson", year: 2001, category: "studie", label: "Epic",
    wiki: "Invincible (Michael Jackson album)",
    desc: "Michaels sidste studiealbum — udkom med cover i fem forskellige farver. Kan du samle dem alle?" },
  { id: "michael", price: "lav", title: "Michael", artist: "Michael Jackson", year: 2010, category: "studie", label: "Epic",
    wiki: "Michael (album)",
    desc: "Det første album udgivet efter Michaels død, med sangen \"Hold My Hand\" sammen med Akon." },
  { id: "xscape", price: "lav", title: "Xscape", artist: "Michael Jackson", year: 2014, category: "studie", label: "Epic",
    wiki: "Xscape (album)",
    desc: "\"Love Never Felt So Good\" med Justin Timberlake blev et kæmpehit — 32 år efter den blev indspillet." },

  /* ---------- Jackson 5 ---------- */
  { id: "diana-ross-presents", price: "mellem", title: "Diana Ross Presents the Jackson 5", artist: "The Jackson 5", year: 1969, category: "jackson5", label: "Motown",
    wiki: "Diana Ross Presents the Jackson 5",
    desc: "Debutalbummet! Med \"I Want You Back\" — Michael var bare 11 år." },
  { id: "abc", price: "mellem", title: "ABC", artist: "The Jackson 5", year: 1970, category: "jackson5", label: "Motown",
    wiki: "ABC (The Jackson 5 album)",
    desc: "\"ABC\" og \"The Love You Save\" skubbede begge The Beatles ned fra førstepladsen." },
  { id: "third-album", price: "mellem", title: "Third Album", artist: "The Jackson 5", year: 1970, category: "jackson5", label: "Motown",
    wiki: "Third Album",
    desc: "Med den smukke ballade \"I'll Be There\" — deres fjerde nummer 1-hit i træk." },
  { id: "christmas-album", price: "mellem", title: "Jackson 5 Christmas Album", artist: "The Jackson 5", year: 1970, category: "jackson5", label: "Motown",
    wiki: "Jackson 5 Christmas Album",
    desc: "Julealbummet med \"Santa Claus Is Comin' to Town\" — perfekt til december!" },
  { id: "maybe-tomorrow", price: "mellem", title: "Maybe Tomorrow", artist: "The Jackson 5", year: 1971, category: "jackson5", label: "Motown",
    wiki: "Maybe Tomorrow (The Jackson 5 album)",
    desc: "Med \"Never Can Say Goodbye\" — en af gruppens allersmukkeste sange." },
  { id: "goin-back-to-indiana", price: "mellem", title: "Goin' Back to Indiana", artist: "The Jackson 5", year: 1971, category: "jackson5", label: "Motown",
    wiki: "Goin' Back to Indiana",
    desc: "Soundtrack til deres eget tv-show — hjem til Indiana, hvor det hele startede." },
  { id: "lookin-through-the-windows", price: "mellem", title: "Lookin' Through the Windows", artist: "The Jackson 5", year: 1972, category: "jackson5", label: "Motown",
    wiki: "Lookin' Through the Windows",
    desc: "Brødrene begyndte at lyde mere voksne — med den flotte titelsang." },
  { id: "skywriter", price: "mellem", title: "Skywriter", artist: "The Jackson 5", year: 1973, category: "jackson5", label: "Motown",
    wiki: "Skywriter",
    desc: "Med et flyvemaskine-cover! Indeholder hittet \"Hallelujah Day\"." },
  { id: "git-get-it-together", price: "mellem", title: "G.I.T.: Get It Together", artist: "The Jackson 5", year: 1973, category: "jackson5", label: "Motown",
    wiki: "G.I.T.: Get It Together",
    desc: "Funky og psykedelisk — med \"Dancing Machine\", hvor Michael lavede robot-dansen på tv." },
  { id: "dancing-machine", price: "mellem", title: "Dancing Machine", artist: "The Jackson 5", year: 1974, category: "jackson5", label: "Motown",
    wiki: "Dancing Machine (album)",
    desc: "Opkaldt efter kæmpehittet — Jackson 5 i fuld disco-fart." },
  { id: "moving-violation", price: "mellem", title: "Moving Violation", artist: "The Jackson 5", year: 1975, category: "jackson5", label: "Motown",
    wiki: "Moving Violation",
    desc: "Det sidste rigtige studiealbum som \"Jackson 5\", inden de skiftede navn og pladeselskab." },
  { id: "joyful-jukebox-music", price: "hoej", title: "Joyful Jukebox Music", artist: "The Jackson 5", year: 1976, category: "jackson5", label: "Motown", rare: true,
    wiki: "Joyful Jukebox Music",
    desc: "Udgivet af Motown efter brødrene var rejst — svær at finde og et rigtigt samlerfund!" },
  { id: "boogie", price: "megethoej", title: "Boogie", artist: "The Jacksons 5", year: 1979, category: "jackson5", label: "Motown", rare: true, grail: true,
    wiki: "Boogie (album)",
    desc: "En af de allersjældneste Jackson-plader overhovedet — kun få eksemplarer blev solgt. Den ultimative jagt!" },
  { id: "greatest-hits-j5", price: "lav", title: "Greatest Hits", artist: "The Jackson 5", year: 1971, category: "jackson5", label: "Motown",
    wiki: "Greatest Hits (Jackson 5 album)",
    desc: "Den første store hit-samling — alle de tidlige klassikere på én plade." },
  { id: "in-japan", price: "hoej", title: "In Japan!", artist: "The Jackson 5", year: 1973, category: "jackson5", label: "Motown", rare: true,
    wiki: "In Japan!",
    desc: "Livealbum fra Japan — udkom oprindeligt kun i Japan og er et sjældent samlerobjekt." },

  /* ---------- The Jacksons ---------- */
  { id: "the-jacksons", price: "mellem", title: "The Jacksons", artist: "The Jacksons", year: 1976, category: "jacksons", label: "Epic",
    wiki: "The Jacksons (album)",
    desc: "Nyt navn, nyt pladeselskab — med discohittet \"Enjoy Yourself\"." },
  { id: "goin-places", price: "mellem", title: "Goin' Places", artist: "The Jacksons", year: 1977, category: "jacksons", label: "Epic",
    wiki: "Goin' Places (The Jacksons album)",
    desc: "Med ballonfærd på coveret — lavet sammen med soul-legenderne Gamble & Huff." },
  { id: "destiny", price: "lav", title: "Destiny", artist: "The Jacksons", year: 1978, category: "jacksons", label: "Epic",
    wiki: "Destiny (The Jacksons album)",
    desc: "Brødrene skrev selv sangene — med \"Blame It on the Boogie\" og \"Shake Your Body\"." },
  { id: "triumph", price: "lav", title: "Triumph", artist: "The Jacksons", year: 1980, category: "jacksons", label: "Epic",
    wiki: "Triumph (The Jacksons album)",
    desc: "\"Can You Feel It\" åbner albummet — en af gruppens mest episke sange." },
  { id: "the-jacksons-live", price: "mellem", title: "The Jacksons Live!", artist: "The Jacksons", year: 1981, category: "jacksons", label: "Epic",
    wiki: "The Jacksons Live!",
    desc: "Dobbelt-livealbum fra Triumph-turnéen — hør publikum skrige til \"Don't Stop 'Til You Get Enough\"." },
  { id: "victory", price: "lav", title: "Victory", artist: "The Jacksons", year: 1984, category: "jacksons", label: "Epic",
    wiki: "Victory (The Jacksons album)",
    desc: "Alle seks brødre samlet — med \"State of Shock\", hvor Michael synger duet med Mick Jagger." },
  { id: "2300-jackson-street", price: "mellem", title: "2300 Jackson Street", artist: "The Jacksons", year: 1989, category: "jacksons", label: "Epic",
    wiki: "2300 Jackson Street",
    desc: "Opkaldt efter barndomshjemmets adresse. Michael er med på titelsangen sammen med hele familien." },

  /* ---------- Soundtracks ---------- */
  { id: "the-wiz", price: "mellem", title: "The Wiz", artist: "Diverse (med Michael Jackson)", year: 1978, category: "soundtrack", label: "MCA",
    wiki: "The Wiz (soundtrack)",
    desc: "Fra filmen hvor Michael spiller Fugleskræmslet — \"Ease on Down the Road\" med Diana Ross." },
  { id: "et-storybook", price: "megethoej", title: "E.T. the Extra-Terrestrial", artist: "Michael Jackson", year: 1982, category: "soundtrack", label: "MCA", rare: true, grail: true,
    wiki: "E.T. the Extra-Terrestrial (soundtrack)",
    desc: "Michael fortæller historien om E.T. og synger \"Someone in the Dark\". Blev trukket tilbage — meget sjælden!" },
  { id: "this-is-it", price: "mellem", title: "This Is It", artist: "Michael Jackson", year: 2009, category: "soundtrack", label: "Epic",
    wiki: "This Is It (Michael Jackson album)",
    desc: "Musikken fra filmen om Michaels sidste koncertforberedelser — med den usungne titelsang." },

  /* ---------- Opsamlinger ---------- */
  { id: "best-of-mj", price: "mellem", title: "The Best of Michael Jackson", artist: "Michael Jackson", year: 1975, category: "opsamling", label: "Motown",
    wiki: "The Best of Michael Jackson",
    desc: "Den første solo-opsamling — alle de tidlige Motown-hits samlet." },
  { id: "anthology", price: "mellem", title: "Anthology", artist: "Michael Jackson", year: 1976, category: "opsamling", label: "Motown",
    wiki: "Anthology (Michael Jackson album)",
    desc: "Stor 3-LP-boks med de bedste Motown-år — flot i reolen!" },
  { id: "one-day-in-your-life", price: "lav", title: "One Day in Your Life", artist: "Michael Jackson", year: 1981, category: "opsamling", label: "Motown",
    wiki: "One Day in Your Life (album)",
    desc: "Motown udgav den, da Michael var blevet kæmpestjerne — titelsangen gik nummer 1 i England." },
  { id: "18-greatest-hits", price: "lav", title: "18 Greatest Hits", artist: "Michael Jackson & The Jackson 5", year: 1983, category: "opsamling", label: "Telstar",
    wiki: "18 Greatest Hits",
    desc: "Lå nummer 1 i England i hele 3 uger midt i Thriller-feberen i 1983." },
  { id: "essential", price: "mellem", title: "The Essential Michael Jackson", artist: "Michael Jackson", year: 2005, category: "opsamling", label: "Epic",
    wiki: "The Essential Michael Jackson",
    desc: "Hele karrieren på én udgivelse — fra \"I Want You Back\" til \"You Rock My World\"." },
  { id: "scream", price: "mellem", title: "Scream", artist: "Michael Jackson", year: 2017, category: "opsamling", label: "Epic",
    wiki: "Scream (Michael Jackson album)",
    desc: "Halloween-samling med de uhyggelige hits — vinyludgaven selvlyser i mørke!" },

  /* ---------- Særudgivelser ---------- */
  { id: "blood-on-the-dance-floor", price: "hoej", title: "Blood on the Dance Floor: HIStory in the Mix", artist: "Michael Jackson", year: 1997, category: "special", label: "Epic",
    wiki: "Blood on the Dance Floor: HIStory in the Mix",
    desc: "Verdens bedst sælgende remixalbum — med fem helt nye sange, bl.a. \"Blood on the Dance Floor\"." },
  { id: "farewell-my-summer-love", price: "lav", title: "Farewell My Summer Love", artist: "Michael Jackson", year: 1984, category: "special", label: "Motown",
    wiki: "Farewell My Summer Love",
    desc: "Gamle, glemte optagelser fra 1973, som Motown fandt i arkivet og udgav under Thriller-feberen." },
  { id: "looking-back-to-yesterday", price: "hoej", title: "Looking Back to Yesterday", artist: "Michael Jackson", year: 1986, category: "special", label: "Motown", rare: true,
    wiki: "Looking Back to Yesterday",
    desc: "Endnu en skattekiste af uudgivne Motown-optagelser — svær at støve op i dag." },
  { id: "original-soul", price: "mellem", title: "The Original Soul of Michael Jackson", artist: "Michael Jackson", year: 1987, category: "special", label: "Motown",
    wiki: "The Original Soul of Michael Jackson",
    desc: "Motowns svar på Bad — de bedste tidlige soul-numre i nyt udvalg." },
  { id: "thriller-25", price: "mellem", title: "Thriller 25", artist: "Michael Jackson", year: 2008, category: "special", label: "Epic",
    wiki: "Thriller 25",
    desc: "Jubilæumsudgaven med nye duetter — bl.a. \"The Girl Is Mine 2008\" med will.i.am." },
  { id: "bad-25", price: "hoej", title: "Bad 25", artist: "Michael Jackson", year: 2012, category: "special", label: "Epic",
    wiki: "Bad 25",
    desc: "Stor jubilæumsboks med demoer og ikke tidligere udgivne sange fra Bad-tiden." },
];

/* ============================================================
   Samler-niveauer — jo flere plader, jo sejere titel!
   ============================================================ */

const LEVELS = [
  { min: 0,   emoji: "🎧", title: "Ny i klubben" },
  { min: 1,   emoji: "🌱", title: "Pladespirer" },
  { min: 5,   emoji: "💿", title: "Vinyl-ven" },
  { min: 12,  emoji: "🎶", title: "Rigtig samler" },
  { min: 25,  emoji: "🕺", title: "Moonwalker i træning" },
  { min: 40,  emoji: "🧟", title: "Thriller-jæger" },
  { min: 60,  emoji: "🎩", title: "Vinyl-mester" },
  { min: 85,  emoji: "🌟", title: "Levende legende" },
  { min: 110, emoji: "🏛️", title: "Hall of Fame" },
  { min: 137, emoji: "👑", title: "KING OF POP" },
];

/* Michaels livsfase, da pladen udkom (født 29. august 1958) */
function mjPhase(year) {
  if (year <= 1970) return "barn";   // 11-12 år
  if (year <= 1977) return "teen";   // 13-19 år
  if (year <= 1989) return "ung";    // 20-31 år — verdensstjernen
  if (year <= 2001) return "konge";  // 32-43 år — King of Pop
  return "evig";                     // arven — for evigt ung
}

const PHASE_LABELS = {
  barn: "Barnestjernen (11-12 år)",
  teen: "Teenageren (13-19 år)",
  ung: "Verdensstjernen (20'erne)",
  konge: "King of Pop (30'erne og 40'erne)",
  evig: "For evigt ung (arven)",
};

/* ============================================================
   Milepæle (badges) — det motiverende lag!
   `test(stats)` afgør om badgen er optjent.
   `progress(stats)` returnerer [nu, mål] til statuslinjen.
   `group` styrer, hvilken sektion badgen vises i.
   ============================================================ */

const ACHIEVEMENT_GROUPS = {
  samling: "📀 Samlingen vokser",
  rejse: "🎂 Michaels rejse",
  trofae: "🏆 Store trofæer",
  tema: "🎨 Temajagt",
  singler: "🎵 Singlejagten",
  flid: "✍️ Flid og kærlighed",
};

const ACHIEVEMENTS = [
  /* --- 📀 Samlingen vokser --- */
  { id: "first", group: "samling", emoji: "🎉", title: "Den første plade!",
    desc: "Føj din allerførste LP til samlingen.",
    progress: s => [Math.min(s.owned, 1), 1] },
  { id: "five", group: "samling", emoji: "🌟", title: "Godt i gang",
    desc: "Saml 5 album.",
    progress: s => [Math.min(s.owned, 5), 5] },
  { id: "ten", group: "samling", emoji: "💿", title: "Rigtig samler",
    desc: "Saml 10 album.",
    progress: s => [Math.min(s.owned, 10), 10] },
  { id: "twentyfive", group: "samling", emoji: "🕺", title: "Superfan",
    desc: "Saml 25 album.",
    progress: s => [Math.min(s.owned, 25), 25] },
  { id: "half", group: "samling", emoji: "🚀", title: "Halvvejs!",
    desc: "Ej halvdelen af alle album på listen.",
    progress: s => [s.owned, Math.ceil(s.total / 2)] },
  { id: "complete", group: "samling", emoji: "🏆", title: "Alle album i hus!",
    desc: "Ej samtlige 49 LP'er på listen. Vildt!",
    progress: s => [s.owned, s.total] },

  /* --- 🎂 Michaels rejse (hans alder på pladerne) --- */
  { id: "thirteen", group: "rejse", emoji: "🎤", title: "13 år og verdensstjerne",
    desc: "Ej Got to Be There — Michaels første soloalbum, indspillet da han var 13.",
    needsAlbums: ["got-to-be-there"] },
  { id: "origin", group: "rejse", emoji: "🌱", title: "Hvor det hele begyndte",
    desc: "Ej debutpladen Diana Ross Presents the Jackson 5 fra 1969 — Michael var 11 år!",
    needsAlbums: ["diana-ross-presents"] },
  { id: "lilmichael", group: "rejse", emoji: "👦", title: "Lille Michael",
    desc: "Ej en plade fra før Michael fyldte 13 (1969-1970).",
    progress: s => [Math.min(s.phases.barn || 0, 1), 1] },
  { id: "teenidol", group: "rejse", emoji: "🕶️", title: "Teen-idol",
    desc: "Saml 3 plader fra Michaels teenageår (1971-1977).",
    progress: s => [Math.min(s.phases.teen || 0, 3), 3] },
  { id: "lifejourney", group: "rejse", emoji: "🎂", title: "Hele rejsen",
    desc: "Ej mindst én plade fra hver af Michaels fem livsfaser — fra barnestjerne til for evigt ung.",
    progress: s => [s.phasesCovered, 5] },
  { id: "decademaster", group: "rejse", emoji: "🗓️", title: "Årti-mesteren",
    desc: "Ej mindst én plade fra hvert årti: 60'erne, 70'erne, 80'erne, 90'erne, 00'erne og 10'erne.",
    progress: s => [s.decadesOwned, 6] },

  /* --- 🏆 Store trofæer --- */
  { id: "thrillernight", group: "trofae", emoji: "🧟", title: "Thriller Night",
    desc: "Ej verdens bedst sælgende album: Thriller.",
    needsAlbums: ["thriller"] },
  { id: "kingofpop", group: "trofae", emoji: "👑", title: "King of Pop",
    desc: "Ej de fire store: Off the Wall, Thriller, Bad og Dangerous.",
    needsAlbums: ["off-the-wall", "thriller", "bad", "dangerous"] },
  { id: "glove", group: "trofae", emoji: "🧤", title: "Den hvide handske",
    desc: "Ej alle 12 solo-studiealbum.",
    needsCategory: "studie" },
  { id: "motownstar", group: "trofae", emoji: "✋", title: "Motown-stjerne",
    desc: "Saml 5 Jackson 5-plader.",
    progress: s => [Math.min(s.byCategory.jackson5 || 0, 5), 5] },
  { id: "motownmaster", group: "trofae", emoji: "🎩", title: "Motown-mester",
    desc: "Ej alle Jackson 5-plader.",
    needsCategory: "jackson5" },
  { id: "familyband", group: "trofae", emoji: "👨‍👦‍👦", title: "Familiebandet",
    desc: "Ej alle plader af The Jacksons.",
    needsCategory: "jacksons" },
  { id: "moviestar", group: "trofae", emoji: "🎬", title: "Filmstjernen",
    desc: "Ej alle soundtracks — The Wiz, E.T. og This Is It.",
    needsCategory: "soundtrack" },
  { id: "anthologist", group: "trofae", emoji: "📚", title: "Opsamleren",
    desc: "Ej alle opsamlingsplader.",
    needsCategory: "opsamling" },
  { id: "specialist", group: "trofae", emoji: "✨", title: "Specialisten",
    desc: "Ej alle særudgivelser — remixer, jubilæer og skjulte skatte.",
    needsCategory: "special" },
  { id: "treasure", group: "trofae", emoji: "🗺️", title: "Skattejæger",
    desc: "Find en af de sjældne plader (markeret med ✨).",
    progress: s => [Math.min(s.rareOwned, 1), 1] },
  { id: "grail", group: "trofae", emoji: "💎", title: "Den hellige gral",
    desc: "Ej en af de to allersjældneste plader — Boogie eller E.T. Det lykkes kun for de færreste samlere!",
    progress: s => [Math.min(s.grailOwned, 1), 1] },
  { id: "moonwalker", group: "trofae", emoji: "🌙", title: "Moonwalker",
    desc: "Find 3 sjældne plader. Du er en ægte pladejæger!",
    progress: s => [Math.min(s.rareOwned, 3), 3] },

  /* --- 🎨 Temajagt (ord og temaer der går igen) --- */
  { id: "dancefloor", group: "tema", emoji: "🪩", title: "Dansegulvet",
    desc: "Ej begge plader med dans i titlen: Dancing Machine og Blood on the Dance Floor.",
    needsAlbums: ["dancing-machine", "blood-on-the-dance-floor"] },
  { id: "wildfriends", group: "tema", emoji: "🐀", title: "Vilde venner",
    desc: "Ej Ben (om en rotte) og E.T. (om en rumven) — Michaels to mest usædvanlige venskaber.",
    needsAlbums: ["ben", "et-storybook"] },
  { id: "xmas", group: "tema", emoji: "🎄", title: "Jackson-jul",
    desc: "Ej Jackson 5 Christmas Album — december bliver aldrig det samme igen.",
    needsAlbums: ["christmas-album"] },
  { id: "livewire", group: "tema", emoji: "🎸", title: "Live og direkte",
    desc: "Ej begge livealbum: The Jacksons Live! og In Japan!",
    needsAlbums: ["the-jacksons-live", "in-japan"] },
  { id: "seventies", group: "tema", emoji: "🕰️", title: "70'er-fan",
    desc: "Saml 10 plader fra 1970'erne.",
    progress: s => [Math.min(s.byDecade[1970] || 0, 10), 10] },
  { id: "eighties", group: "tema", emoji: "📼", title: "80'er-ikon",
    desc: "Saml 5 plader fra 1980'erne.",
    progress: s => [Math.min(s.byDecade[1980] || 0, 5), 5] },
  { id: "nineties", group: "tema", emoji: "📟", title: "90'er-holdet",
    desc: "Ej alle plader fra 1990'erne.",
    progress: s => [s.byDecade[1990] || 0, s.decadeTotals[1990] || 0] },

  /* --- 🎵 Singlejagten (billige fund, hurtige sejre) --- */
  { id: "s-first", group: "singler", emoji: "🎵", title: "Første single",
    desc: "Find din allerførste 7\"-single. De koster ofte under 50 kr.!",
    progress: s => [Math.min(s.singlesOwned, 1), 1] },
  { id: "s-ten", group: "singler", emoji: "📀", title: "Singlebunken",
    desc: "Saml 10 singler.",
    progress: s => [Math.min(s.singlesOwned, 10), 10] },
  { id: "s-thirty", group: "singler", emoji: "🎚️", title: "Jukeboksen",
    desc: "Saml 30 singler — nok til en hel aften med musik.",
    progress: s => [Math.min(s.singlesOwned, 30), 30] },
  { id: "s-all", group: "singler", emoji: "🥇", title: "Alle singler i hus!",
    desc: "Ej samtlige singler på listen. Det er en bedrift!",
    progress: s => [s.singlesOwned, s.singlesTotal] },
  { id: "s-thriller", group: "singler", emoji: "🧟", title: "Thriller-syvtommerne",
    desc: "Ej alle syv singler fra Thriller-albummet.",
    needsAlbums: ["s-the-girl-is-mine", "s-billie-jean", "s-beat-it",
                  "s-wanna-be-startin-somethin", "s-human-nature",
                  "s-p-y-t-pretty-young-thing", "s-thriller"] },
  { id: "s-number1", group: "singler", emoji: "1️⃣", title: "Nummer 1-samlingen",
    desc: "Ej fire af de største hits som singler: Billie Jean, Beat It, Bad og Black or White.",
    needsAlbums: ["s-billie-jean", "s-beat-it", "s-bad", "s-black-or-white"] },
  { id: "s-duet", group: "singler", emoji: "🤝", title: "Duet-makkeren",
    desc: "Ej alle duet- og samarbejdssinglerne — bl.a. med Paul McCartney og Diana Ross.",
    needsCategory: "duet", format: "single" },
  { id: "s-j5", group: "singler", emoji: "✋", title: "Motown-syvtommere",
    desc: "Saml 10 Jackson 5-singler.",
    progress: s => [Math.min(s.singlesByCategory.jackson5 || 0, 10), 10] },
  { id: "s-both", group: "singler", emoji: "🔗", title: "Album og single",
    desc: "Ej både LP'en Thriller og singlen Billie Jean.",
    needsAlbums: ["thriller", "s-billie-jean"] },

  /* --- ✍️ Flid og kærlighed (brug siden!) --- */
  { id: "wishmaker", group: "flid", emoji: "⭐", title: "Ønskejagten",
    desc: "Giv 3 plader ønske-stjerner, så du ved, hvad du jagter.",
    progress: s => [Math.min(s.wishlisted, 3), 3] },
  { id: "wish10", group: "flid", emoji: "🌠", title: "Ønskebrønden",
    desc: "Hav 10 plader på ønskelisten på samme tid.",
    progress: s => [Math.min(s.wishlisted, 10), 10] },
  { id: "dream", group: "flid", emoji: "💭", title: "Drømmepladen",
    desc: "Markér en plade med ⭐⭐⭐ — dit allerhøjeste ønske.",
    progress: s => [Math.min(s.dreamMarked, 1), 1] },
  { id: "notes", group: "flid", emoji: "✍️", title: "Pladenørden",
    desc: "Skriv en bemærkning på en plade — fx hvor du fandt den, eller hvor du har set den til salg.",
    progress: s => [Math.min(s.withNotes, 1), 1] },
  { id: "notes5", group: "flid", emoji: "📖", title: "Historiefortælleren",
    desc: "Skriv bemærkninger på 5 plader.",
    progress: s => [Math.min(s.withNotes, 5), 5] },
  { id: "notes15", group: "flid", emoji: "📚", title: "Pladebibliotekaren",
    desc: "Skriv bemærkninger på 15 plader — en hel dagbog om samlingen!",
    progress: s => [Math.min(s.withNotes, 15), 15] },
  { id: "archivist", group: "flid", emoji: "🗃️", title: "Arkivaren",
    desc: "Udfyld stand på 5 af dine plader.",
    progress: s => [Math.min(s.withCondition, 5), 5] },
  { id: "photographer", group: "flid", emoji: "📸", title: "Fotografen",
    desc: "Sæt dit eget billede på en plade — fx et foto af netop dit eksemplar.",
    progress: s => [Math.min(s.withOwnCover, 1), 1] },
  { id: "visitor5", group: "flid", emoji: "📅", title: "Fast gæst",
    desc: "Brug siden på 5 forskellige dage.",
    progress: s => [Math.min(s.activeDays, 5), 5] },
  { id: "visitor15", group: "flid", emoji: "🪑", title: "Stamgæst",
    desc: "Brug siden på 15 forskellige dage.",
    progress: s => [Math.min(s.activeDays, 15), 15] },
  { id: "visitor30", group: "flid", emoji: "🏠", title: "Klubhuset",
    desc: "Brug siden på 30 forskellige dage — det her er DIT sted.",
    progress: s => [Math.min(s.activeDays, 30), 30] },
  { id: "streak3", group: "flid", emoji: "🔥", title: "Varm streak",
    desc: "Besøg siden 3 dage i træk.",
    progress: s => [Math.min(s.streak, 3), 3] },
  { id: "streak7", group: "flid", emoji: "🌋", title: "Brandvarm!",
    desc: "Besøg siden 7 dage i træk — Michael ville være stolt.",
    progress: s => [Math.min(s.streak, 7), 7] },
];

/* ============================================================
   Officielle singler (7")
   ------------------------------------------------------------
   Kompakt format, så listen er til at overskue:
     [titel, år, kategori, prisniveau, fun fact?, kunstner?, selskab?]
   Listen dækker de officielle singleudgivelser — ikke enhver
   lokal presning eller promo-udgave; dem er der hundredvis af.
   ============================================================ */

const SINGLES_RAW = [
  /* --- Jackson 5 (Motown) --- */
  ["I Want You Back", 1969, "jackson5", "lav", "Den allerførste single — regnes for en af popmusikkens bedste åbninger nogensinde."],
  ["ABC", 1970, "jackson5", "lav", "Skubbede The Beatles' \"Let It Be\" ned fra førstepladsen."],
  ["The Love You Save", 1970, "jackson5", "lav"],
  ["I'll Be There", 1970, "jackson5", "lav", "Deres fjerde nummer 1-hit i træk — det havde ingen gruppe gjort før."],
  ["Santa Claus Is Comin' to Town", 1970, "jackson5", "mellem", "Julesinglen! Perfekt at finde frem i december."],
  ["Mama's Pearl", 1971, "jackson5", "lav"],
  ["Never Can Say Goodbye", 1971, "jackson5", "lav"],
  ["Maybe Tomorrow", 1971, "jackson5", "lav"],
  ["Sugar Daddy", 1971, "jackson5", "lav"],
  ["Little Bitty Pretty One", 1972, "jackson5", "lav"],
  ["Lookin' Through the Windows", 1972, "jackson5", "lav"],
  ["Corner of the Sky", 1972, "jackson5", "lav", "Fra Broadway-musicalen Pippin."],
  ["Hallelujah Day", 1973, "jackson5", "lav"],
  ["Get It Together", 1973, "jackson5", "lav"],
  ["Dancing Machine", 1974, "jackson5", "lav", "Michael dansede robot til denne i tv — og hele USA kopierede ham."],
  ["Whatever You Got, I Want", 1974, "jackson5", "mellem"],
  ["I Am Love", 1975, "jackson5", "mellem"],
  ["Forever Came Today", 1975, "jackson5", "mellem", "Den sidste single som Jackson 5 på Motown."],

  /* --- Michael solo (Motown) --- */
  ["Got to Be There", 1971, "studie", "lav", "Michaels allerførste solosingle — han var 13 år."],
  ["Rockin' Robin", 1972, "studie", "lav", "En gammel 50'er-sang, som Michael gjorde til sin egen."],
  ["I Wanna Be Where You Are", 1972, "studie", "lav"],
  ["Ben", 1972, "studie", "lav", "Michaels første nummer 1-hit som solist — en kærlighedssang til en rotte!"],
  ["With a Child's Heart", 1973, "studie", "mellem"],
  ["We're Almost There", 1975, "studie", "mellem"],
  ["Just a Little Bit of You", 1975, "studie", "mellem"],
  ["One Day in Your Life", 1981, "studie", "lav", "Motown genudgav den midt i Michaels Epic-succes — og den gik nummer 1 i England.", null, "Motown"],
  ["Farewell My Summer Love", 1984, "studie", "lav", "Fundet i Motowns arkiv 11 år efter, den blev indspillet.", null, "Motown"],

  /* --- Michael solo (Epic) — Off the Wall --- */
  ["Don't Stop 'Til You Get Enough", 1979, "studie", "billig", "Michael skrev den selv — og vandt sin første Grammy for den."],
  ["Rock with You", 1979, "studie", "billig"],
  ["Off the Wall", 1980, "studie", "billig"],
  ["She's Out of My Life", 1980, "studie", "billig", "Michael græd, hver gang han sang den i studiet — man kan høre det til sidst."],
  ["Girlfriend", 1980, "studie", "lav", "Skrevet af Paul McCartney, længe før de sang duet sammen."],

  /* --- Thriller --- */
  ["The Girl Is Mine", 1982, "studie", "billig", "Duet med Paul McCartney — den første single fra Thriller."],
  ["Billie Jean", 1983, "studie", "billig", "Sangen han lavede moonwalk til på tv i 1983. Verden stoppede op."],
  ["Beat It", 1983, "studie", "billig", "Med Eddie Van Halens vilde guitarsolo — indspillet gratis som en vennetjeneste."],
  ["Wanna Be Startin' Somethin'", 1983, "studie", "billig"],
  ["Human Nature", 1983, "studie", "billig"],
  ["P.Y.T. (Pretty Young Thing)", 1983, "studie", "billig"],
  ["Thriller", 1984, "studie", "lav", "Musikvideoen var 14 minutter lang og ændrede musikvideoer for altid."],

  /* --- Bad --- */
  ["I Just Can't Stop Loving You", 1987, "studie", "billig", "Duet med Siedah Garrett."],
  ["Bad", 1987, "studie", "billig"],
  ["The Way You Make Me Feel", 1987, "studie", "billig"],
  ["Man in the Mirror", 1988, "studie", "billig", "Michaels yndlingssang at optræde med."],
  ["Dirty Diana", 1988, "studie", "billig"],
  ["Another Part of Me", 1988, "studie", "billig"],
  ["Smooth Criminal", 1988, "studie", "billig", "Videoen med det umulige skrå læn — de brugte skjulte kroge i gulvet."],
  ["Leave Me Alone", 1989, "studie", "lav"],
  ["Liberian Girl", 1989, "studie", "lav"],

  /* --- Dangerous --- */
  ["Black or White", 1991, "studie", "billig", "Videoen havde ansigter, der forvandlede sig til hinanden — helt nyt dengang."],
  ["Remember the Time", 1992, "studie", "billig"],
  ["In the Closet", 1992, "studie", "billig"],
  ["Jam", 1992, "studie", "billig", "Videoen er med basketball-legenden Michael Jordan."],
  ["Who Is It", 1992, "studie", "billig"],
  ["Heal the World", 1992, "studie", "billig", "Michael sagde selv, det var den sang, han var mest stolt af."],
  ["Give In to Me", 1993, "studie", "lav"],
  ["Will You Be There", 1993, "studie", "lav", "Kendt fra filmen Free Willy."],
  ["Gone Too Soon", 1993, "studie", "lav"],

  /* --- HIStory og frem --- */
  ["Scream", 1995, "studie", "lav", "Duet med lillesøsteren Janet — og dengang verdens dyreste musikvideo."],
  ["You Are Not Alone", 1995, "studie", "lav", "Den allerførste sang, der gik direkte ind som nummer 1 i USA."],
  ["Earth Song", 1995, "studie", "lav", "Michaels største hit i England nogensinde."],
  ["They Don't Care About Us", 1996, "studie", "lav"],
  ["Stranger in Moscow", 1996, "studie", "lav"],
  ["Blood on the Dance Floor", 1997, "studie", "lav"],
  ["HIStory / Ghosts", 1997, "studie", "mellem"],
  ["You Rock My World", 2001, "studie", "mellem", "Vinylsingler var næsten uddøde i 2001 — derfor er den svær at finde."],
  ["Cry", 2001, "studie", "mellem"],
  ["Butterflies", 2001, "studie", "hoej"],
  ["One More Chance", 2003, "studie", "mellem"],
  ["Hold My Hand", 2010, "studie", "mellem", "Duet med Akon — udgivet efter Michaels død."],
  ["Love Never Felt So Good", 2014, "studie", "mellem", "Med Justin Timberlake. Sangen lå gemt i 31 år, før den blev et hit."],

  /* --- The Jacksons (Epic) --- */
  ["Enjoy Yourself", 1976, "jacksons", "billig", "Den første single under det nye navn The Jacksons."],
  ["Show You the Way to Go", 1977, "jacksons", "billig", "Gruppens eneste nummer 1-hit i England."],
  ["Goin' Places", 1977, "jacksons", "lav"],
  ["Blame It on the Boogie", 1978, "jacksons", "billig"],
  ["Shake Your Body (Down to the Ground)", 1979, "jacksons", "billig", "Skrevet af Michael og lillebror Randy."],
  ["Lovely One", 1980, "jacksons", "billig"],
  ["Heartbreak Hotel", 1980, "jacksons", "lav", "Omdøbt til \"This Place Hotel\", så folk ikke forvekslede den med Elvis'."],
  ["Can You Feel It", 1981, "jacksons", "billig", "Videoen med kæmpe-brødrene, der drysser lys ud over verden."],
  ["Walk Right Now", 1981, "jacksons", "lav"],
  ["State of Shock", 1984, "jacksons", "billig", "Michael synger duet med Mick Jagger fra The Rolling Stones."],
  ["Torture", 1984, "jacksons", "lav"],
  ["Body", 1984, "jacksons", "lav"],
  ["2300 Jackson Street", 1989, "jacksons", "lav"],
  ["Nothin (That Compares 2 U)", 1989, "jacksons", "lav"],

  /* --- Duetter og samarbejder --- */
  ["Ease on Down the Road", 1978, "duet", "lav", "Med Diana Ross fra filmen The Wiz.", "Diana Ross & Michael Jackson", "MCA"],
  ["Say Say Say", 1983, "duet", "billig", "Med Paul McCartney — nummer 1 i USA i seks uger.", "Paul McCartney & Michael Jackson", "Parlophone"],
  ["Somebody's Watching Me", 1984, "duet", "lav", "Michael synger det uhyggelige omkvæd.", "Rockwell", "Motown"],
  ["We Are the World", 1985, "duet", "billig", "45 superstjerner i ét studie. Michael skrev den sammen med Lionel Richie.", "USA for Africa", "Columbia"],
];

/* Udfold den kompakte liste til rigtige plade-objekter */
const DEFAULT_ARTIST = {
  studie: "Michael Jackson",
  jackson5: "The Jackson 5",
  jacksons: "The Jacksons",
  duet: "Michael Jackson",
};

function singleSlug(title) {
  return "s-" + title.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function defaultLabel(category, year) {
  if (category === "jackson5") return year <= 1976 ? "Motown" : "Epic";
  if (category === "studie") return year <= 1975 ? "Motown" : "Epic";
  return "Epic";
}

const SINGLES = SINGLES_RAW.map(([title, year, category, price, desc, artist, label]) => ({
  id: singleSlug(title),
  title,
  year,
  category,
  price,
  format: "single",
  artist: artist || DEFAULT_ARTIST[category],
  label: label || defaultLabel(category, year),
  wiki: title,
  desc: desc || `${artist || DEFAULT_ARTIST[category]} udgav den som single i ${year}.`,
}));

/* Albummene ovenfor er alle LP'er; singlerne lægges til samme liste,
   så filtre, søgning og milepæle virker på tværs af formater. */
for (const a of ALBUMS) a.format = a.format || "lp";
ALBUMS.push(...SINGLES);
