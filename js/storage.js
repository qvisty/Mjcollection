/* ============================================================
   Storage-lag
   ------------------------------------------------------------
   Samlingen gemmes lige nu i browserens localStorage (den
   overlever i modsætning til sessionStorage, at browseren
   lukkes — vigtigt, så samlingen ikke forsvinder!).

   Når I er klar til Supabase:
     1) Opret et projekt på supabase.com og en tabel `collection`
        med kolonnerne: id (text, primary key), data (jsonb),
        updated_at (timestamptz).
     2) Udfyld SUPABASE_URL og SUPABASE_ANON_KEY herunder.
     3) Sæt BACKEND = "supabase".
   Resten af appen er ligeglad med, hvor data ligger — den
   kalder kun load() og save().
   ============================================================ */

const BACKEND = "local"; // "local" | "supabase"

const SUPABASE_URL = "";      // fx "https://xxxx.supabase.co"
const SUPABASE_ANON_KEY = ""; // projektets anon-nøgle
const COLLECTION_ROW_ID = "mj-lp-samling"; // rækken samlingen gemmes i

const STORAGE_KEY = "mj-collection-v1";

const EMPTY_STATE = { version: 1, records: {}, seenAchievements: [] };

const LocalBackend = {
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn("Kunne ikke gemme samling:", e);
      return false;
    }
  },
};

/* Simpel Supabase-backend via REST — kræver kun URL + anon key.
   (Bruger PostgREST-endpointet direkte, så der skal ikke
   installeres nogen biblioteker.) */
const SupabaseBackend = {
  _headers() {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };
  },
  async load() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/collection?id=eq.${COLLECTION_ROW_ID}&select=data`,
        { headers: this._headers() }
      );
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0] && rows[0].data) {
        return { ...structuredClone(EMPTY_STATE), ...rows[0].data };
      }
      return structuredClone(EMPTY_STATE);
    } catch (e) {
      console.warn("Supabase load fejlede, falder tilbage til localStorage:", e);
      return LocalBackend.load();
    }
  },
  async save(state) {
    // Gem altid også lokalt som backup
    LocalBackend.save(state);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/collection`, {
        method: "POST",
        headers: { ...this._headers(), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify([{ id: COLLECTION_ROW_ID, data: state, updated_at: new Date().toISOString() }]),
      });
      return res.ok;
    } catch (e) {
      console.warn("Supabase save fejlede (data er gemt lokalt):", e);
      return false;
    }
  },
};

const Storage = BACKEND === "supabase" && SUPABASE_URL ? SupabaseBackend : LocalBackend;

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
