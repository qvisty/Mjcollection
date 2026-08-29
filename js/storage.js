/* ============================================================
   Storage-lag
   ------------------------------------------------------------
   Samlingen gemmes altid i browserens localStorage — og når en
   sky-backend er slået til, synkroniseres den også dertil, så
   den kan ses og opdateres fra flere enheder.

   SÅDAN SLÅS GOOGLE FIRESTORE TIL (ca. 5 minutter):
     1) Gå til console.firebase.google.com, log ind med din
        Google-konto og opret et projekt.
     2) Opret en Firestore-database og indsæt sikkerheds-
        reglerne fra README.md.
     3) Registrér en web-app i projektet og kopiér projectId
        og apiKey ind herunder.
     4) BACKEND står allerede på "firestore".
   (Supabase understøttes også — sæt BACKEND = "supabase" og
   udfyld Supabase-værdierne i stedet. Se README.md.)

   Første gang siden åbnes med sky-backend, uploades en evt.
   eksisterende lokal samling automatisk — der går intet tabt.
   Resten af appen er ligeglad med, hvor data ligger — den
   kalder kun Storage.load() og Storage.save().
   ============================================================ */

const BACKEND = "firestore"; // "local" | "firestore" | "supabase" — falder tilbage til localStorage, indtil nøglerne er udfyldt

/* --- Google Firestore --- */
const FIRESTORE_PROJECT_ID = ""; // fx "mj-samlingen"
const FIRESTORE_API_KEY = "";    // web-appens apiKey (starter med "AIza...")

/* --- Supabase (alternativ) --- */
const SUPABASE_URL = "";      // fx "https://xxxx.supabase.co"
const SUPABASE_ANON_KEY = ""; // projektets "anon public"-nøgle

const COLLECTION_ROW_ID = "mj-lp-samling"; // dokumentet/rækken samlingen gemmes i

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

/* ------------------------------------------------------------
   Fælles logik for sky-backends. En backend skal kun levere:
     fetchRemote()   → state-objekt eller null (findes ikke endnu)
     pushRemote(st)  → gem state i skyen, returnér true/false
   Resten (lokal kopi, første-gangs-upload, offline-fallback og
   "nyeste version vinder") håndteres her.
   ------------------------------------------------------------ */
function makeRemoteBackend(impl) {
  return {
    isRemote: true,

    async load() {
      const local = await LocalBackend.load();
      let remote;
      try {
        remote = await impl.fetchRemote();
      } catch (e) {
        console.warn("Skyen kunne ikke nås — bruger lokal kopi:", e);
        return local; // offline: fortsæt lokalt, sync sker ved næste save/load
      }

      // Første gang: intet i skyen endnu → upload den lokale samling
      if (!remote) {
        if (hasData(local)) {
          try { await impl.pushRemote(local); } catch {}
        }
        return local;
      }

      // Er den lokale kopi nyere end skyen (fx redigeret offline)?
      if (hasData(local) && local.updatedAt && remote.updatedAt &&
          local.updatedAt > remote.updatedAt) {
        try { await impl.pushRemote(local); } catch {}
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
        return await impl.pushRemote(state);
      } catch (e) {
        console.warn("Kunne ikke gemme i skyen (data er gemt lokalt):", e);
        return false;
      }
    },
  };
}

/* --- Google Firestore via REST (ingen biblioteker) ---
   Hele samlingen gemmes som ét dokument med et enkelt
   JSON-tekstfelt — enkelt, og langt under Firestores
   grænse på 1 MB pr. dokument. */
const FirestoreBackend = makeRemoteBackend({
  _url() {
    return "https://firestore.googleapis.com/v1/projects/" +
      `${FIRESTORE_PROJECT_ID}/databases/(default)/documents/` +
      `mjcollection/${COLLECTION_ROW_ID}?key=${FIRESTORE_API_KEY}`;
  },

  async fetchRemote() {
    const res = await fetch(this._url());
    if (res.status === 404) return null; // dokumentet findes ikke endnu
    if (!res.ok) throw new Error(`Firestore svarede ${res.status}`);
    const doc = await res.json();
    const json = doc.fields?.json?.stringValue;
    if (!json) return null;
    return { ...structuredClone(EMPTY_STATE), ...JSON.parse(json) };
  },

  async pushRemote(state) {
    const res = await fetch(this._url(), {
      method: "PATCH", // opretter dokumentet, hvis det ikke findes
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: { json: { stringValue: JSON.stringify(state) } },
      }),
    });
    return res.ok;
  },
});

/* --- Supabase via REST (PostgREST) --- */
const SupabaseBackend = makeRemoteBackend({
  _headers() {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };
  },

  async fetchRemote() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/collection?id=eq.${COLLECTION_ROW_ID}&select=data`,
      { headers: this._headers() }
    );
    if (!res.ok) throw new Error(`Supabase svarede ${res.status}`);
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0] && rows[0].data) {
      return { ...structuredClone(EMPTY_STATE), ...rows[0].data };
    }
    return null;
  },

  async pushRemote(state) {
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
});

const Storage =
  BACKEND === "firestore" && FIRESTORE_PROJECT_ID && FIRESTORE_API_KEY ? FirestoreBackend :
  BACKEND === "supabase" && SUPABASE_URL && SUPABASE_ANON_KEY ? SupabaseBackend :
  LocalBackend;

/* Eksport/import som fil — god backup, og nem måde at flytte
   samlingen mellem enheder, indtil en sky-backend er koblet på. */
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
