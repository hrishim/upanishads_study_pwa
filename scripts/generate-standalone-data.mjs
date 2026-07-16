import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
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

const dataSets = [];

for (const file of files) {
  const data = JSON.parse(await readFile(join(root, "WebApp", "data", file), "utf8"));
  dataSets.push(data);
}

const output = `window.UPANISHAD_DATA = ${JSON.stringify(dataSets)};\n`;
await writeFile(join(root, "WebApp", "data.js"), output);

console.log(`Generated WebApp/data.js with ${dataSets.length} Upanishads`);
