# DailyCare

A local, screenshot-ready caregiver app prototype based on the client brief. Plain HTML and CSS, local fonts and artwork, and a small vanilla JavaScript file. No dependencies or build step.

## Open it

Double-click **Start DailyCare.cmd**, or run `npm run dev` from this folder. No `npm install` is needed. Keep the terminal window open, then open **http://127.0.0.1:4173/care.html** for the phone app, or **http://127.0.0.1:4173** for all six screens.

Press `Ctrl+C` in that terminal when you want to stop the server. `npm start` works too.

- `/` — six mobile screen states arranged for a presentation screenshot.
- `/care.html` — standalone daily care app. Each observation starts unrecorded; save your part for the next caregiver.
- `/care.html?detail=appetite` — the expanded appetite sheet.
- `/care.html?sample=1` and `/review.html?sample=1` — the same complete example day, including both caregivers and the personal moment.
- `/system.html` — implementation-ready design tokens, components, and interaction states.

You can also open `dist/index.html` directly. Local file security varies by browser; use the server for the most reliable preview and draft transfer.

## Shared caregiver flow

The original design is preserved. Use the menu to switch between Anna Lewis (morning) and Jane Doe (final shift). A fresh day has no answers selected. Every item's choices remain open for both caregivers. Completed answers stay selected and show who recorded them, with no extra Record now or Review tap. Shower and grooming are separate items.

1. Anna records observed care. Lunch, dinner and PM medication initially show Later today.
2. Save my part stores her contribution and confirms that nothing has been sent.
3. Continue to Jane's shift to see the same day and the remaining choices.
4. Jane reviews all recorded care and either completes gaps or explicitly includes them as not recorded.
5. The simulated send opens a family update built from those exact entries, including the recorded moment and caregiver names.

## Matching example screens

- `/care.html?stage=morning` - breakfast recorded by Anna; observations open.
- `/care.html?stage=anna-end` - Anna's completed part, including restless sleep and her personal note.
- `/care.html?stage=saved` - Save my part confirmation.
- `/care.html?stage=handover` - Jane's shift, with dinner and PM medication open.
- `/review.html?stage=final` - the whole completed day.
- `/family.html?stage=family` - the matching family update.
- `/review.html?stage=gap` and `/family.html?stage=family-gap` - a clearly labelled alternative with PM medication not recorded.

Explicit stage links reset the example to that point. Ordinary app navigation carries the actual edited record forward. The all-screens page presents the complete journey.

## Screenshots and presentation

The updated individual screenshots are `01-morning.png`, `02-anna-end.png`, `03-handover.png`, `04-final-review.png`, `05-family-update.png`, `06-caregiver-menu.png`, `07-saved-part.png`, `08-missing-review.png`, `09-family-with-gap.png` and `10-sleep-detail.png` in `client-screenshots/`.

The current combined exports are `DailyCare-client-presentation.png` and `DailyCare-complete-presentation.png`. Editable boards are `/client-presentation.html` and `/complete-presentation.html`. Their existing visual layouts are preserved, with new screenshots and explanations.

With the local server running, `node .capture-tools/capture.cjs` runs the actual Anna-to-Jane flow and captures its screens. `node .capture-tools/export-complete.cjs` exports both presentation boards. Browser export dependencies are isolated in `.capture-tools/node_modules/`.

Run `npm run check` for JavaScript syntax validation. The flow check covers caregiver attribution, reviewing prior answers without re-recording, scheduled versus missing items, recording gaps, completion links and the matching family update.

## Prototype limits

All data is fictional. This is a local visual prototype using sessionStorage for one active day. Switching caregivers demonstrates a handover in the same browser session, without authentication or cross-device synchronization. Selecting another date starts a new draft. Sending is simulated; no messages go to a family or backend.

The app uses plain HTML, CSS and JavaScript. `styles.css` remains the approved visual foundation, `shifts.css` adds the new states, `day.js` holds the shared record, and `app.js` renders it. Root mobile pages are mirrored into `dist/`, which the local server and Sites serve. `dist/index.html` is the all-screens presentation.

## GitHub Pages client preview

The repository root is a standalone static mobile prototype. It needs no build step or server-side code.

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**, select the main branch and the **/(root)** folder, then save.
4. Share the generated GitHub Pages URL with the client.

The root `index.html` opens the DailyCare entry screen directly. `review.html`, `styles.css`, `app.js`, and `assets/` support the interactive flow. All demo data remains in the visitor's browser session and nothing is sent to a backend.
