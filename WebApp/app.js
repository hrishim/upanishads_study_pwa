const dataSets = window.UPANISHAD_DATA || [];

const state = {
  activeSlug: localStorage.getItem("upanishads-study:active") || dataSets[0]?.slug,
  entryNumber: Number(localStorage.getItem("upanishads-study:entry")) || 1,
  mode: localStorage.getItem("upanishads-study:mode") || "study",
  query: "",
  scale: Number(localStorage.getItem("upanishads-study:scale")) || 1,
};

const modes = [
  ["study", "Study"],
  ["sanskrit", "Sanskrit"],
  ["translation", "Translation"],
  ["words", "Word by Word"],
  ["notes", "Sankaracharya Commentary"],
];

const $ = (id) => document.getElementById(id);

function currentData() {
  return dataSets.find((item) => item.slug === state.activeSlug) || dataSets[0];
}

function currentEntry(data) {
  return data.entries.find((entry) => entry.entryNumber === state.entryNumber)
    || data.entries.find((entry) => entry.verse > 0)
    || data.entries[0];
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function preview(value = "", length = 116) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length)}...` : clean;
}

function storageKey(data, key) {
  return `upanishads-study:${data.slug}:${key}`;
}

function getBookmarks(data) {
  return JSON.parse(localStorage.getItem(storageKey(data, "bookmarks")) || "[]");
}

function setBookmarks(data, bookmarks) {
  localStorage.setItem(storageKey(data, "bookmarks"), JSON.stringify(bookmarks));
}

function groupSections(sections) {
  return sections.reduce((groups, section) => {
    groups[section.chapter] = groups[section.chapter] || [];
    groups[section.chapter].push(section);
    return groups;
  }, {});
}

function includesQuery(entry, query) {
  return [
    entry.reference,
    entry.sanskrit,
    entry.translation,
    entry.wordMeanings,
    entry.notes,
  ].some((value = "") => value.toLowerCase().includes(query));
}

function chooseData(slug) {
  state.activeSlug = slug;
  const data = currentData();
  state.entryNumber = Number(localStorage.getItem(storageKey(data, "entry")))
    || data.entries.find((entry) => entry.verse > 0)?.entryNumber
    || data.entries[0]?.entryNumber
    || 1;
  state.query = "";
  $("searchInput").value = "";
  localStorage.setItem("upanishads-study:active", state.activeSlug);
  render();
}

function chooseEntry(entryNumber) {
  const data = currentData();
  state.entryNumber = entryNumber;
  localStorage.setItem(storageKey(data, "entry"), String(entryNumber));
  render();
}

function move(delta) {
  const data = currentData();
  const entry = currentEntry(data);
  const index = data.entries.findIndex((item) => item.entryNumber === entry.entryNumber);
  const next = data.entries[Math.min(Math.max(index + delta, 0), data.entries.length - 1)];
  chooseEntry(next.entryNumber);
}

function toggleBookmark() {
  const data = currentData();
  const entry = currentEntry(data);
  const bookmarks = getBookmarks(data);
  const next = bookmarks.includes(entry.id)
    ? bookmarks.filter((id) => id !== entry.id)
    : [...bookmarks, entry.id];
  setBookmarks(data, next);
  render();
}

function setMode(mode) {
  state.mode = mode;
  localStorage.setItem("upanishads-study:mode", mode);
  render();
}

function setScale(value) {
  state.scale = Number(value);
  document.querySelector(".study-app").style.setProperty("--reader-scale", state.scale);
  localStorage.setItem("upanishads-study:scale", String(state.scale));
}

function renderLibrary(data) {
  $("libraryList").innerHTML = dataSets.map((item) => `
    <button class="library-book ${item.slug === data.slug ? "active" : ""}" data-slug="${escapeHtml(item.slug)}" type="button">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${item.entryCount} entries · downloaded</span>
    </button>
  `).join("");

  document.querySelectorAll("[data-slug]").forEach((button) => {
    button.addEventListener("click", () => chooseData(button.dataset.slug));
  });
}

function renderStructure(data, entry) {
  const selectedSection = `${entry.chapter}.${entry.section}`;
  const groups = groupSections(data.sections);
  $("chapterCount").textContent = `${Object.keys(groups).length} groups`;

  $("tocList").innerHTML = Object.entries(groups).map(([chapter, sections]) => `
    <section class="toc-group">
      <div class="toc-title">${escapeHtml(data.shortTitle)} ${escapeHtml(chapter)}</div>
      ${sections.map((section) => `
        <button class="toc-row ${section.id === selectedSection ? "active" : ""}" data-entry="${section.startEntry}" type="button">
          <strong>${section.section === 0 ? "Invocation" : `Section ${escapeHtml(section.id)}`}</strong>
          <span>${section.entryCount} entries</span>
        </button>
      `).join("")}
    </section>
  `).join("");

  document.querySelectorAll("[data-entry]").forEach((button) => {
    button.addEventListener("click", () => chooseEntry(Number(button.dataset.entry)));
  });
}

function renderResults(data, entry) {
  const selectedSection = `${entry.chapter}.${entry.section}`;
  const query = state.query.trim().toLowerCase();
  const panel = document.querySelector(".results-panel");

  if (!query) {
    panel.hidden = true;
    $("resultsTitle").textContent = "Search Results";
    $("resultsCount").textContent = "0 entries";
    $("resultsList").innerHTML = "";
    return;
  }

  panel.hidden = false;
  const entries = query
    ? data.entries.filter((item) => includesQuery(item, query))
    : data.entries.filter((item) => `${item.chapter}.${item.section}` === selectedSection);

  $("resultsTitle").textContent = "Search Results";
  $("resultsCount").textContent = `${entries.length} entries`;
  $("resultsList").innerHTML = entries.map((item) => `
    <button class="result-row ${item.id === entry.id ? "active" : ""}" data-entry="${item.entryNumber}" type="button">
      <strong>${escapeHtml(item.reference)}</strong>
      <span>${escapeHtml(preview(item.translation || item.sanskrit))}</span>
    </button>
  `).join("");

  document.querySelectorAll("#resultsList [data-entry]").forEach((button) => {
    button.addEventListener("click", () => chooseEntry(Number(button.dataset.entry)));
  });
}

function textBlock(className, value) {
  return `<div class="${className}">${escapeHtml(value || "")}</div>`;
}

function renderLayer(data, entry, sectionTitle) {
  const heading = `${sectionTitle} · ${data.shortTitle} ${entry.reference}`;

  if (state.mode === "sanskrit") {
    return `
      <section class="read-content">
        <h4>Section Heading</h4>
        <div class="section-heading">${escapeHtml(heading)}</div>
        <h4>Verse</h4>
        ${textBlock("sanskrit-text", entry.sanskrit)}
      </section>
    `;
  }

  if (state.mode === "translation") {
    return `
      <section class="read-content">
        <div class="translation-box">
          <h4>English Translation</h4>
          ${textBlock("translation-text", entry.translation)}
        </div>
      </section>
    `;
  }

  if (state.mode === "words") {
    return `
      <section class="read-content">
        <div class="meaning-box">
          <h4>Word by Word Meaning</h4>
          ${textBlock("meaning-text", entry.wordMeanings || "Word by word meaning is not available for this entry.")}
        </div>
      </section>
    `;
  }

  if (state.mode === "notes") {
    return `
      <section class="read-content">
        <div class="notes-box">
          <h4>Sankaracharyas Commentary English Translation</h4>
          ${textBlock("notes-text", entry.notes || "Commentary is not available for this entry.")}
        </div>
      </section>
    `;
  }

  return `
    <section class="read-content">
      <div class="study-grid">
        <div class="main-text">
          <div class="section-heading">${escapeHtml(heading)}</div>
          <h4>Verse</h4>
          ${textBlock("sanskrit-text", entry.sanskrit)}
          <div class="translation-box">
            <h4>English Translation</h4>
            ${textBlock("translation-text", entry.translation)}
          </div>
        </div>
        <div class="side-layers">
          <div class="meaning-box">
            <h4>Word by Word Meaning</h4>
            ${textBlock("meaning-text", entry.wordMeanings || "Word by word meaning is not available for this entry.")}
          </div>
          <div class="notes-box">
            <h4>Sankaracharyas Commentary English Translation</h4>
            ${textBlock("notes-text", entry.notes || "Commentary is not available for this entry.")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderReader(data, entry) {
  const section = data.sections.find((item) => item.id === `${entry.chapter}.${entry.section}`);
  const bookmarks = getBookmarks(data);
  const sectionTitle = section?.title || `${data.shortTitle} ${entry.chapter}.${entry.section}`;
  const marked = bookmarks.includes(entry.id);

  $("reader").innerHTML = `
    <div class="read-toolbar">
      <div>
        <p class="eyebrow">${escapeHtml(sectionTitle)} · ${escapeHtml(entry.reference)}</p>
        <h3>${entry.verse === 0 ? "Opening Invocation" : `Verse ${entry.verse}`}</h3>
      </div>
      <div class="tools">
        <button id="prevButton" aria-label="Previous entry" class="tool-button" type="button">←</button>
        <button id="bookmarkButton" class="tool-button ${marked ? "marked" : ""}" type="button">Bookmark</button>
        <button id="nextButton" aria-label="Next entry" class="tool-button" type="button">→</button>
      </div>
    </div>
    <div class="mode-tabs" role="tablist" aria-label="Text layers">
      ${modes.map(([id, label]) => `
        <button class="${state.mode === id ? "active" : ""}" data-mode="${id}" role="tab" type="button">${label}</button>
      `).join("")}
      <label class="text-size">
        Text size
        <input id="scaleInput" aria-label="Text size" max="1.25" min="0.9" step="0.05" type="range" value="${state.scale}">
      </label>
    </div>
    ${renderLayer(data, entry, sectionTitle)}
  `;

  $("prevButton").addEventListener("click", () => move(-1));
  $("nextButton").addEventListener("click", () => move(1));
  $("bookmarkButton").addEventListener("click", toggleBookmark);
  $("scaleInput").addEventListener("input", (event) => setScale(event.target.value));
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
}

function render() {
  const data = currentData();
  const entry = currentEntry(data);
  document.querySelector(".study-app").style.setProperty("--reader-scale", state.scale);

  $("entryCount").textContent = data.entryCount;
  $("sectionCount").textContent = data.sections.length;
  $("bookmarkCount").textContent = getBookmarks(data).length;
  $("searchInput").value = state.query;

  renderLibrary(data);
  renderStructure(data, entry);
  renderReader(data, entry);
  renderResults(data, entry);
}

$("searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("service-worker.js").catch(() => undefined);
}

render();
