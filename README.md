# 💿 MJ Samlingen

En lille hjemmeside til at holde styr på (og fejre!) en Michael Jackson-vinylsamling.
Bygget som ren HTML/CSS/JavaScript — intet build-step, kører direkte på GitHub Pages.

## Hvad kan den?

- **Overblik** med fremdriftsring, niveau, "dagens jagt", statistik pr. kategori,
  "næste milepæl", senest tilføjede plader og ønskeliste.
- **Samlingen**: alle 49 LP-udgivelser med Michael Jackson (solo, Jackson 5,
  The Jacksons, soundtracks, opsamlinger og særudgivelser) med faner for
  har/mangler, søgning, filtre (kategori, årti, pladeselskab, ønske-niveau,
  sjældne) og 13 sorteringsrækkefølger.
- **Milepæle**: 44 badges i fem grupper der låses op undervejs — med konfetti 🎉
- **Niveauer**: ni samler-titler fra "Ny i klubben" til "KING OF POP".
- **Ønskeliste**: 1-3 stjerner pr. plade, alt efter hvor højt man ønsker sig den.
- **Trackliste** på hver plade, hentet fra iTunes.
- På hver plade kan man skrive en **bemærkning** og gemme **stand, fundet-dato,
  pris og eget foto** (alt sammen valgfrit).
- **Køb-links**: på plader man mangler vises et vejledende prisniveau samt
  søge-links til Discogs, DBA og eBay.
- **Backup**: eksportér/importér hele samlingen som en JSON-fil (knapper i bunden).

## Hvor gemmes data?

Lige nu i browserens `localStorage` — det virker med det samme og overlever, at
browseren lukkes (i modsætning til `sessionStorage`). Data er altså **pr. browser
pr. enhed**; brug backup-knapperne til at flytte samlingen mellem enheder.

### Skift til Google Firestore (5 minutter)

Hele appen taler kun med `Storage.load()` / `Storage.save()` i `js/storage.js`,
så skiftet kræver ingen ændringer i resten af koden:

1. Gå til [console.firebase.google.com](https://console.firebase.google.com),
   log ind med din Google-konto og vælg **Create a project** (navn fx
   `mj-samlingen`; Google Analytics kan slås fra).
2. I venstremenuen: **Build → Firestore Database → Create database**.
   Vælg region (fx `europe-west1`) og **Start in production mode**.
3. Gå til fanen **Rules**, erstat indholdet med dette og tryk **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /mjcollection/mj-lp-samling {
         allow read, write: if true;
       }
     }
   }
   ```

   (Kun det ene dokument, samlingen bor i, kan læses/skrives — alt andet er
   lukket.)
4. Klik tandhjulet → **Project settings** → under *Your apps*: tilføj en
   **web-app** (`</>`-ikonet, navn er ligegyldigt, ingen hosting). Kopiér
   `projectId` og `apiKey` fra kodestumpen, der vises.
5. Indsæt de to værdier i toppen af `js/storage.js`
   (`FIRESTORE_PROJECT_ID` og `FIRESTORE_API_KEY`) — `BACKEND` står
   allerede på `"firestore"`. Commit og push — færdig!

Første gang siden åbnes med sky-backend, uploades en evt. eksisterende lokal
samling automatisk, så intet går tabt. Derefter synkroniseres der ved hver
ændring, og andre enheder henter seneste version, når fanen får fokus. Der
gemmes altid også en lokal kopi, så siden virker offline.

> **Bemærk:** `apiKey` er ikke en hemmelighed (den identificerer bare
> projektet), men reglerne ovenfor tillader alle, der kender linket, at
> læse/skrive samlingen. Til en privat hobbyliste er det fint (og I har
> altid JSON-backuppen), men gem ikke personlige oplysninger i noterne.

### Alternativ: Supabase

Foretrækker du Supabase, sæt `BACKEND = "supabase"` i `js/storage.js` og:

1. Opret en gratis konto på [supabase.com](https://supabase.com) og opret et
   projekt (vælg fx region *West EU*).
2. Åbn **SQL Editor** i venstremenuen, indsæt SQL'en herunder og tryk **Run**:

   ```sql
   create table if not exists collection (
     id text primary key,
     data jsonb not null,
     updated_at timestamptz not null default now()
   );

   alter table collection enable row level security;

   create policy "laes samlingen"    on collection for select using (true);
   create policy "opret samlingen"   on collection for insert with check (true);
   create policy "opdater samlingen" on collection for update using (true);
   ```

3. Gå til **Settings → API** og kopiér **Project URL** og **anon public**-nøglen.
4. Indsæt dem i toppen af `js/storage.js` (`SUPABASE_URL` og
   `SUPABASE_ANON_KEY`). Commit og push — færdig!

Sync-adfærden er den samme som med Firestore (samme fælles logik).

## Coverbilleder

Coverne hentes automatisk i browseren og caches i `localStorage`, så det kun
sker første gang:

1. **Wikipedia** — albumartiklens hovedbillede (= pladecoveret).
2. **iTunes** — fallback for de album, Wikipedia ikke kunne levere.

Findes et cover stadig ikke, vises en genereret vinylplade — og man kan altid
sætte sit eget billede på en plade via "Ret detaljer" (fx et foto af netop
jeres eksemplar). Siden er kun til privat brug.

## Udgivelse på GitHub Pages

Gå til **Settings → Pages** og vælg **Source: GitHub Actions** — workflowet i
`.github/workflows/pages.yml` udgiver siden automatisk ved hvert push til
`main`.

Alternativt: vælg **Deploy from a branch** → `main` / `/ (root)` — det virker
også fint, da siden er ren statisk HTML (slet i så fald workflow-filen).

## Filer

```
index.html           Selve siden (SPA med hash-routing)
css/style.css        Design — mørkt "koncertscene"-tema med guld
js/data.js           Album-databasen + milepæle (nem at udvide!)
js/storage.js        Storage-lag: localStorage + Firestore (eller Supabase)
js/covers.js         Automatisk cover-hentning fra Wikipedia/iTunes + fallback
js/tracks.js         Tracklister fra iTunes, cachet i browseren
js/app.js            Routing, visninger, filtre, niveauer, konfetti
```

## Tilføj eller ret et album

Åbn `js/data.js` og tilføj et objekt til `ALBUMS`-listen:

```js
{ id: "min-nye-plade", title: "Titel", artist: "Michael Jackson", year: 1988,
  category: "opsamling", label: "Epic", wiki: "Wikipedia-sidens titel",
  desc: "En sjov fun fact på dansk." },
```

`rare: true` markerer pladen som sjælden (✨, tæller med i Skattejæger-badgen).
`grail: true` markerer den som hellig gral (💎) — de absolut sværeste plader,
som får et glimtende guldmærke og gylden ramme. En gral skal også have
`rare: true`.

`price` angiver vejledende prisniveau: `lav`, `mellem`, `hoej` eller
`megethoej`. Beløbsintervallerne står samlet i `PRICE_BANDS` i toppen af
`js/data.js` og kan justeres ét sted, hvis markedet ændrer sig.
