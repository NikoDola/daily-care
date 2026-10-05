# DailyCare

DailyCare is an interactive Next.js prototype for recording a day of care and previewing a family update. The existing design and caregiver flow are served by Next.js App Router pages. The original HTML, CSS, and browser scripts remain the source for the visual prototype; `scripts/sync-public.cjs` copies browser assets into `public/` before each development or production build.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. On Windows, `Start DailyCare.cmd` starts the same development server. Run `npm run build` to verify the production build, or `npm run start` after building to preview it.

## Routes

- `/` and `/care.html` — interactive daily care entry.
- `/review.html` — review and simulated send.
- `/family.html` — family update preview.
- `/system.html` — design system.
- `/experience.html` — six live example screens together.
- Add `?sample=1` or a `?stage=...` query for the prepared example states.

The `.html` URLs are retained so existing links and the caregiver flow continue to work. The Next.js pages prerender during the build, while `day.js`, `app.js`, and `menu.js` run in the browser for interactions.

## Deploy to Vercel

Push this folder to GitHub and import it as a project in Vercel. Keep the root directory as this folder and the detected **Next.js** framework preset. Vercel runs `npm run build`; the `prebuild` script prepares the public assets. No environment variables are needed for the prototype.

## Current interaction scope

Visitors can record care, switch between the two sample caregivers, save a part, review the day, and see the resulting family update. Data is fictional and stored in browser `sessionStorage`, so it lasts only for that browser session. The send button produces a local preview; it does not deliver a message. A real shared client and caregiver workflow would require authentication, a database, and a delivery service before using real care information.

## Source files

- `app/` — Next.js routes and browser script loader.
- `index.html`, `care.html`, `review.html`, `family.html`, `system.html` — page markup.
- `styles.css`, `shifts.css`, `assets/` — design assets.
- `day.js`, `app.js`, `menu.js` — interactive browser behavior.
- `dist/` and `client-screenshots/` — earlier presentation exports; they are not part of the Next.js app.
