/* ============================================================
   MJ Vinylsamling — app-logik (routing, visninger, fejring 🎉)
   ============================================================ */

let state = null;      // { records, seenAchievements }
let covers = {};       // albumId -> billed-URL (eller null)
let filters = { search: "", category: "alle", status: "alle", decade: "alle", sort: "aar-op" };

/* ---------- Hjælpere ---------- */

const $ = sel => document.querySelector(sel);
const albumById = id => ALBUMS.find(a => a.id === id);
const rec = id => state.records[id] || {};

function setRec(id, patch) {
  state.records[id] = { ...rec(id), ...patch };
}

function coverURL(album) {
  return rec(album.id).coverUrl || covers[album.id] || null;
}

function coverHTML(album, cls = "") {
  const url = coverURL(album);
  if (url) {
    return `<img class="cover-img ${cls}" src="${escapeHTML(url)}" alt="Cover: ${escapeHTML(album.title)}"
      loading="lazy" onerror="this.outerHTML=coverFallbackHTML(albumById('${album.id}'))">`;
  }
  return coverFallbackHTML(album);
}

/* ---------- Statistik ---------- */

function computeStats() {
  const s = {
    total: ALBUMS.length, owned: 0, wishlisted: 0, rareOwned: 0, withNotes: 0,
    byCategory: {}, categoryTotals: {}, byDecade: {},
  };
  for (const a of ALBUMS) {
    s.categoryTotals[a.category] = (s.categoryTotals[a.category] || 0) + 1;
    const r = rec(a.id);
    if (r.wishlist && !r.owned) s.wishlisted++;
    if (r.owned) {
      s.owned++;
      s.byCategory[a.category] = (s.byCategory[a.category] || 0) + 1;
      const dec = Math.floor(a.year / 10) * 10;
      s.byDecade[dec] = (s.byDecade[dec] || 0) + 1;
      if (a.rare) s.rareOwned++;
      if (r.notes && r.notes.trim()) s.withNotes++;
    }
  }
  s.percent = s.total ? Math.round((s.owned / s.total) * 100) : 0;
  return s;
}

function achievementProgress(ach, s) {
  if (ach.needsAlbums) {
    const have = ach.needsAlbums.filter(id => rec(id).owned).length;
    return [have, ach.needsAlbums.length];
  }
  if (ach.needsCategory) {
    return [s.byCategory[ach.needsCategory] || 0, s.categoryTotals[ach.needsCategory] || 0];
  }
  if (ach.progress) return ach.progress(s);
  return [0, 1];
}

function achievementEarned(ach, s) {
  if (ach.test) return ach.test(s);
  const [now, goal] = achievementProgress(ach, s);
  return goal > 0 && now >= goal;
}

function earnedSet(s) {
  return new Set(ACHIEVEMENTS.filter(a => achievementEarned(a, s)).map(a => a.id));
}

/* ---------- Fejring ---------- */

function confetti() {
  const wrap = document.createElement("div");
  wrap.className = "confetti";
  const colors = ["#e8b93c", "#e0653a", "#4fa3d1", "#d15b9e", "#5bbd8b", "#fff"];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.6 + "s";
    p.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 3500);
}

function toast(html, big = false) {
  const t = document.createElement("div");
  t.className = "toast" + (big ? " toast-big" : "");
  t.innerHTML = html;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, big ? 4200 : 2200);
}

function celebrateNewAchievements(before) {
  const after = earnedSet(computeStats());
  const fresh = [...after].filter(id => !before.has(id) && !state.seenAchievements.includes(id));
  for (const id of fresh) {
    state.seenAchievements.push(id);
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    toast(`<span class="toast-emoji">${ach.emoji}</span>
           <div><strong>Ny milepæl: ${escapeHTML(ach.title)}</strong><br>
           <span>${escapeHTML(ach.desc)}</span></div>`, true);
  }
  if (fresh.length) confetti();
  return fresh.length > 0;
}

/* ---------- Gem + genrender ---------- */

async function persist() {
  await Storage.save(state);
  renderHeaderCount();
}

async function toggleOwned(id) {
  const before = earnedSet(computeStats());
  const r = rec(id);
  if (r.owned) {
    setRec(id, { owned: false });
    toast("Fjernet fra samlingen");
  } else {
    setRec(id, { owned: true, wishlist: false, ownedDate: r.ownedDate || new Date().toISOString() });
    const a = albumById(id);
    toast(`<span class="toast-emoji">💿</span><div><strong>${escapeHTML(a.title)}</strong> er nu i samlingen!</div>`);
    confetti();
  }
  celebrateNewAchievements(before);
  await persist();
  render();
}

async function toggleWishlist(id) {
  const before = earnedSet(computeStats());
  setRec(id, { wishlist: !rec(id).wishlist });
  celebrateNewAchievements(before);
  await persist();
  render();
}

/* ---------- Router ---------- */

const routes = {
  "": renderDashboard,
  "samling": renderCollection,
  "milepaele": renderAchievements,
};

function currentRoute() {
  return (location.hash.replace(/^#\/?/, "").split("/")[0] || "");
}

function render() {
  const route = currentRoute();
  (routes[route] || renderDashboard)();
  document.querySelectorAll(".nav a").forEach(a => {
    a.classList.toggle("active", a.dataset.route === (routes[route] ? route : ""));
  });
  renderHeaderCount();
}

function renderHeaderCount() {
  const s = computeStats();
  $("#header-count").textContent = `${s.owned}/${s.total}`;
  $("#header-count").title = `${s.owned} af ${s.total} plader samlet`;
}

/* ---------- Visning: Overblik ---------- */

function motivationMessage(s) {
  if (s.owned === 0) return "Jagten begynder nu — find din første plade! 🔎";
  if (s.percent < 10) return "Sikke en start! Hver plade tæller. 💪";
  if (s.percent < 25) return "Samlingen vokser — godt gået! 🌱";
  if (s.percent < 50) return "Wow, du er godt på vej mod halvvejs! 🚀";
  if (s.percent < 75) return "Over halvvejs — du er en ægte samler! ⭐";
  if (s.percent < 100) return "Så tæt på! De sidste er de sjoveste at jagte. 🏁";
  return "KOMPLET SAMLING! Du er den ultimative MJ-fan! 👑🎉";
}

function progressRing(percent, size = 180) {
  const r = (size - 18) / 2, c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return `
    <svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg"
        stroke-dasharray="${c}" stroke-dashoffset="${off}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="46%" class="ring-pct">${percent}%</text>
      <text x="50%" y="62%" class="ring-sub">samlet</text>
    </svg>`;
}

function renderDashboard() {
  const s = computeStats();
  const earned = earnedSet(s);

  // Næste milepæl: den ikke-optjente med højest fremdrift
  const next = ACHIEVEMENTS
    .filter(a => !earned.has(a.id))
    .map(a => ({ a, p: achievementProgress(a, s) }))
    .sort((x, y) => (y.p[0] / (y.p[1] || 1)) - (x.p[0] / (x.p[1] || 1)))[0];

  const recent = ALBUMS
    .filter(a => rec(a.id).owned && rec(a.id).ownedDate)
    .sort((a, b) => rec(b.id).ownedDate.localeCompare(rec(a.id).ownedDate))
    .slice(0, 4);

  const wish = ALBUMS.filter(a => rec(a.id).wishlist && !rec(a.id).owned).slice(0, 4);

  const catBars = Object.entries(CATEGORIES).map(([key, cat]) => {
    const have = s.byCategory[key] || 0, total = s.categoryTotals[key] || 0;
    const pct = total ? Math.round((have / total) * 100) : 0;
    return `
      <div class="catbar" role="button" tabindex="0" onclick="gotoCategory('${key}')" onkeydown="if(event.key==='Enter')gotoCategory('${key}')">
        <div class="catbar-head">
          <span>${cat.emoji} ${cat.label}</span>
          <span class="catbar-count">${have}/${total}</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${pct}%; background:${cat.color}"></div></div>
      </div>`;
  }).join("");

  $("#view").innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <h1>Min Michael Jackson<br><span class="gold">LP-samling</span></h1>
        <p class="motivation">${motivationMessage(s)}</p>
        <div class="hero-stats">
          <div class="stat"><strong>${s.owned}</strong><span>i samlingen</span></div>
          <div class="stat"><strong>${s.total - s.owned}</strong><span>mangler endnu</span></div>
          <div class="stat"><strong>${earned.size}</strong><span>milepæle 🏆</span></div>
        </div>
        <div class="hero-cta">
          <a class="btn btn-gold" href="#/samling">Se hele samlingen</a>
          <a class="btn" href="#/milepaele">Mine milepæle</a>
        </div>
      </div>
      <div class="hero-ring">${progressRing(s.percent)}</div>
    </section>

    ${next ? `
    <section class="panel next-goal">
      <h2>🎯 Næste milepæl</h2>
      <div class="next-goal-body">
        <span class="next-emoji">${next.a.emoji}</span>
        <div class="next-info">
          <strong>${escapeHTML(next.a.title)}</strong>
          <span>${escapeHTML(next.a.desc)}</span>
          <div class="bar"><div class="bar-fill gold-fill" style="width:${Math.round((next.p[0] / (next.p[1] || 1)) * 100)}%"></div></div>
          <small>${next.p[0]} af ${next.p[1]}</small>
        </div>
      </div>
    </section>` : `
    <section class="panel next-goal"><h2>🏆 Alle milepæle er i hus — legende!</h2></section>`}

    <section class="panel">
      <h2>📚 Samlingen del for del</h2>
      <div class="catbars">${catBars}</div>
    </section>

    <div class="two-col">
      ${recent.length ? `
      <section class="panel">
        <h2>🆕 Senest tilføjet</h2>
        <div class="mini-grid">${recent.map(a => miniCard(a)).join("")}</div>
      </section>` : `
      <section class="panel">
        <h2>🆕 Senest tilføjet</h2>
        <p class="empty-hint">Når du markerer en plade som "Har den!", dukker den op her.</p>
      </section>`}
      ${wish.length ? `
      <section class="panel">
        <h2>⭐ På jagt efter</h2>
        <div class="mini-grid">${wish.map(a => miniCard(a)).join("")}</div>
      </section>` : `
      <section class="panel">
        <h2>⭐ På jagt efter</h2>
        <p class="empty-hint">Sæt stjerne ⭐ på de plader, du jagter — så har du din egen ønskeliste.</p>
      </section>`}
    </div>`;
}

function miniCard(album) {
  return `
    <div class="mini-card" onclick="openModal('${album.id}')">
      <div class="mini-cover">${coverHTML(album)}</div>
      <span class="mini-title">${escapeHTML(album.title)}</span>
      <span class="mini-year">${album.year}</span>
    </div>`;
}

function gotoCategory(key) {
  filters.category = key;
  location.hash = "#/samling";
  if (currentRoute() === "samling") render();
}

/* ---------- Visning: Samlingen ---------- */

function filteredAlbums() {
  let list = [...ALBUMS];
  const q = filters.search.trim().toLowerCase();
  if (q) list = list.filter(a =>
    a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q) || String(a.year).includes(q));
  if (filters.category !== "alle") list = list.filter(a => a.category === filters.category);
  if (filters.decade !== "alle") list = list.filter(a => Math.floor(a.year / 10) * 10 === +filters.decade);
  if (filters.status === "ejet") list = list.filter(a => rec(a.id).owned);
  if (filters.status === "mangler") list = list.filter(a => !rec(a.id).owned);
  if (filters.status === "oenske") list = list.filter(a => rec(a.id).wishlist && !rec(a.id).owned);
  if (filters.status === "sjaelden") list = list.filter(a => a.rare);

  switch (filters.sort) {
    case "aar-op": list.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, "da")); break;
    case "aar-ned": list.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "da")); break;
    case "titel": list.sort((a, b) => a.title.localeCompare(b.title, "da")); break;
    case "senest": list.sort((a, b) => (rec(b.id).ownedDate || "").localeCompare(rec(a.id).ownedDate || "")); break;
  }
  return list;
}

function renderCollection() {
  const s = computeStats();
  const list = filteredAlbums();

  const chips = [["alle", "Alle"], ...Object.entries(CATEGORIES).map(([k, c]) => [k, `${c.emoji} ${c.label}`])]
    .map(([k, label]) => `<button class="chip ${filters.category === k ? "chip-on" : ""}"
      onclick="setFilter('category','${k}')">${label}</button>`).join("");

  $("#view").innerHTML = `
    <section class="collection-head">
      <h1>Samlingen <span class="count-pill">${s.owned}/${s.total}</span></h1>
      <div class="bar bar-wide"><div class="bar-fill gold-fill" style="width:${s.percent}%"></div></div>
    </section>

    <section class="toolbar">
      <input id="search" type="search" placeholder="Søg titel eller år…" value="${escapeHTML(filters.search)}"
        oninput="setFilter('search', this.value)">
      <div class="chips">${chips}</div>
      <div class="selects">
        <select onchange="setFilter('status', this.value)">
          <option value="alle"    ${filters.status === "alle" ? "selected" : ""}>Alle plader</option>
          <option value="ejet"    ${filters.status === "ejet" ? "selected" : ""}>💿 Har jeg</option>
          <option value="mangler" ${filters.status === "mangler" ? "selected" : ""}>🔎 Mangler</option>
          <option value="oenske"  ${filters.status === "oenske" ? "selected" : ""}>⭐ Ønskeliste</option>
          <option value="sjaelden"${filters.status === "sjaelden" ? "selected" : ""}>✨ Sjældne</option>
        </select>
        <select onchange="setFilter('decade', this.value)">
          <option value="alle" ${filters.decade === "alle" ? "selected" : ""}>Alle årtier</option>
          ${[1960, 1970, 1980, 1990, 2000, 2010].map(d =>
            `<option value="${d}" ${filters.decade == d ? "selected" : ""}>${d}'erne</option>`).join("")}
        </select>
        <select onchange="setFilter('sort', this.value)">
          <option value="aar-op"  ${filters.sort === "aar-op" ? "selected" : ""}>År (ældste først)</option>
          <option value="aar-ned" ${filters.sort === "aar-ned" ? "selected" : ""}>År (nyeste først)</option>
          <option value="titel"   ${filters.sort === "titel" ? "selected" : ""}>Titel (A–Å)</option>
          <option value="senest"  ${filters.sort === "senest" ? "selected" : ""}>Senest tilføjet</option>
        </select>
      </div>
    </section>

    <section class="grid">
      ${list.map(albumCard).join("") || `<p class="empty-hint">Ingen plader matcher din søgning. 🤔</p>`}
    </section>`;
}

function setFilter(key, value) {
  filters[key] = value;
  const searchEl = $("#search");
  const hadFocus = searchEl && document.activeElement === searchEl;
  const pos = hadFocus ? searchEl.selectionStart : 0;
  renderCollection();
  if (hadFocus) {
    const el = $("#search");
    el.focus();
    el.setSelectionRange(pos, pos);
  }
}

function albumCard(album) {
  const r = rec(album.id);
  const cat = CATEGORIES[album.category];
  return `
    <article class="card ${r.owned ? "card-owned" : ""}" onclick="openModal('${album.id}')">
      <div class="card-cover">
        ${coverHTML(album)}
        ${r.owned ? `<span class="owned-badge">✔ I samlingen</span>` : ""}
        ${album.rare ? `<span class="rare-badge" title="Sjælden plade">✨ Sjælden</span>` : ""}
      </div>
      <div class="card-body">
        <h3>${escapeHTML(album.title)}</h3>
        <p class="card-meta">${escapeHTML(album.artist)} · ${album.year}</p>
        <span class="cat-tag" style="--cat:${cat.color}">${cat.emoji} ${cat.label}</span>
      </div>
      <div class="card-actions" onclick="event.stopPropagation()">
        <button class="btn-own ${r.owned ? "on" : ""}" onclick="toggleOwned('${album.id}')"
          title="${r.owned ? "Fjern fra samlingen" : "Jeg har den!"}">
          ${r.owned ? "💿 Har den!" : "＋ Har den!"}
        </button>
        <button class="btn-star ${r.wishlist && !r.owned ? "on" : ""}" ${r.owned ? "disabled" : ""}
          onclick="toggleWishlist('${album.id}')" title="Ønskeliste">⭐</button>
      </div>
    </article>`;
}

/* ---------- Visning: Milepæle ---------- */

function renderAchievements() {
  const s = computeStats();
  const earned = earnedSet(s);
  $("#view").innerHTML = `
    <section class="collection-head">
      <h1>Milepæle <span class="count-pill">${earned.size}/${ACHIEVEMENTS.length}</span></h1>
      <p class="page-sub">Hver plade du finder, låser nye trofæer op! 🏆</p>
    </section>
    <section class="badge-grid">
      ${ACHIEVEMENTS.map(a => {
        const won = earned.has(a.id);
        const [now, goal] = achievementProgress(a, s);
        const pct = goal ? Math.round((Math.min(now, goal) / goal) * 100) : 0;
        return `
          <div class="badge ${won ? "badge-won" : ""}">
            <span class="badge-emoji">${a.emoji}</span>
            <strong>${escapeHTML(a.title)}</strong>
            <span class="badge-desc">${escapeHTML(a.desc)}</span>
            ${won
              ? `<span class="badge-status">Optjent! 🎉</span>`
              : `<div class="bar"><div class="bar-fill gold-fill" style="width:${pct}%"></div></div>
                 <small>${now} af ${goal}</small>`}
          </div>`;
      }).join("")}
    </section>`;
}

/* ---------- Album-modal ---------- */

function openModal(id) {
  const album = albumById(id);
  const r = rec(id);
  const cat = CATEGORIES[album.category];
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.id = "overlay";
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="${escapeHTML(album.title)}">
      <button class="modal-close" onclick="closeModal()" aria-label="Luk">✕</button>
      <div class="modal-cover">${coverHTML(album)}</div>
      <div class="modal-body">
        <span class="cat-tag" style="--cat:${cat.color}">${cat.emoji} ${cat.label}</span>
        ${album.rare ? `<span class="rare-badge inline">✨ Sjælden</span>` : ""}
        <h2>${escapeHTML(album.title)}</h2>
        <p class="card-meta">${escapeHTML(album.artist)} · ${album.year} · ${escapeHTML(album.label)}</p>
        <p class="modal-desc">${escapeHTML(album.desc)}</p>

        <button class="btn-own big ${r.owned ? "on" : ""}" onclick="toggleOwnedInModal('${id}')">
          ${r.owned ? "💿 Den er i samlingen!" : "＋ Jeg har den!"}
        </button>

        <details class="edit-details">
          <summary>Tilføj detaljer ✏️ <span class="optional-hint">(helt valgfrit)</span></summary>
          <form class="edit-form" onsubmit="saveDetails(event, '${id}')">
            <label>Stand
              <select name="condition">
                ${["", "Mint (som ny)", "Near Mint", "Very Good+", "Very Good", "Good", "Slidt men elsket"]
                  .map(c => `<option value="${c}" ${r.condition === c ? "selected" : ""}>${c || "— vælg —"}</option>`).join("")}
              </select>
            </label>
            <label>Fundet dato
              <input type="date" name="purchasedAt" value="${escapeHTML(r.purchasedAt || "")}">
            </label>
            <label>Pris
              <input type="text" name="price" placeholder="fx 75 kr." value="${escapeHTML(r.price || "")}">
            </label>
            <label>Noter (hvor fandt du den? god historie?)
              <textarea name="notes" rows="3">${escapeHTML(r.notes || "")}</textarea>
            </label>
            <label>Eget coverbillede (link til foto)
              <input type="text" name="coverUrl" placeholder="https://…" value="${escapeHTML(r.coverUrl || "")}">
            </label>
            <p class="optional-note">Alle felter er valgfrie — udfyld kun det, du har lyst til. 😊</p>
            <button class="btn btn-gold" type="submit">Gem</button>
          </form>
        </details>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");
}

function closeModal() {
  $("#overlay")?.remove();
  document.body.classList.remove("no-scroll");
}

async function toggleOwnedInModal(id) {
  closeModal();
  await toggleOwned(id);
  openModal(id);
}

async function saveDetails(e, id) {
  e.preventDefault();
  const before = earnedSet(computeStats());
  const f = new FormData(e.target);
  setRec(id, {
    condition: f.get("condition") || "",
    purchasedAt: f.get("purchasedAt") || "",
    price: f.get("price") || "",
    notes: f.get("notes") || "",
    coverUrl: (f.get("coverUrl") || "").trim(),
  });
  celebrateNewAchievements(before);
  await persist();
  toast("Gemt! ✅");
  closeModal();
  render();
}

/* ---------- Backup ---------- */

function doExport() { exportCollection(state); }

async function doImport(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    state = await importCollection(file);
    await persist();
    render();
    toast("Samlingen er hentet ind! 📦");
  } catch {
    toast("Hov — den fil kunne ikke læses. 😕");
  }
  input.value = "";
}

/* ---------- Start ---------- */

async function init() {
  state = await Storage.load();
  // Marker allerede optjente milepæle som set, så gamle badges
  // ikke fejres igen ved hver genindlæsning
  const earned = earnedSet(computeStats());
  for (const id of earned) {
    if (!state.seenAchievements.includes(id)) state.seenAchievements.push(id);
  }
  render();
  window.addEventListener("hashchange", render);
  // Hent covers i baggrunden og opdatér løbende
  covers = loadCoverCache();
  resolveCovers(ALBUMS, updated => { covers = updated; render(); });

  // Med sky-backend: hent seneste version, når fanen får fokus igen
  // (så samlingen følger med mellem fx telefon og computer)
  if (Storage.isRemote) {
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState !== "visible") return;
      const fresh = await Storage.load();
      if (JSON.stringify(fresh) !== JSON.stringify(state)) {
        state = fresh;
        render();
      }
    });
  }
}

init();
