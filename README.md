# 💿 MJ Samlingen

En lille hjemmeside til at holde styr på (og fejre!) en Michael Jackson-vinylsamling.
Bygget som ren HTML/CSS/JavaScript — intet build-step, kører direkte på GitHub Pages.

## Hvad kan den?

- **Overblik** med fremdriftsring, statistik pr. kategori, "næste milepæl", senest
  tilføjede plader og ønskeliste.
- **Samlingen**: alle ~50 LP-udgivelser med Michael Jackson (solo, Jackson 5,
  The Jacksons, soundtracks, opsamlinger og særudgivelser) med søgning, filtre
  (kategori, årti, status, sjældne plader) og sortering.
- **Milepæle**: 18 badges der låses op undervejs — med konfetti 🎉
- På hver plade kan man gemme **stand, fundet-dato, pris, noter og eget foto** (URL).
- **Backup**: eksportér/importér hele samlingen som en JSON-fil (knapper i bunden).

## Hvor gemmes data?

Lige nu i browserens `localStorage` — det virker med det samme og overlever, at
browseren lukkes (i modsætning til `sessionStorage`). Data er altså **pr. browser
pr. enhed**; brug backup-knapperne til at flytte samlingen mellem enheder.

### Skift til Supabase senere

Hele appen taler kun med `Storage.load()` / `Storage.save()` i `js/storage.js`,
så skiftet er tre små skridt (beskrevet i toppen af filen):

1. Opret et Supabase-projekt og en tabel `collection` med kolonnerne
   `id (text, primary key)`, `data (jsonb)`, `updated_at (timestamptz)`.
2. Indsæt `SUPABASE_URL` og `SUPABASE_ANON_KEY` i `js/storage.js`.
3. Sæt `BACKEND = "supabase"`.

Der gemmes fortsat en lokal kopi som backup, og Supabase-kaldene bruger REST
direkte, så der skal ikke installeres noget.

## Coverbilleder

Coverne hentes automatisk i browseren fra Wikipedia (albumartiklens hovedbillede)
og caches i `localStorage`. Findes et cover ikke, vises en genereret vinylplade i
stedet — og man kan altid sætte sit eget billede på en plade via "Ret detaljer".

## Udgivelse på GitHub Pages

1. Merge denne branch til `main`.
2. Gå til **Settings → Pages** i repoet og vælg **Source: GitHub Actions**
   (workflowet i `.github/workflows/pages.yml` udgiver siden automatisk ved
   hvert push til `main`).

Alternativt: vælg **Deploy from a branch** → `main` / `/ (root)` — det virker
også fint, da siden er ren statisk HTML.

## Filer

```
index.html           Selve siden (SPA med hash-routing)
css/style.css        Design — mørkt "koncertscene"-tema med guld
js/data.js           Album-databasen + milepæle (nem at udvide!)
js/storage.js        Storage-lag: localStorage nu, Supabase senere
js/covers.js         Automatisk cover-hentning fra Wikipedia + fallback
js/app.js            Routing, visninger, filtre, konfetti
```

## Tilføj eller ret et album

Åbn `js/data.js` og tilføj et objekt til `ALBUMS`-listen:

```js
{ id: "min-nye-plade", title: "Titel", artist: "Michael Jackson", year: 1988,
  category: "opsamling", label: "Epic", wiki: "Wikipedia-sidens titel",
  desc: "En sjov fun fact på dansk." },
```

`rare: true` markerer pladen som sjælden (tæller med i Skattejæger-badgen ✨).
