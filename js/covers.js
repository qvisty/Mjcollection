/* ============================================================
   Coverbilleder
   ------------------------------------------------------------
   Coverne hentes automatisk fra Wikipedia (artiklens hoved-
   billede = pladecoveret) og caches i localStorage, så det
   kun sker én gang pr. browser. Kan et cover ikke findes,
   viser kortet i stedet en flot genereret vinyl-plade.
   Man kan altid sætte sit eget billede på en plade via
   "Ret detaljer" (fx et link til et foto af NETOP jeres
   eksemplar).
   ============================================================ */

const COVER_CACHE_KEY = "mj-covers-v2";
const WIKI_API = "https://en.wikipedia.org/w/api.php";

function loadCoverCache() {
  try { return JSON.parse(localStorage.getItem(COVER_CACHE_KEY)) || {}; }
  catch { return {}; }
}
function saveCoverCache(cache) {
  try { localStorage.setItem(COVER_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

async function wikiQueryImages(titles) {
  // Op til 50 titler pr. kald. origin=* giver CORS-adgang.
  const url = `${WIKI_API}?action=query&format=json&origin=*&redirects=1` +
    `&prop=pageimages&piprop=original|thumbnail&pithumbsize=500` +
    `&titles=${encodeURIComponent(titles.join("|"))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wikipedia svarede ${res.status}`);
  const data = await res.json();

  // Kortlæg normaliseringer og redirects tilbage til de titler, vi spurgte om
  const toRequested = {};
  for (const n of data.query?.normalized || []) toRequested[n.to] = n.from;
  for (const r of data.query?.redirects || []) {
    toRequested[r.to] = toRequested[r.from] ?? r.from;
  }

  const result = {};
  for (const page of Object.values(data.query?.pages || {})) {
    const requested = toRequested[page.title] ?? page.title;
    const img = page.thumbnail?.source || page.original?.source || null;
    if (img) result[requested] = img;
  }
  return result;
}

/* --- Ekstra kilde: iTunes Search API (via JSONP, ingen nøgle) --- */

function itunesSearch(term) {
  return new Promise(resolve => {
    const cb = "itcb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const done = data => {
      clearTimeout(timer);
      delete window[cb];
      script.remove();
      resolve(data);
    };
    const timer = setTimeout(() => done(null), 8000);
    window[cb] = done;
    script.onerror = () => done(null);
    script.src = "https://itunes.apple.com/search?media=music&entity=album&limit=10" +
      `&term=${encodeURIComponent(term)}&callback=${cb}`;
    document.head.appendChild(script);
  });
}

function normTitle(s) {
  return String(s).toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9æøå ]/g, "")
    .replace(/\s+/g, " ").trim();
}

/* Returnerer en URL, null (svar men intet match — spørg ikke igen)
   eller undefined (netværksfejl — prøv igen næste gang). */
async function itunesCover(album) {
  const data = await itunesSearch(`michael jackson ${album.title}`)
    || await itunesSearch(`${album.artist} ${album.title}`);
  if (!data || !data.results) return undefined;
  const want = normTitle(album.title);
  const hit = data.results.find(r => {
    const got = normTitle(r.collectionName || "");
    const artist = (r.artistName || "").toLowerCase();
    return artist.includes("jackson") && (got.includes(want) || want.includes(got)) && got;
  });
  if (!hit || !hit.artworkUrl100) return null;
  return hit.artworkUrl100.replace("100x100", "600x600");
}

/* Henter covers for alle album, med cache. Kalder onUpdate(),
   hver gang der er nye billeder klar, så UI'et kan opdatere.
   Kilde 1: Wikipedia (artiklens hovedbillede).
   Kilde 2: iTunes (for de album, Wikipedia ikke kunne levere). */
async function resolveCovers(albums, onUpdate) {
  const cache = loadCoverCache();
  const missing = albums.filter(a => a.wiki && cache[a.id] === undefined);
  if (missing.length === 0) return cache;

  const chunks = [];
  for (let i = 0; i < missing.length; i += 40) chunks.push(missing.slice(i, i + 40));

  for (const chunk of chunks) {
    let found = {}, retryFound = {};
    try {
      found = await wikiQueryImages(chunk.map(a => a.wiki));
      // Andet forsøg for titler uden billede: prøv "Titel (album)"
      const retry = chunk.filter(a => !found[a.wiki] && !a.wiki.includes("("));
      if (retry.length) {
        try {
          retryFound = await wikiQueryImages(retry.map(a => `${a.wiki} (album)`));
        } catch {}
      }
    } catch (e) {
      console.warn("Kunne ikke hente covers fra Wikipedia:", e);
    }
    for (const a of chunk) {
      const url = found[a.wiki] || retryFound[`${a.wiki} (album)`];
      if (url) cache[a.id] = url; // uafklarede album prøves hos iTunes nedenfor
    }
    saveCoverCache(cache);
    if (onUpdate) onUpdate(cache);
  }

  // iTunes-fallback, ét album ad gangen (og kun for dem der mangler)
  for (const a of missing) {
    if (cache[a.id]) continue;
    try {
      const url = await itunesCover(a);
      if (url !== undefined) { // undefined = netværksfejl, prøv igen næste besøg
        cache[a.id] = url;     // null gemmes også → vi spørger ikke igen
        saveCoverCache(cache);
        if (url && onUpdate) onUpdate(cache);
      }
    } catch (e) {
      console.warn("iTunes-opslag fejlede for", a.title, e);
    }
    await new Promise(r => setTimeout(r, 350)); // vær høflig ved API'et
  }
  if (onUpdate) onUpdate(cache);
  return cache;
}

/* Fallback: en genereret vinylplade i albummets egne farver */
function coverFallbackHTML(album) {
  const hue = [...album.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const cat = CATEGORIES[album.category];
  return `
    <div class="cover-fallback" style="--h:${hue}; --cat:${cat.color}">
      <div class="cf-sleeve">
        <div class="cf-vinyl"><div class="cf-label-dot"></div></div>
        <div class="cf-text">
          <span class="cf-title">${escapeHTML(album.title)}</span>
          <span class="cf-year">${album.year}</span>
        </div>
      </div>
    </div>`;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
