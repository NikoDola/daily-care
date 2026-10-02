/* Keep the existing presentation layouts aligned with the shared-day scenario. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'dist');
const screens = [
  ['01-morning', 'Morning recording', 'ANNA’S MORNING SHIFT', 'Record what Anna has observed.', 'Anna records breakfast, AM medication given, calm mood, restless sleep with a note, and no concerns. Lunch and the evening care are still later today.'],
  ['02-anna-end', 'Anna’s completed part', 'SAVED, READY FOR HANDOVER', 'A saved record, ready to read.', 'Anna has saved breakfast, lunch, AM medication, calm mood, restless sleep and a moment about Margaret’s roses. Her answers appear as information. Only Anna can use Edit my entries to change them.'],
  ['03-handover', 'Jane’s handover', 'THE SAME DAY, NEXT SHIFT', 'Pick up where Anna left off.', 'Jane sees Anna’s saved answers without editing controls. Mood offers Add a later mood observation so Jane can record a new mood under her own name. Dinner, PM medication, bathing and grooming remain open.'],
  ['04-final-review', 'Final-shift review', 'JANE REVIEWS THE WHOLE DAY', 'One review, both caregivers.', 'Anna observed Calm in the morning; Jane later observed Cheerful. Jane records a good dinner, PM medication given, a bath and grooming. The review preserves Anna’s restless sleep note before one daily update goes to Sophie and James.'],
  ['05-family-update', 'The family update', 'ONE DAY, SHARED', 'Begin with a recorded moment.', 'The conversation about roses leads the update. Anna’s Calm morning and Jane’s Cheerful later observation appear in order, followed by the rest of Margaret’s recorded day. Anna Lewis and Jane Doe sign it.'],
  ['08-missing-review', 'A recording gap', 'ALTERNATIVE ENDING', 'Name what was not recorded.', 'In this alternative, grooming has no answer. Jane can complete it or explicitly send it marked not recorded. The two mood observations, dinner, PM medication and bath remain recorded.'],
  ['07-saved-part', 'Save my part', 'NOTHING SENT TO THE FAMILY', 'Keep care ready for handover.', 'Anna’s save confirmation explains that her entries are saved and nothing has been sent to the family. She can return to her completed part or continue to Jane’s shift.'],
  ['09-family-with-gap', 'An honest family update', 'THE SAME ALTERNATIVE ENDING', 'The gap carries through.', 'The family sees that grooming was not recorded. The update preserves the same recorded personal moment, sleep note, meals, medication and bath.'],
  ['06-caregiver-menu', 'Caregiver identity', 'WITHIN THE EXISTING MENU', 'Keep the person and their role clear.', 'Margaret stays the resident. The active caregiver appears beneath her name and within the menu with an initials avatar, role and full name.']
];
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const write = (name, text) => fs.writeFileSync(path.join(root, name), text);
const number = index => String(index + 1).padStart(2, '0');
const compact = '<section class="export-screens" aria-label="The shared care day">' + screens.slice(0, 6).map(([file,title],index) => `<div><div class="export-label"><span class="number">${number(index)}</span><h2>${title}</h2></div><div class="export-phone"><img src="assets/presentation/${file}.png" alt="${title}"></div></div>`).join('') + '</section>';
write('client-presentation.html', read('client-presentation.html').replace(/<section class="export-screens"[\s\S]*?<\/section>/, compact));
const chapters = [
  ['A', 'Anna’s care and the handover', 'Record, save and continue the day with Jane.'],
  ['B', 'One update for the family', 'A complete day, with a clearly labelled alternative recording gap.'],
  ['C', 'The details around the day', 'Saving, an honest family update and clear caregiver identity.']
];
const board = chapters.map(([letter,title,intro], chapter) => `<div class="chapter-heading secondary-chapter"><h2><span>${letter}</span> ${title}</h2><p>${intro}</p></div><section class="board-screens">${screens.slice(chapter*3,chapter*3+3).map(([file,title,subtitle,heading,copy], index) => `<article class="board-screen"><header><span class="screen-number">${number(chapter*3+index)}</span><div><h3>${title}</h3><p>${subtitle}</p></div></header><div class="board-phone"><img src="assets/presentation/${file}.png" alt="${copy}"></div><div class="screen-explanation"><h4>${heading}</h4><p>${copy}</p></div></article>`).join('')}</section>`).join('\n');
write('complete-presentation.html', read('complete-presentation.html').replace(/<div class="chapter-heading secondary-chapter">[\s\S]*?(?=<section class="full-design-system")/, board + '\n  '));
console.log('Updated the six main screens and supporting presentation copy.');
