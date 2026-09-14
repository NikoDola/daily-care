# DailyCare design direction

## Core decision

Treat the daily update like a small care journal. The ordinary day should feel light. Exceptions deserve more space only when the caregiver asks for it. Open rows and thin separators replace a dashboard of component cards.

The warm paper background, olive actions, peach family-summary header, expressive mood controls, and original textured illustrations interpret the references without copying a supplied screen. Serif titles and notes provide warmth; DM Sans keeps controls clear.

## References reviewed

- Client's full pasted brief: all seven caregiver jobs and the design-system requirement were incorporated.
- [Existing DailyCare website](https://dailycare.inktree.ai/): retrieved successfully after initial connection failure. The current public page is a letter and family-interview page, not the working caregiver app. Its language emphasizes hearing about ordinary moments, meals, mood, and activities. The brief's existing-app screenshots were not in the attachment.
- [Lavanya Maddala wellness interaction reference](https://dribbble.com/shots/19717548-Wellness-app-UI-design-Micro-Interaction): page text reviewed; full shot artwork could not be retrieved. Its interaction brief supported lightweight choices.
- [Supplied relaxing-palette image](https://cdn.sanity.io/images/ordgikwe/production/37a9dd959d5ecb6d134be4249bad22cbb532011e-1600x1200.png?w=1920&q=75&auto=format): downloaded to references/relaxing-palette.png and visually inspected. Warm serif typography, airy canvas, and human illustration influenced the visual language.
- [Supplied mood illustration image](https://i.pinimg.com/736x/74/6e/fc/746efcb3a23c5164e20bb8f19787fc49.jpg): downloaded to references/mood-inspiration.jpg and visually inspected. Distinct expressions plus color communicate mood before reading labels.
- [Nedux mental-health reference](https://dribbble.com/shots/25487497-Mental-Health-Wellness-App-UI-Design): page and published palette reviewed. Full shot artwork could not be retrieved. Olive, warm neutrals, simple hierarchy, and a calm mood were relevant.
- [Headspace](https://www.headspace.com/): public page reviewed for approachable everyday-wellness framing.

Reference images are research material only and are not used as app artwork. The six-illustration sheet in dist/assets is original generated artwork. DM Sans and Lora are bundled with their SIL Open Font Licenses.

## Information hierarchy

1. Person, caregiver, and date stay explicit.
2. Everyday care groups six routines into meals, medication, and a distinct shower-or-grooming personal-care choice.
3. A single mood choice conveys the feel of the day.
4. Optional changes open focused detail sheets. Clinical concern names appear only after “Something else.”
5. The personal note/photo is optional.
6. Review separates routine completion, notable changes, unrecorded items, and the personal moment.
7. Family recipients are visible and individually selectable before the simulated send.

## Components and states

The visible system page uses the exact shared CSS classes. CSS tokens at the top of styles.css define colors, font families, spacing, radii, and duration. App-specific reading-scale rules at the end set responsive sizes.

| Component | Class | States |
| --- | --- | --- |
| Primary action | `.primary-button` | Default, hover, focus-visible, pressed, disabled |
| Routine toggle | `.routine-toggle` | Unrecorded, recorded (`aria-pressed`), hover, focus |
| Mood choice | `.mood-choice` | Default, selected (`aria-pressed`), hover, focus |
| Optional-change trigger | `.change-options`, `[data-detail]` | Collapsed, detail sheet open, saved detail |
| Meal selector | `.segmented-control` | Native radio, checked, keyboard focus |
| Portion selector | `.portion-option` | Native radio, filled-plate quantity, checked, keyboard focus |
| Detail sheet | `.detail-dialog` | Open/closed, save/cancel, remove saved detail |
| Review summary | `.summary-row` | Recorded, explicit exception, not recorded |
| Change summary | `.change-summary` | Change type, selected value, optional note |
| Recipient | `.recipient` | Selected/unselected native checkbox, focus |
| Feedback | `.toast`, `.sent-dialog` | Local saved feedback, simulated send confirmation |

Native dialogs manage keyboard focus. Buttons expose accessible names and pressed state; radio and checkbox inputs stay semantic. Status is never communicated solely by color. Reduced-motion preferences remove animations.

## Prototype limits

This is intentionally local and lightweight. No authentication, backend, real messaging, durable care history, or provider integration. One fixed demo person, caregiver, and pair of recipients. Session storage is an active-draft convenience, not medical-record storage. Attached photos remain local. Photo size is limited to 4 MB for the demo. A different care date starts a fresh draft.

The presentation page isolates each iframe's sample state. It shows an ordinary partial entry, an appetite-detail overlay, and a completed sample update; these are independent design states rather than a claim that the same data is mirrored between all three.

## Validation scope

Local routes, asset references, unique IDs, HTML parsing, font loading references, and JavaScript syntax were checked. Client exports were subsequently rendered in isolated headless Chromium with iPhone emulation at a 390px viewport and 3× scale. The capture pass reported no page errors and no horizontal overflow. The main screens, detail states, navigation menu, design system, and combined presentation were visually inspected. This is screenshot validation, not a full end-to-end interaction test suite.

The concise client presentation is in `dist/client-presentation.html`; final RGB PNGs are in `client-screenshots/`. The numbered screens and concise presentation match the original upload limits.

The later complete presentation, `dist/complete-presentation.html`, combines all six screen states with brief explanations and the visual design system. Its PNG and lossless WebP masters are 3200 × 9614, intentionally wider than the original limit to preserve detail as the user requested. Its layout was checked for missing images, clipping, and browser errors, and visually inspected in three sections.
