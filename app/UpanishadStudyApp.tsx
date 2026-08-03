"use client";

import { useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  entryNumber: number;
  chapter: number;
  section: number;
  verse: number;
  reference: string;
  sanskrit: string;
  transliteration: string;
  english: string;
  translation: string;
  wordMeanings: string;
  notes: string;
};

type SourceSection = {
  id: string;
  title: string;
  chapter: number;
  section: number;
  startEntry: number;
  entryCount: number;
};

type UpanishadData = {
  slug: string;
  title: string;
  sourceUrl: string;
  downloadedAt: string;
  introduction: string;
  entryCount: number;
  numberedVerseCount: number;
  sections: SourceSection[];
  entries: Entry[];
};

const modes = [
  { id: "sanskrit", label: "Moola / Verse" },
  { id: "translation", label: "Meaning" },
  { id: "words", label: "Word by Word Meaning" },
  { id: "notes", label: "Sankaracharya Commentary" },
] as const;

type Mode = (typeof modes)[number]["id"];

function storageKey(slug: string, key: string) {
  return `upanishads-study:${slug}:${key}`;
}

function cleanPreview(value: string, length = 116) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > length ? `${normalized.slice(0, length)}...` : normalized;
}

function includesQuery(entry: Entry, query: string) {
  return [
    entry.reference,
    entry.sanskrit,
    entry.translation,
    entry.wordMeanings,
    entry.notes,
  ].some((value) => value.toLowerCase().includes(query));
}

function groupSections(sections: SourceSection[]) {
  return sections.reduce<Record<number, SourceSection[]>>((groups, section) => {
    groups[section.chapter] = groups[section.chapter] ?? [];
    groups[section.chapter].push(section);
    return groups;
  }, {});
}

export function UpanishadStudyApp({ dataSets }: { dataSets: UpanishadData[] }) {
  const [activeSlug, setActiveSlug] = useState(dataSets[0]?.slug ?? "");
  const [selectedEntryNumber, setSelectedEntryNumber] = useState(5);
  const [mode, setMode] = useState<Mode>("sanskrit");
  const [query, setQuery] = useState("");
  const [fontScale, setFontScale] = useState(1);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showIntroduction, setShowIntroduction] = useState(false);
  const data = dataSets.find((item) => item.slug === activeSlug) ?? dataSets[0];
  const libraryItems = dataSets.map((item) => ({
      title: item.title,
      subtitle: `${item.entryCount} entries · downloaded from Shlokam`,
      active: item.slug === data.slug,
      slug: item.slug,
      available: true,
    }));

  useEffect(() => {
    const savedEntry = Number(localStorage.getItem(storageKey(data.slug, "entry")));
    const savedMode = localStorage.getItem(storageKey(data.slug, "mode")) as Mode | null;
    const savedScale = Number(localStorage.getItem(storageKey(data.slug, "scale")));
    const savedBookmarks = localStorage.getItem(storageKey(data.slug, "bookmarks"));

    if (Number.isFinite(savedEntry) && data.entries.some((entry) => entry.entryNumber === savedEntry)) {
      setSelectedEntryNumber(savedEntry);
    } else {
      setSelectedEntryNumber(data.entries.find((entry) => entry.verse > 0)?.entryNumber ?? data.entries[0]?.entryNumber ?? 1);
    }
    if (savedMode && modes.some((item) => item.id === savedMode)) {
      setMode(savedMode);
    }
    if (Number.isFinite(savedScale) && savedScale >= 0.9 && savedScale <= 1.25) {
      setFontScale(savedScale);
    }
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
    setQuery("");
    setShowIntroduction(false);
  }, [data.entries, data.slug]);

  useEffect(() => {
    localStorage.setItem(storageKey(data.slug, "entry"), String(selectedEntryNumber));
  }, [data.slug, selectedEntryNumber]);

  useEffect(() => {
    localStorage.setItem(storageKey(data.slug, "mode"), mode);
  }, [data.slug, mode]);

  useEffect(() => {
    localStorage.setItem(storageKey(data.slug, "scale"), String(fontScale));
  }, [data.slug, fontScale]);

  useEffect(() => {
    localStorage.setItem(storageKey(data.slug, "bookmarks"), JSON.stringify(bookmarks));
  }, [bookmarks, data.slug]);

  const selectedEntry = data.entries.find((entry) => entry.entryNumber === selectedEntryNumber) ?? data.entries[0];
  const selectedSection = `${selectedEntry.chapter}.${selectedEntry.section}`;
  const selectedSectionInfo = data.sections.find((section) => section.id === selectedSection);
  const sectionsByChapter = useMemo(() => groupSections(data.sections), [data.sections]);
  const normalizedQuery = query.trim().toLowerCase();
  const sectionEntries = useMemo(
    () => data.entries.filter((entry) => `${entry.chapter}.${entry.section}` === selectedSection),
    [data.entries, selectedSection],
  );
  const results = useMemo(
    () => (normalizedQuery ? data.entries.filter((entry) => includesQuery(entry, normalizedQuery)) : sectionEntries),
    [data.entries, normalizedQuery, sectionEntries],
  );

  const bookmarked = bookmarks.includes(selectedEntry.id);

  function chooseEntry(entryNumber: number) {
    setSelectedEntryNumber(entryNumber);
    setShowIntroduction(false);
  }

  function move(delta: number) {
    const index = data.entries.findIndex((entry) => entry.entryNumber === selectedEntry.entryNumber);
    const next = data.entries[Math.min(Math.max(index + delta, 0), data.entries.length - 1)];
    chooseEntry(next.entryNumber);
  }

  function toggleBookmark() {
    setBookmarks((current) =>
      current.includes(selectedEntry.id)
        ? current.filter((id) => id !== selectedEntry.id)
        : [...current, selectedEntry.id],
    );
  }

  return (
    <main className="study-app" style={{ "--reader-scale": fontScale } as React.CSSProperties}>
      <header className="library-topbar">
        <div className="app-heading">
          <h1>Upanishads Study</h1>
          <p className="source-line">Section headings · verses · word-by-word meaning · English translation · Sankaracharya commentary</p>
        </div>

        <nav className="library-list" aria-label="Upanishads">
          {libraryItems.map((item) => (
            <button
              className={item.active ? "library-book active" : "library-book"}
              disabled={!item.available}
              key={item.title}
              onClick={() => item.available && setActiveSlug(item.slug)}
              type="button"
            >
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </button>
          ))}
        </nav>

        <label className="search-box top-search">
          <span>Search the full text</span>
          <input
            aria-label="Search the full Mundaka Upanishad"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search verse, meaning, word meanings..."
            type="search"
            value={query}
          />
        </label>
      </header>

      <section className="study-main">
        <section className="stats" aria-label="Downloaded source summary">
          <div className="stat">
            <strong>{data.entryCount}</strong>
            <span>source entries</span>
          </div>
          <div className="stat">
            <strong>{data.sections.length}</strong>
            <span>sections</span>
          </div>
          <div className="stat">
            <strong>4</strong>
            <span>display views</span>
          </div>
          <div className="stat">
            <strong>{bookmarks.length}</strong>
            <span>bookmarks</span>
          </div>
        </section>

        <section className="reader-layout">
          <aside className="panel structure-panel" aria-label="Mundaka structure">
            <div className="panel-header">
              <strong>Structure</strong>
              <span>{Object.keys(sectionsByChapter).length} Mundakas</span>
            </div>

            <div className="toc-list">
              <button className={showIntroduction ? "toc-row active" : "toc-row"} onClick={() => setShowIntroduction(true)} type="button">
                <strong>Introduction</strong>
                <span>Overview and Shankara introduction</span>
              </button>

              {Object.entries(sectionsByChapter).map(([chapter, sections]) => (
                <section className="toc-group" key={chapter}>
                  <div className="toc-title">Mundaka {chapter}</div>
                  {sections.map((section) => (
                    <button
                      className={section.id === selectedSection && !showIntroduction ? "toc-row active" : "toc-row"}
                      key={section.id}
                      onClick={() => chooseEntry(section.startEntry)}
                      type="button"
                    >
                      <strong>{section.section === 0 ? "Invocation" : `Section ${section.id}`}</strong>
                      <span>{section.entryCount} entries</span>
                    </button>
                  ))}
                </section>
              ))}
            </div>
          </aside>

          <article className="panel read-panel">
            {showIntroduction ? (
              <Introduction data={data} />
            ) : (
              <>
                <div className="read-toolbar">
                  <div>
                    <p className="eyebrow">
                      {selectedSectionInfo?.title ?? `${data.shortTitle} ${selectedEntry.chapter}.${selectedEntry.section}`} ·{" "}
                      {selectedEntry.reference}
                    </p>
                    <h3>{selectedEntry.verse === 0 ? "Opening Invocation" : `Verse ${selectedEntry.verse}`}</h3>
                  </div>
                  <div className="tools">
                    <button aria-label="Previous entry" className="tool-button" onClick={() => move(-1)} type="button">
                      ←
                    </button>
                    <button className={bookmarked ? "tool-button marked" : "tool-button"} onClick={toggleBookmark} type="button">
                      Bookmark
                    </button>
                    <button aria-label="Next entry" className="tool-button" onClick={() => move(1)} type="button">
                      →
                    </button>
                  </div>
                </div>

                <div className="mode-tabs" role="tablist" aria-label="Text layers">
                  {modes.map((item) => (
                    <button
                      aria-selected={mode === item.id}
                      className={mode === item.id ? "active" : ""}
                      key={item.id}
                      onClick={() => setMode(item.id)}
                      role="tab"
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                  <label className="text-size">
                    Text size
                    <input
                      aria-label="Text size"
                      max="1.25"
                      min="0.9"
                      onChange={(event) => setFontScale(Number(event.target.value))}
                      step="0.05"
                      type="range"
                      value={fontScale}
                    />
                  </label>
                </div>

                <ReadingLayer
                  entry={selectedEntry}
                  mode={mode}
                  sectionTitle={selectedSectionInfo?.title ?? selectedSection}
                  shortTitle={data.shortTitle}
                />
              </>
            )}
          </article>

          {normalizedQuery ? (
            <aside className="panel results-panel" aria-label="Search results and entries">
              <div className="panel-header">
                <strong>Search Results</strong>
                <span>{results.length} entries</span>
              </div>

              <div className="results-list">
                {results.map((entry) => (
                  <button
                    className={entry.id === selectedEntry.id && !showIntroduction ? "result-row active" : "result-row"}
                    key={entry.id}
                    onClick={() => chooseEntry(entry.entryNumber)}
                    type="button"
                  >
                    <strong>{entry.reference}</strong>
                    <span>{cleanPreview(entry.translation || entry.sanskrit)}</span>
                  </button>
                ))}
              </div>
            </aside>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function Introduction({ data }: { data: UpanishadData }) {
  return (
    <section className="intro-content">
      <p className="eyebrow">Overview</p>
      <h3>Mundaka Upanishad Introduction</h3>
      <TextBlock className="intro-text" value={data.introduction} />
      <a className="source-link" href={data.sourceUrl} rel="noreferrer" target="_blank">
        Source: Shlokam.org
      </a>
    </section>
  );
}

function ReadingLayer({
  entry,
  mode,
  sectionTitle,
  shortTitle,
}: {
  entry: Entry;
  mode: Mode;
  sectionTitle: string;
  shortTitle: string;
}) {
  if (mode === "sanskrit") {
    return (
      <section className="read-content">
        <h4>Section Heading</h4>
        <div className="section-heading">{sectionTitle} · {shortTitle} {entry.reference}</div>
        <h4>Verse</h4>
        <TextBlock className="sanskrit-text" value={entry.sanskrit} />
      </section>
    );
  }

  if (mode === "translation") {
    return (
      <section className="read-content">
        <div className="translation-box">
          <h4>Meaning</h4>
          <TextBlock className="translation-text" value={entry.translation} />
        </div>
      </section>
    );
  }

  if (mode === "words") {
    return (
      <section className="read-content">
        <div className="meaning-box">
          <h4>Word by Word Meaning</h4>
          <TextBlock className="meaning-text" value={entry.wordMeanings} />
        </div>
      </section>
    );
  }

  if (mode === "notes") {
    return (
      <section className="read-content">
        <div className="notes-box">
          <h4>Sankaracharya Commentary</h4>
          <TextBlock className="notes-text" value={entry.notes || "No notes are available for this entry."} />
        </div>
      </section>
    );
  }

  return (
    <section className="read-content">
      <h4>Section Heading</h4>
      <div className="section-heading">{sectionTitle} · {shortTitle} {entry.reference}</div>
      <h4>Verse</h4>
      <TextBlock className="sanskrit-text" value={entry.sanskrit} />
    </section>
  );
}

function TextBlock({ className, value }: { className: string; value: string }) {
  return <div className={className}>{value}</div>;
}
