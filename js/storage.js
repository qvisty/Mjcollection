/* ============================================================
   Storage-lag
   ------------------------------------------------------------
   Samlingen gemmes altid i browserens localStorage — og når
   Supabase er slået til, synkroniseres den også til skyen, så
   den kan ses og opdateres fra flere enheder.

   SÅDAN SLÅS SUPABASE TIL (5 minutter):
     1) Opret en gratis konto + et projekt på supabase.com.
     2) Kør SQL-opsætningen fra README.md i projektets
        "SQL Editor" (opretter tabellen `collection`).
     3) Kopiér projektets URL og "anon public"-nøgle fra
        Settings → API, og indsæt dem herunder.
     4) Sæt BACKEND = "supabase".
   Første gang siden åbnes med Supabase slået til, uploades den
   eksisterende lokale samling automatisk — der går intet tabt.
   Resten af appen er ligeglad med, hvor data ligger — den
   kalder kun Storage.load() og Storage.save().
   ============================================================ */

const BACKEND = "supabase"; // "local" | "supabase" — bruger localStorage, indtil URL+nøgle er udfyldt

const SUPABASE_URL = "";      // fx "https://xxxx.supabase.co"
const SUPABASE_ANON_KEY = ""; // projektets "anon public"-nøgle
const COLLECTION_ROW_ID = "mj-lp-samling"; // rækken samlingen gemmes i

const STORAGE_KEY = "mj-collection-v1";

const EMPTY_STATE = { version: 1, records: {}, seenAchievements: [], updatedAt: null };

function hasData(state) {
  return state && state.records && Object.keys(state.records).length > 0;
}

const LocalBackend = {
  isRemote: false,
  async load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(EMPTY_STATE);
      const parsed = JSON.parse(raw);
      return { ...structuredClone(EMPTY_STATE), ...parsed };
    } catch (e) {
      console.warn("Kunne ikke læse gemt samling:", e);
      return structuredClone(EMPTY_STATE);
    }
  },
  async save(state) {
    try {
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn("Kunne ikke gemme samling:", e);
      return false;
    }
  },
};

/* Supabase-backend via REST (PostgREST) — kræver kun URL + anon-
   nøgle, ingen biblioteker. localStorage bruges som lokal kopi
   og fallback, så siden også virker offline. */
const SupabaseBackend = {
  isRemote: true,
  _headers() {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };
  },

  async _fetchRemote() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/collection?id=eq.${COLLECTION_ROW_ID}&select=data`,
      { headers: this._headers() }
    );
    if (!res.ok) throw new Error(`Supabase svarede ${res.status}`);
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0] && rows[0].data) {
      return { ...structuredClone(EMPTY_STATE), ...rows[0].data };
    }
    return null; // ingen række endnu
  },

  async _pushRemote(state) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/collection`, {
      method: "POST",
      headers: { ...this._headers(), Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([{
        id: COLLECTION_ROW_ID,
        data: state,
        updated_at: new Date().toISOString(),
      }]),
    });
    return res.ok;
  },

  async load() {
    const local = await LocalBackend.load();
    let remote;
    try {
      remote = await this._fetchRemote();
    } catch (e) {
      console.warn("Supabase kunne ikke nås — bruger lokal kopi:", e);
      return local; // offline: fortsæt lokalt, sync sker ved næste save/load
    }

    // Første gang: intet i skyen endnu → upload den lokale samling
    if (!remote) {
      if (hasData(local)) {
        try { await this._pushRemote(local); } catch {}
      }
      return local;
    }

    // Er den lokale kopi nyere end skyen (fx redigeret offline)?
    if (hasData(local) && local.updatedAt && remote.updatedAt &&
        local.updatedAt > remote.updatedAt) {
      try { await this._pushRemote(local); } catch {}
      return local;
    }

    // Ellers vinder skyen — gem en frisk lokal kopi
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remote)); } catch {}
    return remote;
  },

  async save(state) {
    // Gem altid først lokalt (sætter også updatedAt)
    await LocalBackend.save(state);
    try {
      return await this._pushRemote(state);
    } catch (e) {
      console.warn("Supabase save fejlede (data er gemt lokalt):", e);
      return false;
    }
  },
};

const Storage = BACKEND === "supabase" && SUPABASE_URL && SUPABASE_ANON_KEY
  ? SupabaseBackend
  : LocalBackend;

/* Eksport/import som fil — god backup, og nem måde at flytte
   samlingen mellem enheder, indtil Supabase er koblet på. */
function exportCollection(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const d = new Date().toISOString().slice(0, 10);
  a.download = `mj-samling-${d}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importCollection(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed.records !== "object") throw new Error("Ugyldig fil");
        resolve({ ...structuredClone(EMPTY_STATE), ...parsed });
      } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
