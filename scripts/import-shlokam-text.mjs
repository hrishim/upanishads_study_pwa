import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sources = {
  mundaka: {
    title: "Mundaka Upanishad",
    subtitle: "Atharva Veda",
    sourceUrl: "https://shlokam.org/text/mundaka-upanishad.htm",
    status: "available",
    order: 1,
  },
};

const slug = process.argv[2] ?? "mundaka";
const source = sources[slug];

if (!source) {
  throw new Error(`Unknown source "${slug}". Add it to scripts/import-shlokam-text.mjs first.`);
}

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

function buildSections(verses) {
  const sections = new Map();

  for (const verse of verses) {
    const key = `${verse.chapter}.${verse.section}`;
    if (!sections.has(key)) {
      sections.set(key, {
        id: key,
        title: `Mundaka ${verse.chapter}.${verse.section}`,
        chapter: verse.chapter,
        section: verse.section,
        startIndex: verse.index,
        verseCount: 0,
      });
    }
    sections.get(key).verseCount += 1;
  }

  return [...sections.values()];
}

const response = await fetch(source.sourceUrl);
if (!response.ok) {
  throw new Error(`Unable to fetch ${source.sourceUrl}: ${response.status}`);
}

const html = await response.text();
const verseMatches = [...html.matchAll(/<div class="verse-section"([\s\S]*?)(?=<div class="verse-section"|<div class="detail-footer"|<\/body>)/g)];

const verses = verseMatches.map((match, index) => {
  const sectionHtml = match[0];
  const attrs = match[1];
  const attr = (name) => attrs.match(new RegExp(`data-${name}="([^"]*)"`))?.[1] ?? "";
  const chapter = Number(attr("chapter"));
  const section = Number(attr("section"));
  const verse = Number(attr("verse"));

  return {
    id: attr("content-id") || `${slug}-${chapter}-${section}-${verse}`,
    index,
    chapter,
    section,
    verse,
    reference: verse === 0 ? `${chapter}.${section}.0` : `${chapter}.${section}.${verse}`,
    sanskrit: captureField(sectionHtml, "sanskrit"),
    transliteration: captureField(sectionHtml, "roman"),
    english: captureField(sectionHtml, "colloquial"),
    translation: captureField(sectionHtml, "translation"),
    wordMeaning: captureField(sectionHtml, "word_meaning"),
    commentary: captureField(sectionHtml, "verse_notes"),
  };
});

const upanishad = {
  ...source,
  slug,
  intro: captureDescription(html),
  totalVerses: verses.filter((verse) => verse.verse > 0).length,
  cardCount: verses.length,
  sections: buildSections(verses),
  verses,
};

const outputPath = new URL(`../data/upanishads/${slug}.json`, import.meta.url);
const outputFile = fileURLToPath(outputPath);
await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(upanishad, null, 2)}\n`);

console.log(`Imported ${upanishad.cardCount} entries for ${source.title} into ${outputFile}`);
