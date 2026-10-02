# DailyCare

A local, screenshot-ready caregiver app prototype based on the client brief. Plain HTML and CSS, local fonts and artwork, and a small vanilla JavaScript file. No dependencies or build step.

## Open it

Double-click **Start DailyCare.cmd**, or run `npm run dev` from this folder. No `npm install` is needed. Keep the terminal window open, then open **http://127.0.0.1:4173/care.html** for the phone app, or **http://127.0.0.1:4173** for all three screens.

Press `Ctrl+C` in that terminal when you want to stop the server. `npm start` works too.

- `/` — three mobile screen states arranged for a presentation screenshot.
- `/care.html` — standalone daily care app. Each routine starts unrecorded; scroll for mood, sleep, concerns, and an optional photo/note.
- `/care.html?detail=appetite` — the expanded appetite sheet.
- `/care.html?sample=1` and `/review.html?sample=1` — the same complete example day: meals eaten, medication given, calm mood, and restless sleep.
- `/system.html` — implementation-ready design tokens, components, and interaction states.

You can also open `dist/index.html` directly. Local file security varies by browser; use the server for the most reliable preview and draft transfer.

## Screenshots

Client-ready exports are in `client-screenshots/`. **DailyCare-complete-presentation.png** is the latest single-image presentation: six screen states with explanations, followed by the design system. It is **3200 × 12062** for readable details when zooming. A smaller **1600 × 6031** WebP is included.

**DailyCare-client-presentation.png** is a compact version: the matching entry, sleep detail, and review screens above colors, type, icons, and component states. It is an RGB PNG at **2040 × 3662**, under 1 MB. Numbered files contain the separate screens. These smaller exports satisfy the original 960px minimum, 2040px maximum width, 20,400px maximum height, and 8 MB per-image limit.

The editable presentation is `/client-presentation.html`. Export tooling is isolated in `.capture-tools/`; it adds no app dependencies. `node .capture-tools/capture.cjs` regenerates the screenshots when the local server is running.

The complete annotated presentation is `/complete-presentation.html`, styled by `presentation.css`. Run `node .capture-tools/export-complete.cjs` to render its PNG and WebP.

For a presentation image, open `/` at approximately **1440px wide** and take a full-page screenshot. It contains three live app frames. Each frame can be scrolled independently, and its buttons work.

For an individual iPhone screen, open `/care.html` or `/review.html?sample=1` in your browser's responsive mode at **390 × 844** or **430 × 932**. The screens scroll naturally. The primary action stays at the bottom. Use `?sample=1` on both entry and review for the matching example day; add `&detail=sleep` to see its follow-up sheet. The appetite sheet remains available at `/care.html?detail=appetite`.

In Chrome or Edge: press **F12**, then **Ctrl+Shift+M** to toggle the phone toolbar. Set the viewport to **390 × 844**. Use the device toolbar's three-dot menu to capture a screenshot. The app's hamburger menu links to daily care, review, all screens, and the design system.

## What works

- Individual meal answers, given/not given/refused for each medication dose, and a distinct shower-or-grooming choice. Each begins unrecorded.
- Date selection starts a fresh entry; person and caregiver are intentionally fixed demo identities.
- Mood, sleep, and concern choices are visible on the daily screen. Changed selections reveal optional follow-up detail.
- Focused detail sheets for appetite, medication, personal care, sleep, mood, wandering, sundowning, falls, pain, skin concerns, and other changes.
- Visual meal portion selection and optional notes.
- Local photo attachment and note editing.
- Review generated from the actual draft, with each meal and dose shown separately. Missing answers can be completed or explicitly sent as “not recorded.”
- Individual family recipient selection and a simulated send confirmation.

Nothing is sent to a family or backend. Demo identities and care entries are fictional. The active local draft uses sessionStorage; changing dates starts a fresh entry and replaces that draft. Presentation frames are isolated examples. This is a visual prototype, not a record-keeping system.

## Files

- `dist/index.html` — screenshot presentation
- `dist/care.html` — entry screen
- `dist/review.html` — review and preview confirmation
- `dist/system.html` — design-system reference
- `dist/client-presentation.html` — concise client presentation, with screens above the design system
- `dist/styles.css` — all design tokens and component styles
- `dist/app.js` — local prototype interactions
- `dist/assets/` — original generated artwork, fonts, and font licenses
- `DESIGN.md` — brief interpretation, reference notes, and implementation guidance
- `server.js` — dependency-free localhost-only static server

Run `npm run check` for JavaScript syntax validation.

## GitHub Pages client preview

The repository root is a standalone static mobile prototype. It needs no build step or server-side code.

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**, select the main branch and the **/(root)** folder, then save.
4. Share the generated GitHub Pages URL with the client.

The root `index.html` opens the DailyCare entry screen directly. `review.html`, `styles.css`, `app.js`, and `assets/` support the interactive flow. All demo data remains in the visitor's browser session and nothing is sent to a backend.
