import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Upanishad study app", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Upanishads Study<\/title>/i);
  assert.match(html, /Mundaka Upanishad/);
  assert.match(html, /Upanishads Study/);
  assert.match(html, /source entries/);
  assert.match(html, /Word by Word/);
  assert.match(html, /Sankaracharyas Commentary English Translation/);
  assert.doesNotMatch(html, /Workspace|workspace/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("ships Mundaka as full downloaded structured data", async () => {
  const source = await readFile(new URL("../WebApp/data/mundaka_upanishad_full.json", import.meta.url), "utf8");
  const data = JSON.parse(source);

  assert.equal(data.slug, "mundaka-upanishad");
  assert.equal(data.title, "Mundaka Upanishad");
  assert.equal(data.entryCount, 64);
  assert.equal(data.numberedVerseCount, 63);
  assert.equal(data.sections.length, 7);
  assert.equal(data.entries[4].reference, "1.1.4");
  assert.match(data.entries[4].wordMeanings, /द्वे/);
});

test("ships Mandukya as full downloaded structured data", async () => {
  const source = await readFile(new URL("../WebApp/data/mandukya_upanishad_full.json", import.meta.url), "utf8");
  const data = JSON.parse(source);

  assert.equal(data.slug, "mandukya-upanishad");
  assert.equal(data.title, "Mandukya Upanishad");
  assert.equal(data.entryCount, 13);
  assert.equal(data.numberedVerseCount, 12);
  assert.equal(data.sections.length, 1);
  assert.equal(data.entries.at(-1).reference, "0.0.12");
  assert.match(data.entries.at(-1).translation, /soundless/i);
});

test("ships all downloaded Upanishad datasets", async () => {
  const expectations = [
    ["mundaka_upanishad_full.json", "Mundaka Upanishad", 64],
    ["mandukya_upanishad_full.json", "Mandukya Upanishad", 13],
    ["isha_upanishad_full.json", "Isha Upanishad", 19],
    ["kena_upanishad_full.json", "Kena Upanishad", 37],
    ["katha_upanishad_full.json", "Katha Upanishad", 121],
    ["kaivalya_upanishad_full.json", "Kaivalya Upanishad", 26],
    ["taittiriya_upanishad_full.json", "Taittiriya Upanishad", 54],
    ["chandogya_upanishad_full.json", "Chandogya Upanishad", 621],
  ];

  for (const [file, title, entryCount] of expectations) {
    const source = await readFile(new URL(`../WebApp/data/${file}`, import.meta.url), "utf8");
    const data = JSON.parse(source);
    assert.equal(data.title, title);
    assert.equal(data.entryCount, entryCount);
    assert.ok(data.shortTitle);
    assert.ok(data.entries.length > 0);
    assert.ok(data.entries.every((entry) => entry.sanskrit));
    assert.ok(data.entries.every((entry) => entry.translation));
  }
});

test("bundles Devanagari fonts for Vedic marks", async () => {
  await access(new URL("../WebApp/fonts/NotoSansDevanagari-Regular.ttf", import.meta.url));
  await access(new URL("../WebApp/fonts/NotoSansDevanagari-SemiBold.ttf", import.meta.url));
  await access(new URL("../WebApp/fonts/NotoSansDevanagari-Bold.ttf", import.meta.url));

  const css = await readFile(new URL("../WebApp/styles.css", import.meta.url), "utf8");
  assert.match(css, /Noto Sans Devanagari Local/);

  const source = await readFile(new URL("../WebApp/data/mundaka_upanishad_full.json", import.meta.url), "utf8");
  assert.match(source, /ꣳ/);
});

test("does not show commentary source headers in app data", async () => {
  const files = [
    "mundaka_upanishad_full.json",
    "mandukya_upanishad_full.json",
    "isha_upanishad_full.json",
    "kena_upanishad_full.json",
    "katha_upanishad_full.json",
    "kaivalya_upanishad_full.json",
    "taittiriya_upanishad_full.json",
    "chandogya_upanishad_full.json",
  ];

  for (const file of files) {
    const source = await readFile(new URL(`../WebApp/data/${file}`, import.meta.url), "utf8");
    const data = JSON.parse(source);
    assert.doesNotMatch(source, /Sri Shankara's Commentary \(Bhashya\) translated by S\. Sitarama Sastri/);
    assert.ok(data.entries.every((entry) => !/^Com\.\s*[—-]/m.test(entry.notes || "")));
  }
});
