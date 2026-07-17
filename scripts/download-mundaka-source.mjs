import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const sources = {
  "mundaka-upanishad": {
    title: "Mundaka Upanishad",
    shortTitle: "Mundaka",
    sourceUrl: "https://shlokam.org/text/mundaka-upanishad.htm",
    fileBase: "mundaka_upanishad_full",
  },
  "mandukya-upanishad": {
    title: "Mandukya Upanishad",
    shortTitle: "Mandukya",
    sourceUrl: "https://shlokam.org/text/mandukya-upanishad.htm",
    fileBase: "mandukya_upanishad_full",
  },
  "isha-upanishad": {
    title: "Isha Upanishad",
    shortTitle: "Isha",
    sourceUrl: "https://shlokam.org/text/isha-upanishad.htm",
    fileBase: "isha_upanishad_full",
  },
  "kena-upanishad": {
    title: "Kena Upanishad",
    shortTitle: "Kena",
    sourceUrl: "https://shlokam.org/text/kenopanishad.htm",
    fileBase: "kena_upanishad_full",
  },
  "katha-upanishad": {
    title: "Katha Upanishad",
    shortTitle: "Katha",
    sourceUrl: "https://shlokam.org/text/kathopanishad.htm",
    fileBase: "katha_upanishad_full",
  },
  "kaivalya-upanishad": {
    title: "Kaivalya Upanishad",
    shortTitle: "Kaivalya",
    sourceUrl: "https://shlokam.org/text/kaivalya-upanishad.htm",
    fileBase: "kaivalya_upanishad_full",
  },
  "taittiriya-upanishad": {
    title: "Taittiriya Upanishad",
    shortTitle: "Taittiriya",
    sourceUrl: "https://shlokam.org/text/taittiriya-upanishad.htm",
    fileBase: "taittiriya_upanishad_full",
  },
  "chandogya-upanishad": {
    title: "Chandogya Upanishad",
    shortTitle: "Chandogya",
    sourceUrl: "https://shlokam.org/text/chandogya-upanishad.htm",
    fileBase: "chandogya_upanishad_full",
  },
};

const requestedSlug = process.argv[2] ?? "mundaka-upanishad";
const requestedSource = sources[requestedSlug];

if (!requestedSource) {
  throw new Error(`Unknown source "${requestedSlug}". Add it to sources in scripts/download-mundaka-source.mjs.`);
}

const source = {
  slug: requestedSlug,
  ...requestedSource,
  downloadedAt: new Date().toISOString(),
};

const root = process.cwd();
const rawDir = join(root, "Basic Sources", "Shlokam", source.slug);
const dataDir = join(root, "WebApp", "data");

function decodeHtml(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, name) => named[name] ?? `&${name};`);
}

function htmlToText(value) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<a\b[^>]*><\/a>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
}

function captureField(sectionHtml, field) {
  const pattern = new RegExp(
    `<div class="detail-section" data-field="${field}">[\\s\\S]*?<div class="detail-text[^"]*">([\\s\\S]*?)<\\/div><\\/div>`,
    "i",
  );
  return htmlToText(sectionHtml.match(pattern)?.[1] ?? "");
}

function captureDescription(html) {
  const match = html.match(
    /<div class="detail-section" data-field="description">[\s\S]*?<div id="description-text"[^>]*>([\s\S]*?)<\/div>\s*<button/i,
  );
  return htmlToText(match?.[1] ?? "");
}

function cleanCommentary(value) {
  return value
    .replace(/^Sri Shankara's Commentary \(Bhashya\) translated by S\. Sitarama Sastri\s*/gim, "")
    .replace(/^Com\.\s*[—-]\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildSections(entries) {
  const sections = new Map();

  for (const entry of entries) {
    const key = `${entry.chapter}.${entry.section}`;
    if (!sections.has(key)) {
      sections.set(key, {
        id: key,
        title: `${source.shortTitle} ${entry.chapter}.${entry.section}`,
        chapter: entry.chapter,
        section: entry.section,
        startEntry: entry.entryNumber,
        entryCount: 0,
      });
    }
    sections.get(key).entryCount += 1;
  }

  return [...sections.values()];
}

async function writeJson(file, data) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

function buildPlainText(data) {
  const parts = [
    data.title,
    data.sourceUrl,
    "",
    "INTRODUCTION",
    data.introduction,
    "",
  ];

  for (const entry of data.entries) {
    parts.push(`${data.shortTitle.toUpperCase()} ${entry.reference}`);
    parts.push("Sanskrit");
    parts.push(entry.sanskrit);
    parts.push("");
    parts.push("Transliteration");
    parts.push(entry.transliteration);
    parts.push("");
    parts.push("English");
    parts.push(entry.english);
    parts.push("");
    parts.push("Translation");
    parts.push(entry.translation);
    parts.push("");
    parts.push("Word Meanings");
    parts.push(entry.wordMeanings);
    if (entry.notes) {
      parts.push("");
      parts.push("Notes");
      parts.push(entry.notes);
    }
    parts.push("");
  }

  return `${parts.join("\n").replace(/\n{4,}/g, "\n\n\n").trim()}\n`;
}

const response = await fetch(source.sourceUrl);
if (!response.ok) {
  throw new Error(`Unable to download ${source.sourceUrl}: ${response.status} ${response.statusText}`);
}

const html = await response.text();
const headers = Object.fromEntries(response.headers.entries());
const sectionMatches = [
  ...html.matchAll(/<div class="verse-section"([\s\S]*?)(?=<div class="verse-section"|<div class="detail-footer"|<\/body>)/g),
];

const entries = sectionMatches.map((match, index) => {
  const sectionHtml = match[0];
  const attrs = match[1];
  const attr = (name) => attrs.match(new RegExp(`data-${name}="([^"]*)"`))?.[1] ?? "";
  const chapter = Number(attr("chapter"));
  const section = Number(attr("section"));
  const verse = Number(attr("verse"));

  return {
    id: attr("content-id") || `${source.slug}-${chapter}-${section}-${verse}`,
    entryNumber: index + 1,
    chapter,
    section,
    verse,
    reference: `${chapter}.${section}.${verse}`,
    sanskrit: captureField(sectionHtml, "sanskrit"),
    transliteration: captureField(sectionHtml, "roman"),
    english: captureField(sectionHtml, "colloquial"),
    translation: captureField(sectionHtml, "translation"),
    wordMeanings: captureField(sectionHtml, "word_meaning"),
    notes: cleanCommentary(captureField(sectionHtml, "verse_notes")),
  };
});

const data = {
  ...source,
  introduction: captureDescription(html),
  entryCount: entries.length,
  numberedVerseCount: entries.filter((entry) => entry.verse > 0).length,
  sections: buildSections(entries),
  entries,
};

await mkdir(rawDir, { recursive: true });
await mkdir(dataDir, { recursive: true });

await writeFile(join(rawDir, "source.html"), html);
await writeJson(join(rawDir, "download-metadata.json"), {
  ...source,
  response: {
    status: response.status,
    statusText: response.statusText,
    headers,
  },
  counts: {
    entries: data.entryCount,
    numberedVerses: data.numberedVerseCount,
    sections: data.sections.length,
  },
});
await writeJson(join(dataDir, `${source.fileBase}.json`), data);
await writeFile(join(dataDir, `${source.fileBase}.txt`), buildPlainText(data));

console.log(`Downloaded ${data.entryCount} ${source.shortTitle} entries`);
console.log(join(rawDir, "source.html"));
console.log(join(dataDir, `${source.fileBase}.json`));
console.log(join(dataDir, `${source.fileBase}.txt`));
