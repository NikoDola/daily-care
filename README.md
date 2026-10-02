# DailyCare shared day prototype

This prototype shows two caregivers contributing to one resident’s day and reviewing one family update. It is a static demonstration. Records are kept in this browser session; there is no account system, cross-device sync, or message delivery.

## Run it

Double-click **Start DailyCare.cmd**, or run **npm run dev** in this folder. Open **http://127.0.0.1:4173/** for the interactive presentation or **http://127.0.0.1:4173/care.html** for the care screen. No installation or build step is needed. Press **Ctrl+C** to stop the local server.

## Explore the example day

- **/care.html?sample=morning** shows Anna at 10:00 AM. Breakfast, AM medication and restless sleep are recorded; lunch and dinner are later today.
- **/care.html?sample=handover** shows Maya after Anna saved her part. Anna’s entries remain attributed, while Maya’s evening answers are open.
- **/review.html?sample=complete** shows the full day, with entries from both caregivers.
- **/review.html?sample=missing** leaves PM medication unanswered and offers a link back or an explicit “not recorded” choice.
- **/family.html?sample=complete** previews the family update from that same completed day.
- **/complete-presentation.html** shows the annotated full story. **/client-presentation.html** is the shorter presentation.

In the care screen, tap Margaret’s name to switch residents or Anna/Maya in the header to switch the demonstration caregiver. Tap an open choice to record it; answered items close to a summary that can be reopened. Changes open a short context sheet. “Save my part” keeps the day in progress. The last caregiver can review and simulate sending one update.

The sample screens are deterministic examples. An unsuffixed care screen begins with no answers selected. Shower and grooming are separate; the usual state is text only. Medication uses given, not given or refused without medication names, doses, clinical times or vitals.

## Screenshots

The numbered PNGs in **client-screenshots/** show the morning, resident switcher, handover, evening choices, review, missing state, family view and appetite detail. **DailyCare-client-presentation.png** and **DailyCare-complete-presentation.png** bring those screens together.

With the local server running, use **node .capture-tools/capture.cjs** and then **node .capture-tools/export-complete.cjs** to refresh the exports. Run **npm run check** for JavaScript syntax validation.

The source pages are at the repository root. The deployed static site uses the matching pages under **dist/**.
