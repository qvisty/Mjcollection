/* ============================================================
   MJ Vinylsamling — app-logik (routing, visninger, fejring 🎉)
   ============================================================ */

let state = null;      // { records, seenAchievements }
let covers = {};       // albumId -> billed-URL (eller null)
let filters = { search: "", category: "alle", status: "alle", wish: "alle", decade: "alle", label: "alle", sort: "aar-op" };

const WISH_LABELS = { 1: "Vil gerne have den", 2: "Ønsker mig den meget", 3: "Drømmeplade! 💭" };

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
    total: ALBUMS.length, owned: 0, wishlisted: 0, dreamMarked: 0, rareOwned: 0, withNotes: 0,
    byCategory: {}, categoryTotals: {}, byDecade: {},
  };
  for (const a of ALBUMS) {
    s.categoryTotals[a.category] = (s.categoryTotals[a.category] || 0) + 1;
    const r = rec(a.id);
    if ((r.wish || 0) > 0 && !r.owned) s.wishlisted++;
    if ((r.wish || 0) === 3) s.dreamMarked++;
    if (r.notes && r.notes.trim()) s.withNotes++;
    if (r.owned) {
      s.owned++;
      s.byCategory[a.category] = (s.byCategory[a.category] || 0) + 1;
      const dec = Math.floor(a.year / 10) * 10;
      s.byDecade[dec] = (s.byDecade[dec] || 0) + 1;
      if (a.rare) s.rareOwned++;
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
    setRec(id, { owned: true, ownedDate: r.ownedDate || new Date().toISOString() });
    const a = albumById(id);
    toast(`<span class="toast-emoji">💿</span><div><strong>${escapeHTML(a.title)}</strong> er nu i samlingen!</div>`);
    confetti();
  }
  celebrateNewAchievements(before);
  render();
  persist(); // gemmer i baggrunden — UI'et skal ikke vente på skyen
}

/* Sæt ønske-niveau 1-3 ⭐ — klik på samme niveau igen fjerner ønsket */
async function setWish(id, level) {
  const before = earnedSet(computeStats());
  const current = rec(id).wish || 0;
  const next = current === level ? 0 : level;
  setRec(id, { wish: next });
  if (next === 3) toast(`<span class="toast-emoji">💭</span><div><strong>${escapeHTML(albumById(id).title)}</strong> er nu en drømmeplade!</div>`);
  celebrateNewAchievements(before);
  render();
  persist();
}

function wishStarsHTML(id, size = "", inModal = false) {
  const wish = rec(id).wish || 0;
  const handler = inModal ? "setWishInModal" : "setWish";
  return `
    <div class="wish-stars ${size}" title="Hvor højt ønsker du dig den? Klik på stjernerne">
      ${[1, 2, 3].map(n => `
        <button class="star ${wish >= n ? "on" : ""}" aria-label="Ønske-niveau ${n}"
          onclick="event.stopPropagation(); ${handler}('${id}', ${n})">★</button>`).join("")}
    </div>`;
}

async function setWishInModal(id, level) {
  closeModal();
  await setWish(id, level);
  openModal(id);
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

  const wish = ALBUMS
    .filter(a => (rec(a.id).wish || 0) > 0 && !rec(a.id).owned)
    .sort((a, b) => (rec(b.id).wish || 0) - (rec(a.id).wish || 0) || a.year - b.year)
    .slice(0, 4);

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
        <h2>⭐ Ønskelisten</h2>
        <div class="mini-grid">${wish.map(a => miniCard(a, true)).join("")}</div>
      </section>` : `
      <section class="panel">
        <h2>⭐ Ønskelisten</h2>
        <p class="empty-hint">Giv de plader, du jagter, 1-3 stjerner ⭐⭐⭐ — så har du din egen ønskeliste, sorteret efter hvor højt du ønsker dig dem.</p>
      </section>`}
    </div>`;
}

function miniCard(album, showWish = false) {
  const wish = rec(album.id).wish || 0;
  return `
    <div class="mini-card" onclick="openModal('${album.id}')">
      <div class="mini-cover">${coverHTML(album)}</div>
      <span class="mini-title">${escapeHTML(album.title)}</span>
      <span class="mini-year">${album.year}</span>
      ${showWish && wish ? `<span class="mini-wish">${"★".repeat(wish)}</span>` : ""}
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
  if (filters.label !== "alle") {
    list = filters.label === "andre"
      ? list.filter(a => a.label !== "Motown" && a.label !== "Epic")
      : list.filter(a => a.label === filters.label);
  }
  if (filters.status === "ejet") list = list.filter(a => rec(a.id).owned);
  if (filters.status === "mangler") list = list.filter(a => !rec(a.id).owned);
  if (filters.status === "sjaelden") list = list.filter(a => a.rare);
  if (filters.wish !== "alle") {
    const min = +filters.wish;
    list = list.filter(a => (rec(a.id).wish || 0) >= min && !rec(a.id).owned);
  }

  switch (filters.sort) {
    case "aar-op": list.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, "da")); break;
    case "aar-ned": list.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "da")); break;
    case "titel": list.sort((a, b) => a.title.localeCompare(b.title, "da")); break;
    case "senest": list.sort((a, b) => (rec(b.id).ownedDate || "").localeCompare(rec(a.id).ownedDate || "")); break;
    case "oensker": list.sort((a, b) => (rec(b.id).wish || 0) - (rec(a.id).wish || 0) || a.year - b.year); break;
  }
  return list;
}

function filtersActive() {
  return filters.search || filters.category !== "alle" || filters.status !== "alle" ||
    filters.wish !== "alle" || filters.decade !== "alle" || filters.label !== "alle";
}

function resetFilters() {
  filters = { ...filters, search: "", category: "alle", status: "alle", wish: "alle", decade: "alle", label: "alle" };
  renderCollection();
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
          <option value="sjaelden"${filters.status === "sjaelden" ? "selected" : ""}>✨ Sjældne</option>
        </select>
        <select onchange="setFilter('wish', this.value)">
          <option value="alle" ${filters.wish === "alle" ? "selected" : ""}>Ønskeliste: alle</option>
          <option value="1"    ${filters.wish === "1" ? "selected" : ""}>★ og opefter</option>
          <option value="2"    ${filters.wish === "2" ? "selected" : ""}>★★ og opefter</option>
          <option value="3"    ${filters.wish === "3" ? "selected" : ""}>★★★ Drømmeplader</option>
        </select>
        <select onchange="setFilter('decade', this.value)">
          <option value="alle" ${filters.decade === "alle" ? "selected" : ""}>Alle årtier</option>
          ${[1960, 1970, 1980, 1990, 2000, 2010].map(d =>
            `<option value="${d}" ${filters.decade == d ? "selected" : ""}>${d}'erne</option>`).join("")}
        </select>
        <select onchange="setFilter('label', this.value)">
          <option value="alle"   ${filters.label === "alle" ? "selected" : ""}>Alle pladeselskaber</option>
          <option value="Motown" ${filters.label === "Motown" ? "selected" : ""}>Motown</option>
          <option value="Epic"   ${filters.label === "Epic" ? "selected" : ""}>Epic</option>
          <option value="andre"  ${filters.label === "andre" ? "selected" : ""}>Andre</option>
        </select>
        <select onchange="setFilter('sort', this.value)">
          <option value="aar-op"  ${filters.sort === "aar-op" ? "selected" : ""}>År (ældste først)</option>
          <option value="aar-ned" ${filters.sort === "aar-ned" ? "selected" : ""}>År (nyeste først)</option>
          <option value="titel"   ${filters.sort === "titel" ? "selected" : ""}>Titel (A–Å)</option>
          <option value="senest"  ${filters.sort === "senest" ? "selected" : ""}>Senest tilføjet</option>
          <option value="oensker" ${filters.sort === "oensker" ? "selected" : ""}>Flest ønske-stjerner</option>
        </select>
        ${filtersActive() ? `<button class="btn-reset" onclick="resetFilters()">✕ Nulstil filtre</button>` : ""}
      </div>
    </section>

    ${filtersActive() ? `<p class="result-count">${list.length} ${list.length === 1 ? "plade" : "plader"} matcher filtrene</p>` : ""}

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
        ${r.notes && r.notes.trim() ? `<span class="note-dot" title="${escapeHTML(r.notes.trim())}">💬</span>` : ""}
      </div>
      <div class="card-actions" onclick="event.stopPropagation()">
        <button class="btn-own ${r.owned ? "on" : ""}" onclick="toggleOwned('${album.id}')"
          title="${r.owned ? "Fjern fra samlingen" : "Jeg har den!"}">
          ${r.owned ? "💿 Har den!" : "＋ Har den!"}
        </button>
        ${r.owned ? "" : wishStarsHTML(album.id)}
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

        ${r.owned ? "" : `
        <div class="modal-wish">
          <span class="modal-wish-label">Hvor højt ønsker du dig den?</span>
          ${wishStarsHTML(id, "big", true)}
          <span class="modal-wish-text">${(r.wish || 0) > 0 ? WISH_LABELS[r.wish] : "Klik på stjernerne for at sætte den på ønskelisten"}</span>
        </div>`}

        <div class="note-box">
          <label for="note-input">💬 Min bemærkning</label>
          <textarea id="note-input" rows="3"
            placeholder="Fx 'Set i genbrugsbutikken til 80 kr.' eller 'Fik den af mormor ❤️'">${escapeHTML(r.notes || "")}</textarea>
          <button class="btn btn-small" onclick="saveNote('${id}')">Gem bemærkning</button>
        </div>

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

async function saveNote(id) {
  const before = earnedSet(computeStats());
  const text = ($("#note-input")?.value || "").trim();
  setRec(id, { notes: text });
  celebrateNewAchievements(before);
  toast(text ? "Bemærkning gemt! 💬" : "Bemærkning fjernet");
  render(); // opdatér 💬-mærket på kortet bag modalen
  persist();
}

async function saveDetails(e, id) {
  e.preventDefault();
  const before = earnedSet(computeStats());
  const f = new FormData(e.target);
  setRec(id, {
    condition: f.get("condition") || "",
    purchasedAt: f.get("purchasedAt") || "",
    price: f.get("price") || "",
    coverUrl: (f.get("coverUrl") || "").trim(),
  });
  celebrateNewAchievements(before);
  toast("Gemt! ✅");
  closeModal();
  render();
  persist();
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
  // Migrér gammel til/fra-ønskeliste til stjerne-niveauer (2 ★ som standard)
  let migrated = false;
  for (const r of Object.values(state.records)) {
    if (r.wishlist !== undefined) {
      if (r.wishlist && !r.wish) r.wish = 2;
      delete r.wishlist;
      migrated = true;
    }
  }
  if (migrated) await persist();
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
