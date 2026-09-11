/* ============================================================
   Tracklister
   ------------------------------------------------------------
   Sangene på hver plade hentes fra iTunes, første gang pladen
   åbnes, og caches derefter i localStorage — samme mønster som
   coverne. Meget sjældne plader findes ikke hos iTunes; dér
   vises blot en stille besked i stedet.
   ============================================================ */

const TRACKS_CACHE_KEY = "mj-tracks-v1";

function loadTracksCache() {
  try { return JSON.parse(localStorage.getItem(TRACKS_CACHE_KEY)) || {}; }
  catch { return {}; }
}
function saveTracksCache(cache) {
  try { localStorage.setItem(TRACKS_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

function fmtTrackTime(ms) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* Returnerer [{n: navn, d: længde}], null (findes ikke hos iTunes)
   eller undefined (netværksfejl — prøv igen senere). */
async function getTracks(album) {
  const cache = loadTracksCache();
  if (cache[album.id] !== undefined) return cache[album.id];

  const hit = await itunesFindAlbum(album);
  if (hit === undefined) return undefined; // netværksfejl — cache intet
  if (!hit || !hit.collectionId) {
    cache[album.id] = null;
    saveTracksCache(cache);
    return null;
  }

  const data = await jsonp(`https://itunes.apple.com/lookup?id=${hit.collectionId}&entity=song&limit=200`);
  if (!data || !data.results) return undefined;

  const tracks = data.results
    .filter(r => r.wrapperType === "track")
    .sort((a, b) => (a.discNumber || 1) - (b.discNumber || 1) ||
                    (a.trackNumber || 0) - (b.trackNumber || 0))
    .map(t => ({ n: t.trackName, d: fmtTrackTime(t.trackTimeMillis) }));

  cache[album.id] = tracks.length ? tracks : null;
  saveTracksCache(cache);
  return cache[album.id];
}
