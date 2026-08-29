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

const COVER_CACHE_KEY = "mj-covers-v1";
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

/* Henter covers for alle album, med cache. Kalder onUpdate(),
   hver gang der er nye billeder klar, så UI'et kan opdatere. */
async function resolveCovers(albums, onUpdate) {
  const cache = loadCoverCache();
  const missing = albums.filter(a => a.wiki && cache[a.id] === undefined);
  if (missing.length === 0) return cache;

  const chunks = [];
  for (let i = 0; i < missing.length; i += 40) chunks.push(missing.slice(i, i + 40));

  for (const chunk of chunks) {
    try {
      const found = await wikiQueryImages(chunk.map(a => a.wiki));
      // Andet forsøg for titler uden billede: prøv "Titel (album)"
      const retry = chunk.filter(a => !found[a.wiki] && !a.wiki.includes("("));
      let retryFound = {};
      if (retry.length) {
        try {
          retryFound = await wikiQueryImages(retry.map(a => `${a.wiki} (album)`));
        } catch {}
      }
      for (const a of chunk) {
        const url = found[a.wiki] || retryFound[`${a.wiki} (album)`] || null;
        cache[a.id] = url; // null gemmes også, så vi ikke spørger igen og igen
      }
      saveCoverCache(cache);
      if (onUpdate) onUpdate(cache);
    } catch (e) {
      console.warn("Kunne ikke hente covers fra Wikipedia:", e);
      // Gem intet for denne chunk — så prøver vi igen næste gang siden åbnes
      return cache;
    }
  }
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
