# Upanishads Study

A full text study app for the Upanishads, with a portable Mac app shell and a
PWA bundle. The app currently ships with eight downloaded Shlokam datasets.

## Current App

- Top Upanishad selector for all downloaded texts
- Structure navigator for each Upanishad
- Search across Sanskrit, translation, word meanings, and notes
- Reading modes for Study, Sanskrit, Translation, Word Meanings, and Notes
- Local bookmarks, reading position, and text-size preference
- PWA manifest and service worker for installable/offline-friendly use
- Portable universal Mac app at `build/Upanishads Study.app`

## Content

Downloaded data is stored at:

```text
WebApp/data/mundaka_upanishad_full.json
WebApp/data/mandukya_upanishad_full.json
WebApp/data/isha_upanishad_full.json
WebApp/data/kena_upanishad_full.json
WebApp/data/katha_upanishad_full.json
WebApp/data/kaivalya_upanishad_full.json
WebApp/data/taittiriya_upanishad_full.json
WebApp/data/chandogya_upanishad_full.json
```

The downloader is:

```bash
node scripts/download-mundaka-source.mjs mundaka-upanishad
node scripts/download-mundaka-source.mjs mandukya-upanishad
node scripts/download-mundaka-source.mjs isha-upanishad
node scripts/download-mundaka-source.mjs kena-upanishad
node scripts/download-mundaka-source.mjs katha-upanishad
node scripts/download-mundaka-source.mjs kaivalya-upanishad
node scripts/download-mundaka-source.mjs taittiriya-upanishad
node scripts/download-mundaka-source.mjs chandogya-upanishad
```

The current sources are Shlokam:

```text
https://shlokam.org/text/mundaka-upanishad.htm
https://shlokam.org/text/mandukya-upanishad.htm
```

To add another Upanishad, add its metadata/source URL in
`scripts/download-mundaka-source.mjs`, download the JSON file, then import it in
`app/page.tsx`.

## Development

```bash
npm install
npm run dev
npm run build
npm test
./build_mac_app.sh
./build_pwa_bundle.sh
```

Local development URL:

```text
http://localhost:3000/
```

## Build Outputs

```text
build/Upanishads Study.app
build/UpanishadsStudy_PWA.zip
build/UpanishadsStudy_GitHubPagesUpload.zip
build/GitHubPagesUpload/upanishads/
```
