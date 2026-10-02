/* DailyCare is a local presentation prototype. Nothing is sent to a server. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(location.search);
  const embedded = params.has('embed');
  const sample = params.has('sample');
  const storageKey = 'dailycare-prototype-draft-v3';
  const routineKeys = ['breakfast', 'lunch', 'dinner', 'am', 'pm'];
  const mealKeys = ['breakfast', 'lunch', 'dinner'];
  const doseKeys = ['am', 'pm'];
  const concernKeys = ['appetite', 'wandering', 'sundowning', 'fall', 'pain', 'skin', 'other'];
  const initial = () => ({ date: '2026-09-13', care: { breakfast: null, lunch: null, dinner: null, am: null, pm: null }, medicationDetails: {}, personalCare: '', mood: '', sleep: '', concernsChecked: false, changes: {}, note: '', photo: '' });
  function normalizeDraft(saved) {
    const fallback = initial();
    const normalized = { ...fallback, ...saved, care: { ...fallback.care, ...(saved?.care || {}) }, medicationDetails: { ...(saved?.medicationDetails || {}) }, changes: { ...(saved?.changes || {}) } };
    mealKeys.forEach(key => { if (normalized.care[key] === false) normalized.care[key] = normalized.changes.appetite?.meal?.toLowerCase() === key && normalized.changes.appetite.portion === 'None' ? false : null; });
    doseKeys.forEach(key => { if (normalized.care[key] === true) normalized.care[key] = 'given'; else if (normalized.care[key] === false) normalized.care[key] = null; });
    if (normalized.changes.medication?.dose) {
      const dose = normalized.changes.medication.dose.toLowerCase();
      if (doseKeys.includes(dose)) {
        normalized.care[dose] = normalized.changes.medication.status === 'Refused' ? 'refused' : 'not given';
        normalized.medicationDetails[dose] = normalized.changes.medication.note || '';
      }
      delete normalized.changes.medication;
    }
    const oldMoods = { Content: 'Calm', Bright: 'Cheerful', Low: 'Withdrawn', Unsettled: 'Anxious', Okay: 'Calm' };
    normalized.mood = oldMoods[normalized.mood] || normalized.mood;
    if (normalized.changes.mood) normalized.changes.mood.status = oldMoods[normalized.changes.mood.status] || normalized.changes.mood.status;
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
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || sessionStorage.getItem('dailycare-prototype-draft-v2') || sessionStorage.getItem('dailycare-prototype-draft-v1'));
      if (saved?.care && saved?.changes) state = normalizeDraft(saved);
    } catch { /* File previews may block storage. */ }
  }
  if (sample) state = { ...initial(), care: { breakfast: true, lunch: true, dinner: true, am: 'given', pm: 'given' }, personalCare: 'grooming', mood: 'Calm', sleep: 'Restless', concernsChecked: true, changes: { sleep: { status: 'Restless', note: 'Woke twice overnight and settled after reassurance.' } } };
  function persist() { if (!embedded && !sample) try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { toast('Your draft is available in this view.'); } }
  function toast(message) { const element = $('#toast'); if (!element) return; element.textContent = message; element.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove('visible'), 3000); }
  function escape(value = '') { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
  const detailNames = { appetite: 'Appetite', sleep: 'Sleep', medication: 'Medication', personalCare: 'Personal care', wandering: 'Wandering', sundowning: 'Sundowning', fall: 'Fall or near-fall', pain: 'Pain', skin: 'Skin concern', mood: 'Mood', other: 'Something else' };
  function formattedDate(value) { return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(); }
  function hasException(key) { return key === 'personalCare' && Boolean(state.changes.personalCare); }
  if (embedded) document.documentElement.classList.add('embedded');
  $$('a[href^="care.html"], a[href^="review.html"]').forEach(link => { if (embedded) { const url = new URL(link.href); url.searchParams.set('embed', '1'); link.href = url.href; } });

  if (document.body.dataset.page === 'care') {
    const dialog = $('#detail-dialog');
    const detailBody = $('#detail-body');
    let currentDetail = '';
    let currentDose = 'am';
    let opener = null;
    function updateCare() {
      $$('[data-care]').forEach(button => {
        const value = state.care[button.dataset.care];
        button.setAttribute('aria-pressed', String(value !== null));
        button.dataset.state = value === false ? 'none' : value === null ? 'unrecorded' : 'eaten';
        button.lastChild.textContent = value === false ? `${button.dataset.care[0].toUpperCase() + button.dataset.care.slice(1)} · none` : button.dataset.care[0].toUpperCase() + button.dataset.care.slice(1);
      });
      $$('[data-med-status]').forEach(button => button.setAttribute('aria-pressed', String(state.care[button.dataset.dose] === button.dataset.medStatus)));
      $$('[data-personal-care]').forEach(button => button.setAttribute('aria-pressed', String(state.personalCare === button.dataset.personalCare)));
      $$('[data-mood]').forEach(button => button.setAttribute('aria-pressed', String(state.mood === button.dataset.mood)));
      $$('[data-sleep]').forEach(button => button.setAttribute('aria-pressed', String(state.sleep === button.dataset.sleep)));
      $$('[data-concern]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.concern === 'none' ? state.concernsChecked && !concernKeys.some(key => state.changes[key]) : Boolean(state.changes[button.dataset.concern]))));
      const recorded = routineKeys.filter(key => state.care[key] !== null).length + (state.personalCare || hasException('personalCare') ? 1 : 0);
      $('#care-count').textContent = `${recorded} of 6 routines recorded`;
      $('#care-date').value = state.date;
      $('.date-line label').textContent = formattedDate(state.date);
      $('.add-moment strong').textContent = state.note || state.photo ? 'A moment, ready to share' : 'A moment to share?';
      $('.add-moment>span:nth-child(2)>span').textContent = state.photo ? 'Photo attached · edit your moment' : state.note ? 'Note added · tap to edit' : 'Add a photo or a little note';
    }
    $$('[data-care]').forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.care;
      state.care[key] = state.care[key] === true ? null : true;
      if (state.changes.appetite?.meal?.toLowerCase() === key) delete state.changes.appetite;
      persist(); updateCare();
    }));
    $$('[data-med-status]').forEach(button => button.addEventListener('click', () => {
      const dose = button.dataset.dose;
      const status = button.dataset.medStatus;
      const previous = state.care[dose];
      state.care[dose] = status;
      if (previous !== status) delete state.medicationDetails[dose];
      persist(); updateCare();
      if (status !== 'given') openDetail('medication', button);
    }));
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
      if (['Withdrawn', 'Anxious', 'Agitated'].includes(state.mood)) state.changes.mood = { ...(state.changes.mood || {}), status: state.mood };
      else delete state.changes.mood;
      persist(); updateCare();
      if (['Withdrawn', 'Anxious', 'Agitated'].includes(state.mood)) openDetail('mood', button);
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
        if (state.changes.appetite) state.care[state.changes.appetite.meal.toLowerCase()] = null;
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
    $('[data-action="caregiver"]').addEventListener('click', () => toast('Anna Lewis · Margaret’s caregiver'));
    $('#care-date').addEventListener('change', event => { if (!event.target.value) { event.target.value = state.date; return; } const date = event.target.value; state = { ...initial(), date }; persist(); updateCare(); toast('A fresh entry for this date.'); });
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
      if (type === 'medication') currentDose = trigger?.dataset.dose || currentDose;
      const change = state.changes[type] || {};
      const saveButton = $('#detail-form>.primary-button');
      saveButton.hidden = false;
      if (type === 'appetite') {
        const meal = change.meal || '';
        const portion = change.portion || '';
        detailBody.innerHTML = `<span class="art art-meal detail-art" aria-hidden="true"></span><h1 id="detail-title">A change in appetite?</h1><p class="detail-description">Choose the meal and amount. Add context if it helps.</p><div class="field-group"><span class="field-label" id="meal-label">Which meal?</span><div role="group" aria-labelledby="meal-label">${segment('meal', ['Breakfast', 'Lunch', 'Dinner'], meal)}</div></div><div class="field-group"><span class="field-label" id="portion-label">How much did she eat?</span><div class="portion-options" role="group" aria-labelledby="portion-label">${[['None','0%'],['A little','25%'],['Half','50%'],['Most','75%']].map(([label, value]) => `<label class="portion-option"><input type="radio" name="portion" value="${label}" ${portion === label ? 'checked' : ''}><span class="plate" style="--portion:${value}" aria-hidden="true"></span><span>${label}</span></label>`).join('')}</div></div>${textarea(change.note || '')}<div class="detail-info"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5V12a8 8 0 1 1-4.7-7.3M20 4l-8 8-3-3"/></svg><span>This will appear in the family update.</span></div>`;
      } else if (type === 'medication') {
        const status = state.care[currentDose];
        detailBody.innerHTML = `<span class="art art-medication detail-art" aria-hidden="true"></span><h1 id="detail-title">${currentDose.toUpperCase()} medication</h1><p class="detail-description">${status ? `${escape(status[0].toUpperCase() + status.slice(1))} recorded. Add a short note if needed.` : 'Choose given, not given, or refused on the daily screen first.'}</p>${textarea(state.medicationDetails[currentDose] || '', 'What happened?')}`;
      } else if (type === 'note') {
        detailBody.innerHTML = `<h1 id="detail-title">The little moments.</h1><p class="detail-description">A story, a smile, something her family would love to know.</p>${textarea(state.note, 'A note for her family')}<div class="field-group"><label class="field-label" for="moment-photo">Add a photo<span class="optional-label">OPTIONAL</span></label><input class="file-input" id="moment-photo" type="file" name="photo" accept="image/*"><p class="textarea-footer">${state.photo ? 'A photo is already attached. Choose another to replace it.' : 'Choose an image from this device.'}</p></div>${state.photo ? '<button class="text-button" data-action="remove-photo" type="button">Remove attached photo</button>' : ''}`;
      } else {
        const titles = { sleep: 'How did she sleep?', medication: 'A change in medication?', personalCare: 'A change in personal care?', wandering: 'A moment of wandering?', sundowning: 'An unsettled evening?', fall: 'A fall or a near-fall?', pain: 'Some discomfort today?', skin: 'Something with her skin?', mood: 'A different kind of day?', other: 'What would you like to add?' };
        const choices = { personalCare: ['Partial','Declined','Needed help'], fall: ['Fall','Near-fall'] };
        const art = type === 'medication' ? 'art-medication' : type === 'personalCare' ? 'art-hygiene' : 'art-weary';
        const careType = change.careType || state.personalCare || 'grooming';
        const description = type === 'sleep' ? `${state.sleep} recorded. Add context if it helps.` : type === 'mood' ? `${state.mood} recorded. Add context if it helps.` : 'A few details help her family understand.';
        detailBody.innerHTML = `<span class="art ${art} detail-art" aria-hidden="true"></span><h1 id="detail-title">${titles[type]}</h1><p class="detail-description">${escape(description)}</p>${type === 'personalCare' ? `<div class="field-group"><span class="field-label">Which care?</span>${segment('careType', ['Shower', 'Grooming'], careType[0].toUpperCase() + careType.slice(1))}</div>` : ''}${choices[type] ? `<div class="field-group"><label class="field-label" for="detail-status">What was different?</label><select id="detail-status" name="status">${choices[type].map(option => `<option ${change.status === option ? 'selected' : ''}>${option}</option>`).join('')}</select></div>` : ''}${textarea(change.note || '', 'What happened?')}`;
      }
      const note = $('#detail-note');
      if (state.changes[type] && type !== 'mood') detailBody.insertAdjacentHTML('beforeend', `<button type="button" class="text-button remove-detail" data-action="remove-detail">${type === 'sleep' ? 'Clear sleep answer' : 'Remove this detail'}</button>`);
      if (type === 'medication' && state.care[currentDose] !== null) detailBody.insertAdjacentHTML('beforeend', '<button type="button" class="text-button remove-detail" data-action="remove-detail">Clear this answer</button>');
      if (note) note.addEventListener('input', () => $('#character-count').textContent = note.value.length);
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
      // Keep the keyboard closed on phones until the caregiver chooses a field.
      $('.close-button').focus({ preventScroll: true });
    }
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-detail]');
      if (trigger) openDetail(trigger.dataset.detail, trigger);
      if (event.target.closest('[data-action="remove-detail"]')) { if (currentDetail === 'medication') { state.care[currentDose] = null; delete state.medicationDetails[currentDose]; } else { if (currentDetail === 'appetite' && state.changes.appetite) state.care[state.changes.appetite.meal.toLowerCase()] = null; delete state.changes[currentDetail]; if (currentDetail === 'sleep') state.sleep = ''; if (concernKeys.includes(currentDetail) && !concernKeys.some(key => state.changes[key])) state.concernsChecked = false; } persist(); updateCare(); closeDetail(); toast('Answer cleared.'); }
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
      } else if (currentDetail === 'medication') {
        if (state.care[currentDose] === null) { closeDetail(); toast('Choose a medication answer first.'); return; }
        state.medicationDetails[currentDose] = (values.note || '').trim();
      } else {
        if (currentDetail === 'sleep') values.status = state.sleep;
        if (currentDetail === 'mood') values.status = state.mood;
        if (currentDetail === 'appetite' && (!values.meal || !values.portion)) { toast('Choose a meal and how much she ate.'); return; }
        if (currentDetail === 'appetite' && state.changes.appetite?.meal !== values.meal) state.care[state.changes.appetite.meal.toLowerCase()] = null;
        state.changes[currentDetail] = values;
        if (currentDetail === 'appetite') state.care[values.meal.toLowerCase()] = values.portion !== 'None';
        if (concernKeys.includes(currentDetail)) state.concernsChecked = true;
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
    const moods = { Calm: ['A calm kind of day','Comfortable and settled.'], Cheerful: ['A cheerful kind of day','Some bright moments today.'], Withdrawn: ['A quieter day','She seemed more withdrawn than usual.'], Anxious: ['An anxious day','She needed a little reassurance.'], Agitated: ['A more agitated day','She needed extra support.'] };
    const mood = moods[state.mood] || ['Mood not recorded','You can add a mood before sharing.'];
    $('#review-mood').textContent = mood[0]; $('#review-mood-subtitle').textContent = mood[1];
    const faces = { Withdrawn: ['low','M15 21h1m15 0h1M17 33q7-8 14 0'], Anxious: ['unsettled','m12 18 7 2m10 0 7-2M16 25h1m14 0h1M18 34q4-4 7 0t6 0'], Agitated: ['agitated','m12 19 8 3m16-3-8 3M16 27h1m14 0h1M17 35q7-5 14 0'], Calm: ['content','M12 22q4-5 8 0m8 0q4-5 8 0M17 30q7 8 14 0'], Cheerful: ['bright','M12 20q4-6 8 0m8 0q4-6 8 0M15 28q9 17 18 0Z'] };
    const face = $('.review-intro .mood-face');
    face.className = `mood-face ${(faces[state.mood] || ['okay'])[0]} small-face`;
    face.querySelector('path').setAttribute('d', (faces[state.mood] || ['okay','M15 21h1m15 0h1M18 31h12'])[1]);
    const list = values => values.length ? new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(values) : 'Not recorded';
    const item = (label, value, missing = false) => `<div class="review-item"><span>${escape(label)}</span><strong class="${missing ? 'unrecorded' : ''}">${escape(value)}</strong></div>`;
    $('#summary-meals').innerHTML = mealKeys.map(key => {
      const appetite = state.changes.appetite?.meal?.toLowerCase() === key ? state.changes.appetite : null;
      const status = state.care[key] === null ? 'Not recorded' : appetite ? { None: 'Did not eat', 'A little': 'Ate a little', Half: 'Ate half', Most: 'Ate most' }[appetite.portion] || 'Ate' : state.care[key] ? 'Ate well' : 'Did not eat';
      return item(key[0].toUpperCase() + key.slice(1), status, state.care[key] === null);
    }).join('');
    $('#summary-medication').innerHTML = doseKeys.map(key => item(key.toUpperCase(), state.care[key] === null ? 'Not recorded' : state.care[key][0].toUpperCase() + state.care[key].slice(1), state.care[key] === null) + (state.medicationDetails[key] ? `<p class="review-item-note">${escape(state.medicationDetails[key])}</p>` : '')).join('');
    const personalCareLabel = state.personalCare ? state.personalCare[0].toUpperCase() + state.personalCare.slice(1) : '';
    $('#summary-personal-care').innerHTML = item('Today', state.changes.personalCare ? `${personalCareLabel || 'Personal care'} · ${(state.changes.personalCare.status || 'details added').toLowerCase()}` : personalCareLabel || 'Not recorded', !personalCareLabel && !hasException('personalCare'));
    $('#summary-sleep').textContent = state.sleep || 'Not recorded';
    $('#summary-sleep').classList.toggle('unrecorded', !state.sleep);
    const missing = routineKeys.filter(key => state.care[key] === null).map(key => ({ label: ({ am: 'AM medication', pm: 'PM medication' }[key] || key[0].toUpperCase() + key.slice(1)), anchor: 'routine-title' }));
    if (!state.personalCare && !hasException('personalCare')) missing.push({ label: 'Personal care', anchor: 'routine-title' });
    if (!state.mood) missing.push({ label: 'Mood', anchor: 'mood-title' });
    if (!state.sleep) missing.push({ label: 'Sleep', anchor: 'sleep-title' });
    if (!state.concernsChecked) missing.push({ label: 'Concerns', anchor: 'changes-title' });
    if (missing.length) {
      $('#missing-items').hidden = false;
      $('#missing-list').innerHTML = missing.map(({ label }) => `<li>${escape(label)} · not recorded</li>`).join('');
      $('#complete-missing').href = `care.html#${missing[0].anchor}`;
    }
    $('#summary-concerns').textContent = !state.concernsChecked ? 'Concerns not recorded' : concernKeys.some(key => state.changes[key]) ? 'Concerns noted below' : 'No concerns noted';
    $('#review-changes').innerHTML = Object.entries(state.changes).map(([key, value]) => {
      const title = key === 'appetite' ? `${value.portion === 'None' ? 'No food' : value.portion === 'Most' ? 'Most of her usual portion' : 'A smaller appetite'} at ${String(value.meal || 'a meal').toLowerCase()}` : key === 'personalCare' ? `Personal care · ${String(value.careType || state.personalCare || 'not specified').toLowerCase()}${value.status ? ` · ${value.status.toLowerCase()}` : ''}` : `${detailNames[key] || key}${value.status ? ` · ${value.status.toLowerCase()}` : ''}${value.dose ? ` (${value.dose})` : ''}`;
      const amount = key === 'appetite' ? { None:'Did not eat this meal.', 'A little':'A little of her usual portion.', Half:'About half her usual portion.', Most:'Most of her usual portion.' }[value.portion] : '';
      return `<div class="change-summary"><div><strong>${escape(title)}</strong></div><p>${escape([amount, value.note].filter(Boolean).join(' ')) || 'No further detail added.'}</p></div>`;
    }).join('') || '<p class="no-changes">No changes noted today.</p>';
    if (state.note || state.photo) { $('#review-note').textContent = state.note; if (state.photo && /^data:image\//.test(state.photo)) { $('#review-photo').src = state.photo; $('#review-photo').hidden = false; } } else $('.moment-review').hidden = true;
    $('#edit-recipients').addEventListener('click', () => { $('.recipient input').focus(); toast('Tap a person to include or remove them.'); });
    function updateRecipients() {
      const selected = $$('input[name="recipient"]:checked');
      const acceptedMissing = !missing.length || $('#send-unrecorded').checked;
      $('#send-update').disabled = !selected.length || !acceptedMissing;
      $('#send-update').innerHTML = `${missing.length && acceptedMissing ? 'Send with not recorded' : 'Send to family'} <span aria-hidden="true">↗</span>`;
      $('.send-hint').textContent = !selected.length ? 'Choose at least one family member.' : !acceptedMissing ? 'Complete missing items or mark them not recorded.' : 'Ready to share this recorded day.';
    }
    $$('input[name="recipient"]').forEach(input => input.addEventListener('change', updateRecipients));
    $('#send-unrecorded').addEventListener('change', updateRecipients);
    $('#send-update').addEventListener('click', () => { const selected = $$('input[name="recipient"]:checked').map(input => input.value); if (!selected.length || (missing.length && !$('#send-unrecorded').checked)) return; $('#sent-recipients').textContent = `Your update is ready for ${list(selected)}.${missing.length ? ' Unanswered items are marked not recorded.' : ''}`; $('#sent-dialog').showModal(); });
    $('#back-to-day').addEventListener('click', () => $('#sent-dialog').close());
    updateRecipients();
  }
})();
