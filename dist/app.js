/* DailyCare is a local presentation prototype. Nothing is sent to a server. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(location.search);
  const embedded = params.has('embed');
  const sample = params.has('sample');
  const storageKey = 'dailycare-prototype-draft-v2';
  const routineKeys = ['breakfast', 'lunch', 'dinner', 'am', 'pm'];
  const concernKeys = ['appetite', 'wandering', 'sundowning', 'fall', 'pain', 'skin', 'other'];
  const initial = () => ({ date: '2026-09-13', care: { breakfast: true, lunch: true, dinner: false, am: true, pm: false }, personalCare: 'grooming', mood: '', sleep: '', concernsChecked: false, changes: {}, note: '', photo: '' });
  function normalizeDraft(saved) {
    const fallback = initial();
    const normalized = { ...fallback, ...saved, care: { ...fallback.care, ...(saved?.care || {}) }, changes: { ...(saved?.changes || {}) } };
    if (!['shower', 'grooming'].includes(normalized.personalCare)) normalized.personalCare = saved?.care?.hygiene ? 'grooming' : '';
    delete normalized.care.hygiene;
    if (normalized.changes.hygiene && !normalized.changes.personalCare) {
      normalized.changes.personalCare = { ...normalized.changes.hygiene, careType: normalized.personalCare || 'grooming' };
      delete normalized.changes.hygiene;
    }
    if (!normalized.sleep && normalized.changes.sleep?.status) normalized.sleep = normalized.changes.sleep.status;
    if (saved?.concernsChecked === undefined && concernKeys.some(key => normalized.changes[key])) normalized.concernsChecked = true;
    return normalized;
  }
  let state = initial();
  if (!embedded && !sample) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || sessionStorage.getItem('dailycare-prototype-draft-v1'));
      if (saved?.care && saved?.changes) state = normalizeDraft(saved);
    } catch { /* File previews may block storage. */ }
  }
  const sampleChanges = { appetite: { meal: 'Lunch', portion: 'Half', note: 'Enjoyed some soup and a little bread.' } };
  if (sample) state = { ...initial(), care: { breakfast: true, lunch: true, dinner: true, am: true, pm: true }, personalCare: 'shower', mood: 'Content', sleep: 'As usual', concernsChecked: true, changes: sampleChanges, note: 'We sat by the window after lunch. Margaret told me all about the roses she used to grow.' };
  function persist() { if (!embedded && !sample) try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { toast('Your draft is available in this view.'); } }
  function toast(message) { const element = $('#toast'); if (!element) return; element.textContent = message; element.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove('visible'), 3000); }
  function escape(value = '') { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
  const detailNames = { appetite: 'Appetite', sleep: 'Sleep', medication: 'Medication', personalCare: 'Personal care', wandering: 'Wandering', sundowning: 'Sundowning', fall: 'Fall or near-fall', pain: 'Pain', skin: 'Skin concern', mood: 'Mood', other: 'Something else' };
  function formattedDate(value) { return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(); }
  function hasException(key) { return key === 'personalCare' ? Boolean(state.changes.personalCare) : ['am','pm'].includes(key) && state.changes.medication?.dose?.toLowerCase() === key; }
  if (embedded) document.documentElement.classList.add('embedded');
  $$('a[href^="care.html"], a[href^="review.html"]').forEach(link => { if (embedded) { const url = new URL(link.href); url.searchParams.set('embed', '1'); link.href = url.href; } });

  if (document.body.dataset.page === 'care') {
    const dialog = $('#detail-dialog');
    const detailBody = $('#detail-body');
    let currentDetail = '';
    let opener = null;
    function updateCare() {
      $$('[data-care]').forEach(button => button.setAttribute('aria-pressed', String(Boolean(state.care[button.dataset.care]))));
      $$('[data-personal-care]').forEach(button => button.setAttribute('aria-pressed', String(state.personalCare === button.dataset.personalCare)));
      $$('[data-mood]').forEach(button => button.setAttribute('aria-pressed', String(state.mood === button.dataset.mood)));
      $$('[data-sleep]').forEach(button => button.setAttribute('aria-pressed', String(state.sleep === button.dataset.sleep)));
      $$('[data-concern]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.concern === 'none' ? state.concernsChecked && !concernKeys.some(key => state.changes[key]) : Boolean(state.changes[button.dataset.concern]))));
      const recorded = routineKeys.filter(key => state.care[key] || hasException(key)).length + (state.personalCare || hasException('personalCare') ? 1 : 0);
      $('#care-count').textContent = `${recorded} of 6 routines recorded`;
      $('#care-date').value = state.date;
      $('.date-line label').textContent = formattedDate(state.date);
      $('.add-moment strong').textContent = state.note || state.photo ? 'A moment, ready to share' : 'A moment to share?';
      $('.add-moment>span:nth-child(2)>span').textContent = state.photo ? 'Photo attached · edit your moment' : state.note ? 'Note added · tap to edit' : 'Add a photo or a little note';
    }
    $$('[data-care]').forEach(button => button.addEventListener('click', () => { const key = button.dataset.care; if (hasException(key)) { openDetail('medication', button); return; } state.care[key] = !state.care[key]; persist(); updateCare(); }));
    $$('[data-personal-care]').forEach(button => button.addEventListener('click', () => {
      const choice = button.dataset.personalCare;
      if (hasException('personalCare')) {
        state.personalCare = choice;
        state.changes.personalCare.careType = choice;
        persist();
        updateCare();
        openDetail('personalCare', button);
        return;
      }
      state.personalCare = state.personalCare === choice ? '' : choice;
      persist();
      updateCare();
    }));
    $$('[data-mood]').forEach(button => button.addEventListener('click', () => {
      state.mood = button.dataset.mood;
      if (['Low', 'Unsettled'].includes(state.mood)) state.changes.mood = { ...(state.changes.mood || {}), status: state.mood };
      else delete state.changes.mood;
      persist(); updateCare();
      if (['Low', 'Unsettled'].includes(state.mood)) openDetail('mood', button);
    }));
    $$('[data-sleep]').forEach(button => button.addEventListener('click', () => {
      state.sleep = button.dataset.sleep;
      if (state.sleep === 'As usual') delete state.changes.sleep;
      else state.changes.sleep = { ...(state.changes.sleep || {}), status: state.sleep };
      persist(); updateCare();
      if (state.sleep !== 'As usual') openDetail('sleep', button);
    }));
    $$('[data-concern]').forEach(button => button.addEventListener('click', () => {
      const type = button.dataset.concern;
      if (type === 'none') {
        concernKeys.forEach(key => delete state.changes[key]);
        state.concernsChecked = true;
        persist(); updateCare();
        return;
      }
      if (type !== 'appetite' && !state.changes[type]) state.changes[type] = {};
      if (type !== 'appetite') state.concernsChecked = true;
      persist(); updateCare();
      openDetail(type, button);
    }));
    $('[data-action="all-usual"]').addEventListener('click', () => {
      routineKeys.forEach(key => { if (!hasException(key)) state.care[key] = true; });
      persist();
      updateCare();
      if (!state.personalCare && !hasException('personalCare')) toast('Meals and medication recorded. Choose shower or grooming.');
      else toast([...routineKeys, 'personalCare'].some(hasException) ? 'Routine care recorded. Your changes are kept.' : 'All 6 routines recorded.');
    });
    $('[data-action="caregiver"]').addEventListener('click', () => toast('Anna Lewis · Margaret’s caregiver'));
    $('#care-date').addEventListener('change', event => { if (!event.target.value) { event.target.value = state.date; return; } const date = event.target.value; state = { ...initial(), date, care: Object.fromEntries(routineKeys.map(key => [key, false])), personalCare: '' }; persist(); updateCare(); toast('A fresh entry for this date.'); });
    $$('a[href*="review.html"]').forEach(link => link.addEventListener('click', event => {
      persist();
      // A URL fragment keeps the draft usable when sessionStorage is unavailable
      // (including local file previews). Fragments never go to the HTTP server.
      const transferable = { ...state, photo: '' };
      event.currentTarget.hash = encodeURIComponent(JSON.stringify(transferable));
    }));
    const textarea = (value, label = 'A little context') => `<div class="field-group"><label class="field-label" for="detail-note">${label}<span class="optional-label">OPTIONAL</span></label><textarea id="detail-note" name="note" rows="3" maxlength="400" placeholder="Just a sentence or two…">${escape(value)}</textarea><div class="textarea-footer"><span id="character-count">${value.length}</span> / 400</div></div>`;
    const segment = (name, options, value) => `<div class="segmented-control">${options.map(option => `<label><input type="radio" name="${name}" value="${escape(option)}" ${value === option ? 'checked' : ''}><span>${escape(option)}</span></label>`).join('')}</div>`;
    function openDetail(type, trigger) {
      if (!(type in detailNames) && type !== 'note') return;
      opener = trigger || document.activeElement;
      currentDetail = type;
      const change = state.changes[type] || {};
      const saveButton = $('#detail-form>.primary-button');
      saveButton.hidden = false;
      if (type === 'appetite') {
        const example = params.has('detail') && !state.changes.appetite;
        const meal = change.meal || 'Lunch';
        const portion = change.portion || 'Half';
        detailBody.innerHTML = `<span class="art art-meal detail-art" aria-hidden="true"></span><h1 id="detail-title">A smaller appetite?</h1><p class="detail-description">Some days, a little is enough.<br>Let’s give her family a little context.</p><div class="field-group"><span class="field-label" id="meal-label">Which meal?</span><div role="group" aria-labelledby="meal-label">${segment('meal', ['Breakfast', 'Lunch', 'Dinner'], meal)}</div></div><div class="field-group"><span class="field-label" id="portion-label">How much did she eat?</span><div class="portion-options" role="group" aria-labelledby="portion-label">${[['None','0%'],['A little','25%'],['Half','50%'],['Most','75%']].map(([label, value]) => `<label class="portion-option"><input type="radio" name="portion" value="${label}" ${portion === label ? 'checked' : ''}><span class="plate" style="--portion:${value}" aria-hidden="true"></span><span>${label}</span></label>`).join('')}</div></div>${textarea(change.note || (example ? 'Enjoyed some soup and a little bread.' : ''))}<div class="detail-info"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5V12a8 8 0 1 1-4.7-7.3M20 4l-8 8-3-3"/></svg><span>This will appear in “A little different today” in the family update.</span></div>`;
      } else if (type === 'note') {
        detailBody.innerHTML = `<h1 id="detail-title">The little moments.</h1><p class="detail-description">A story, a smile, something her family would love to know.</p>${textarea(state.note, 'A note for her family')}<div class="field-group"><label class="field-label" for="moment-photo">Add a photo<span class="optional-label">OPTIONAL</span></label><input class="file-input" id="moment-photo" type="file" name="photo" accept="image/*"><p class="textarea-footer">${state.photo ? 'A photo is already attached. Choose another to replace it.' : 'Choose an image from this device.'}</p></div>${state.photo ? '<button class="text-button" data-action="remove-photo" type="button">Remove attached photo</button>' : ''}`;
      } else {
        const titles = { sleep: 'How did she sleep?', medication: 'A change in medication?', personalCare: 'A change in personal care?', wandering: 'A moment of wandering?', sundowning: 'An unsettled evening?', fall: 'A fall or a near-fall?', pain: 'Some discomfort today?', skin: 'Something with her skin?', mood: 'A different kind of day?', other: 'What would you like to add?' };
        const choices = { medication: ['Missed','Refused','Delayed','Changed'], personalCare: ['Partial','Declined','Needed help'], fall: ['Fall','Near-fall'] };
        const art = type === 'medication' ? 'art-medication' : type === 'personalCare' ? 'art-hygiene' : 'art-weary';
        const careType = change.careType || state.personalCare || 'grooming';
        detailBody.innerHTML = `<span class="art ${art} detail-art" aria-hidden="true"></span><h1 id="detail-title">${titles[type]}</h1><p class="detail-description">A few details help her family understand.</p>${type === 'medication' ? `<div class="field-group"><span class="field-label">Which dose?</span>${segment('dose', ['AM', 'PM'], change.dose || 'AM')}</div>` : ''}${type === 'personalCare' ? `<div class="field-group"><span class="field-label">Which care?</span>${segment('careType', ['Shower', 'Grooming'], careType[0].toUpperCase() + careType.slice(1))}</div>` : ''}${choices[type] ? `<div class="field-group"><label class="field-label" for="detail-status">What was different?</label><select id="detail-status" name="status">${choices[type].map(option => `<option ${change.status === option ? 'selected' : ''}>${option}</option>`).join('')}</select></div>` : ''}${textarea(change.note || '', 'What happened?')}`;
      }
      const note = $('#detail-note');
      if (state.changes[type] && type !== 'mood') detailBody.insertAdjacentHTML('beforeend', '<button type="button" class="text-button remove-detail" data-action="remove-detail">Remove this detail</button>');
      if (note) note.addEventListener('input', () => $('#character-count').textContent = note.value.length);
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
      // Keep the keyboard closed on phones until the caregiver chooses a field.
      $('.close-button').focus({ preventScroll: true });
    }
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-detail]');
      if (trigger) openDetail(trigger.dataset.detail, trigger);
      if (event.target.closest('[data-action="remove-detail"]')) { delete state.changes[currentDetail]; if (currentDetail === 'sleep') state.sleep = ''; if (concernKeys.includes(currentDetail) && !concernKeys.some(key => state.changes[key])) state.concernsChecked = false; persist(); updateCare(); closeDetail(); toast('Detail removed.'); }
      if (event.target.closest('[data-action="remove-photo"]')) { state.photo = ''; persist(); openDetail('note'); toast('Photo removed.'); }
    });
    function closeDetail() { dialog.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); }
    $('[data-action="close-detail"]').addEventListener('click', closeDetail);
    dialog.addEventListener('click', event => { if (event.target === dialog && event.clientY < dialog.getBoundingClientRect().top) closeDetail(); });
    $('#detail-form').addEventListener('submit', async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === 'string'));
      if (currentDetail === 'note') {
        state.note = (values.note || '').trim();
        const file = $('#moment-photo').files[0];
        if (file) {
          if (!file.type.startsWith('image/')) { toast('Please choose an image file.'); return; }
          if (file.size > 4 * 1024 * 1024) { toast('Choose a photo smaller than 4 MB for this preview.'); return; }
          try { state.photo = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); } catch { toast('The photo could not be opened. Please try another.'); return; }
        }
      } else {
        if (currentDetail === 'sleep') values.status = state.sleep;
        if (currentDetail === 'mood') values.status = state.mood;
        if (currentDetail === 'appetite' && !values.portion) { toast('Choose how much she ate.'); return; }
        state.changes[currentDetail] = values;
        if (concernKeys.includes(currentDetail)) state.concernsChecked = true;
        if (currentDetail === 'medication' && ['Missed','Refused','Delayed'].includes(values.status)) state.care[values.dose.toLowerCase()] = false;
        if (currentDetail === 'personalCare') state.personalCare = values.careType.toLowerCase();
      }
      persist(); updateCare(); closeDetail(); toast(currentDetail === 'note' ? 'Your moment is ready to share.' : 'A little context, added.');
    });
    updateCare();
    if (params.has('detail')) openDetail(params.get('detail'));
  }

  if (document.body.dataset.page === 'review') {
    if (location.hash) try { const incoming = JSON.parse(decodeURIComponent(location.hash.slice(1))); if (incoming?.care && incoming?.changes) state = normalizeDraft({ ...state, ...incoming, photo: state.photo }); } catch { /* Ignore an invalid preview fragment. */ }
    $('.review-hero>.eyebrow').textContent = formattedDate(state.date);
    const moods = { Content: ['A content kind of day','Comfortable, settled, and herself.'], Bright: ['A bright kind of day','Some lovely moments to share.'], Okay: ['An ordinary kind of day','Taking the day as it comes.'], Unsettled: ['A more unsettled day','A little more reassurance was needed.'], Low: ['A quieter kind of day','A little extra care and company.'] };
    const mood = moods[state.mood] || ['Mood not recorded','You can add a mood before sharing.'];
    $('#review-mood').textContent = mood[0]; $('#review-mood-subtitle').textContent = mood[1];
    const faces = { Low: 'M15 21h1m15 0h1M17 33q7-8 14 0', Unsettled: 'm12 18 7 2m10 0 7-2M16 25h1m14 0h1M18 34q4-4 7 0t6 0', Okay: 'M15 21h1m15 0h1M18 31h12', Content: 'M12 22q4-5 8 0m8 0q4-5 8 0M17 30q7 8 14 0', Bright: 'M12 20q4-6 8 0m8 0q4-6 8 0M15 28q9 17 18 0Z' };
    const face = $('.review-intro .mood-face');
    face.className = `mood-face ${state.mood ? state.mood.toLowerCase() : 'okay'} small-face`;
    face.querySelector('path').setAttribute('d', faces[state.mood] || faces.Okay);
    const list = values => values.length ? new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(values) : 'Not recorded';
    $('#summary-meals').textContent = list(['breakfast','lunch','dinner'].filter(key => state.care[key]).map(value => value[0].toUpperCase() + value.slice(1)));
    $('#summary-medication').textContent = state.changes.medication ? ['am','pm'].map(key => `${key.toUpperCase()} ${hasException(key) ? state.changes.medication.status.toLowerCase() : state.care[key] ? 'given' : 'not recorded'}`).join(' · ') : state.care.am && state.care.pm ? 'AM & PM given' : state.care.am ? 'AM given' : state.care.pm ? 'PM given' : 'Not recorded';
    const personalCareLabel = state.personalCare ? state.personalCare[0].toUpperCase() + state.personalCare.slice(1) : '';
    $('#summary-personal-care').textContent = state.changes.personalCare ? `${personalCareLabel || 'Personal care'} · ${(state.changes.personalCare.status || 'details added').toLowerCase()}` : personalCareLabel || 'Not recorded';
    $('#summary-sleep').textContent = state.sleep || 'Not recorded';
    const missing = Object.entries(state.care).filter(([key, done]) => !done && !hasException(key)).map(([key]) => ({ am:'AM medication', pm:'PM medication', breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner' }[key]));
    if (!state.personalCare && !hasException('personalCare')) missing.push('Shower or grooming');
    if (missing.length) { $('#missing-items').hidden = false; $('#missing-items').textContent = `Still to check: ${list(missing)}. These will be marked “not recorded” in the update.`; }
    $('#review-changes').innerHTML = Object.entries(state.changes).map(([key, value]) => {
      const title = key === 'appetite' ? `${value.portion === 'None' ? 'No food' : value.portion === 'Most' ? 'Most of her usual portion' : 'A smaller appetite'} at ${String(value.meal || 'a meal').toLowerCase()}` : key === 'personalCare' ? `Personal care · ${String(value.careType || state.personalCare || 'not specified').toLowerCase()}${value.status ? ` · ${value.status.toLowerCase()}` : ''}` : `${detailNames[key] || key}${value.status ? ` · ${value.status.toLowerCase()}` : ''}${value.dose ? ` (${value.dose})` : ''}`;
      const amount = key === 'appetite' ? { None:'Did not eat this meal.', 'A little':'A little of her usual portion.', Half:'About half her usual portion.', Most:'Most of her usual portion.' }[value.portion] : '';
      return `<div class="change-summary"><div><strong>${escape(title)}</strong></div><p>${escape([amount, value.note].filter(Boolean).join(' ')) || 'No further detail added.'}</p></div>`;
    }).join('') || `<p class="no-changes">${state.concernsChecked ? 'No concerns noted today.' : 'Concerns not checked yet.'}</p>`;
    if (state.note || state.photo) { $('#review-note').textContent = state.note; if (state.photo && /^data:image\//.test(state.photo)) { $('#review-photo').src = state.photo; $('#review-photo').hidden = false; } } else $('.moment-review').hidden = true;
    $('#edit-recipients').addEventListener('click', () => { $('.recipient input').focus(); toast('Tap a person to include or remove them.'); });
    function updateRecipients() { const selected = $$('input[name="recipient"]:checked'); $('#send-update').disabled = !selected.length; $('.send-hint').textContent = selected.length ? 'A little peace of mind, on its way.' : 'Choose at least one family member.'; }
    $$('input[name="recipient"]').forEach(input => input.addEventListener('change', updateRecipients));
    $('#send-update').addEventListener('click', () => { const selected = $$('input[name="recipient"]:checked').map(input => input.value); if (!selected.length) return; $('#sent-recipients').textContent = `Your update is ready for ${list(selected)}.`; $('#sent-dialog').showModal(); });
    $('#back-to-day').addEventListener('click', () => $('#sent-dialog').close());
    updateRecipients();
  }
})();
