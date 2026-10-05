/* DailyCare is a local presentation prototype. Nothing is sent to a server. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const D = window.DailyCare;
  const { params, embedded, concernKeys } = D;
  const mealKeys = ['breakfast', 'lunch', 'dinner'];
  const doseKeys = ['am', 'pm'];
  let state = D.state;
  const persist = () => D.persist();
  function toast(message) { const element = $('#toast'); if (!element) return; element.textContent = message; element.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove('visible'), 3000); }
  function escape(value = '') { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
  const detailNames = { appetite: 'Appetite', sleep: 'Sleep', medication: 'Medication', personalCare: 'Personal care', wandering: 'Wandering', sundowning: 'Sundowning', fall: 'Fall or near-fall', pain: 'Pain', skin: 'Skin concern', mood: 'Mood', other: 'Something else' };
  function formattedDate(value) { return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(); }
  const byline = key => state.by[key] ? `Recorded by ${D.people[state.by[key]].first}` : '';
  const authorHTML = key => byline(key) ? `<span class="byline">${escape(byline(key))}</span>` : '';
  const person = () => D.people[state.caregiver];
  const resident = D.resident;
  const portrait = id => `resident-photo resident-photo--${id}`;
  const caregiverPortrait = id => `caregiver-photo caregiver-photo--${id}`;
  const observationHTML = item => `<div class="later-observation"><strong>${escape(item.category === 'Mood' && item.status ? `${item.status} later in the day` : item.category)}</strong>${item.note ? `<p class="answer-note">${escape(item.note)}</p>` : ''}<span class="byline">Recorded by ${escape(D.people[item.caregiver]?.first || '')} · ${escape(D.people[item.caregiver]?.shift || '')}</span></div>`;
  if (embedded) document.documentElement.classList.add('embedded');
  function updateIdentity() {
    const holder = $('#menu-caregiver');
    if (holder) holder.innerHTML = `<div class="menu-caregiver"><span class="avatar ${caregiverPortrait(state.caregiver)}" aria-hidden="true"></span><div><span class="micro-label">SIGNED IN AS</span><strong>${person().name}</strong></div></div><p class="menu-shift">${person().shift}</p>`;
    if ($('#active-caregiver')) $('#active-caregiver').textContent = person().name;
    if ($('#caregiver-avatar')) { $('#caregiver-avatar').className = `avatar caregiver-avatar ${caregiverPortrait(state.caregiver)}`; $('#caregiver-avatar').textContent = ''; }
    if ($('#caregiver-shift')) $('#caregiver-shift').textContent = person().shift;
    if ($('#resident-name')) $('#resident-name').textContent = resident.name;
    if ($('#resident-photo')) { $('#resident-photo').className = `avatar person-avatar ${portrait(D.residentId)}`; $('#resident-photo').textContent = ''; }
    if ($('.day-heading h1')) $('.day-heading h1').innerHTML = `How was<br>${escape(resident.first)}’s day?`;
    $$('.review-person').forEach(container => {
      container.querySelector('.person-avatar').className = `avatar person-avatar ${portrait(D.residentId)}`;
      container.querySelector('.person-avatar').textContent = '';
      container.querySelector('strong').textContent = resident.name;
    });
    if ($('.family-content .review-hero h1')) $('.family-content .review-hero h1').innerHTML = `A little window<br>into ${escape(resident.first)}’s day.`;
    if ($('.family-signoff>span')) $('.family-signoff>span').textContent = `${resident.first}’s caregivers today`;
    if ($('.mood-picker')) $('.mood-picker').setAttribute('aria-label', `${resident.first}’s mood`);
    if ($('.sleep-options')) $('.sleep-options').setAttribute('aria-label', `${resident.first}’s sleep`);
    document.title = `DailyCare · ${resident.name}`;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link && /^(care|review|family)\.html/.test(link.getAttribute('href') || '')) {
      const target = new URL(link.href);
      const focus = target.searchParams.get('focus') || target.hash.slice(1).replace(/-title$/, '');
      link.href = D.link(target.pathname.split('/').pop(), focus);
    }
    if (event.target.closest('#resident-switch')) {
      $('#resident-search').value = '';
      filterResidents();
      $('#resident-dialog').showModal();
      $('#resident-search').focus();
    }
    if (event.target.closest('[data-action="close-residents"]')) $('#resident-dialog').close();
    const chosenResident = event.target.closest('[data-resident]');
    if (chosenResident) {
      if (chosenResident.dataset.resident === D.residentId) $('#resident-dialog').close();
      else D.switchResident(chosenResident.dataset.resident);
    }
    if (event.target.closest('[data-action="close-shift"]')) $('#shift-dialog').close();
  });
  updateIdentity();

  if ($('#resident-list')) $('#resident-list').innerHTML = Object.entries(D.residents).map(([id, item]) => `<button type="button" class="resident-option" data-resident="${id}" ${id === D.residentId ? 'aria-current="true"' : ''}><span class="avatar ${portrait(id)}" aria-hidden="true"></span><span><strong>${escape(item.name)}</strong><small>${id === D.residentId ? 'Current resident' : 'View care record'}</small></span><span class="resident-option-arrow" aria-hidden="true">${id === D.residentId ? '✓' : '→'}</span></button>`).join('');
  function filterResidents() {
    const query = $('#resident-search').value.trim().toLocaleLowerCase();
    let matches = 0;
    $$('#resident-list [data-resident]').forEach(option => {
      const visible = option.querySelector('strong').textContent.toLocaleLowerCase().includes(query);
      option.hidden = !visible;
      if (visible) matches += 1;
    });
    $('#resident-empty').hidden = matches !== 0;
  }
  if ($('#resident-search')) {
    $('#resident-search').addEventListener('input', filterResidents);
    $('#resident-search').addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      const first = $$('#resident-list [data-resident]').find(option => !option.hidden);
      if (first) { event.preventDefault(); first.click(); }
    });
  }

  if (document.body.dataset.page === 'care') {
    const dialog = $('#detail-dialog');
    const detailBody = $('#detail-body');
    let currentDetail = '';
    let currentDose = 'am';
    let opener = null;
    let currentMeal = 'breakfast';
    let currentPersonal = 'shower';
    let editing = false;
    let observationIndex = -1;
    let observationCategory = 'Sleep';
    const canEdit = key => D.canEdit(key) && (!state.saved[state.caregiver] || editing) && !(state.caregiver === 'anna' && state.phase === 'handover' && D.later(key));
    const faces = Object.fromEntries($$('[data-mood]').map(button => [button.dataset.mood, button.querySelector('.mood-face').outerHTML]));
    function recordedInfo(key) {
      const note = state.mealDetails[key]?.note || state.medicationDetails[key] || state.changes[key]?.note || '';
      return `<div class="recorded-answer">${key === 'mood' ? faces[state.mood] || '' : ''}<div><strong>${escape(D.status(key))}</strong>${authorHTML(key)}</div></div>${note ? `<p class="answer-note">${escape(note)}</p>` : ''}`;
    }
    const buttons = (key, kind, options, selected) => `<div class="decision-options" role="group" aria-label="${D.labels[key]}">${options.map(([value, label]) => `<button type="button" data-item="${key}" data-answer-kind="${kind}" data-answer="${value}" aria-pressed="${selected === value}">${label}</button>`).join('')}</div>`;
    function routineItem(key, choices) {
      if (!canEdit(key)) return `<div class="care-item" id="item-${key}"><div class="care-item-heading"><strong>${D.labels[key]}</strong>${!D.recorded(key) && D.later(key) ? '<span class="later-label">Later today</span>' : ''}</div>${D.recorded(key) ? recordedInfo(key) : `<p class="answer-note">${D.later(key) ? 'For the next shift' : 'Not recorded'}</p>`}</div>`;
      return `<div class="care-item" id="item-${key}"><div class="care-item-heading"><strong>${D.labels[key]}</strong>${D.recorded(key) ? authorHTML(key) : D.later(key) ? '<span class="later-label">Later today</span>' : ''}</div>${choices}</div>`;
    }
    function updateCare() {
      $('#meal-items').innerHTML = mealKeys.map(key => routineItem(key, buttons(key, 'meal', [['well','Ate well'],['less','Ate less'],['none','Did not eat']], state.care[key] === null ? '' : state.mealDetails[key] ? (state.care[key] ? 'less' : 'none') : 'well'))).join('');
      $('#medication-items').innerHTML = doseKeys.map(key => routineItem(key, buttons(key, 'medication', [['given','Given'],['not given','Not given'],['refused','Refused']], state.care[key]))).join('');
      $('#personal-items').innerHTML = ['shower','grooming'].map(key => routineItem(key, buttons(key, 'personal', key === 'shower' ? [['Bath','Bath'],['Shower','Shower'],['Not done','Not done'],['Declined','Declined']] : [['Done','Done'],['Not done','Not done'],['Declined','Declined']], state.personal[key]))).join('');
      $$('[data-mood]').forEach(button => button.setAttribute('aria-pressed', String(state.mood === button.dataset.mood)));
      $$('[data-sleep]').forEach(button => button.setAttribute('aria-pressed', String(state.sleep === button.dataset.sleep)));
      $$('[data-concern]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.concern === 'none' ? state.concernsChecked && !concernKeys.some(key => state.changes[key]) : Boolean(state.changes[button.dataset.concern]))));
      for (const [key, selector] of [['mood','.mood-section'],['sleep','.sleep-section'],['concerns','.changes-section']]) {
        const section = $(selector);
        section.id = `item-${key}`;
        section.querySelector('.answer-summary')?.remove();
        section.querySelector('.answer-choices').hidden = !canEdit(key);
        const note = key === 'concerns' ? '' : state.changes[key]?.note || '';
        const summary = `<div class="answer-summary">${!canEdit(key) ? recordedInfo(key) : (D.recorded(key) ? authorHTML(key) : '') + (note ? `<p class="answer-note">${escape(note)}</p>` : '')}${key === 'concerns' ? concernKeys.filter(k => state.changes[k]?.note).map(k => `<p class="answer-note">${escape(D.concernNames[k])}: ${escape(state.changes[k].note)}</p>`).join('') : ''}</div>`;
        if (key === 'mood') section.querySelector('#later-mood-observations').insertAdjacentHTML('beforebegin', summary);
        else section.insertAdjacentHTML('beforeend', summary);
      }
      const completed = D.keys.filter(D.recorded).length;
      const later = D.keys.filter(D.later).length;
      const missing = 10 - completed - later;
      $('#day-progress').innerHTML = `<strong>${completed}/10 recorded</strong><span class="different-count">${D.changes().length} different</span><span>${missing} to record</span>${later ? `<span>${later} later today</span>` : ''}`;
      $('#care-count').textContent = `${completed} of 10 recorded`;
      const savedView = state.saved[state.caregiver] && !editing;
      $('#draft-status').textContent = editing ? 'Editing my entries' : savedView ? 'Saved' : 'Draft';
      $('#save-status').textContent = savedView ? 'Your part is saved. Nothing has been sent to the family.' : 'Nothing sent to the family';
      $('#save-part').innerHTML = `${savedView ? 'Edit my entries' : editing ? 'Save changes' : 'Save my part'} <span aria-hidden="true">→</span>`;
      $('#review-link').hidden = false;
      $('#care-date').value = state.date;
      $('.date-line label').textContent = formattedDate(state.date);
      const handover = state.caregiver === 'jane' && state.saved.anna;
      $('#shift-message').hidden = !handover && !savedView;
      $('#shift-message').textContent = savedView ? `${person().first}’s completed part. Each entry below shows who recorded it.` : 'Anna’s part is saved. Her entries are shown below. Record dinner, PM medication, bathing and grooming during your shift.';
      $('.routine-section>.section-helper').textContent = savedView ? `Your saved observations for ${resident.first}’s day.` : 'Record each thing you observed.';
      $('.changes-section>.section-helper').textContent = canEdit('concerns') ? 'Usually none. Choose what you observed.' : 'Usually none';
      $('[data-detail="appetite"]').hidden = !mealKeys.some(canEdit);
      $('.add-moment').hidden = !canEdit('note');
      $('#saved-moment').hidden = canEdit('note') || (!state.note && !state.photo);
      $('#saved-moment').innerHTML = `<span class="eyebrow">A MOMENT FROM TODAY</span><p>${escape(state.note)}</p>${authorHTML('note')}${state.photo && /^data:image\//.test(state.photo) ? `<img src="${escape(state.photo)}" alt="Photo recorded for today’s update">` : ''}`;
      const observationEntry = (item, index) => observationHTML(item) + (item.caregiver === state.caregiver && !savedView ? `<button class="text-button" data-edit-observation="${index}">Edit my observation</button>` : '');
      $('#later-mood-observations').innerHTML = state.observations.map((item, index) => item.category === 'Mood' ? observationEntry(item, index) : '').join('');
      $('#later-observations').innerHTML = state.observations.map((item, index) => item.category !== 'Mood' ? observationEntry(item, index) : '').join('');
      $('#add-mood-observation').hidden = !handover || savedView;
      $('#add-observation').hidden = !handover || savedView;
      $('.add-moment strong').textContent = state.note || state.photo ? 'A moment, ready to share' : 'A moment to share?';
      $('.add-moment>span:nth-child(2)>span').textContent = state.note || state.photo ? `${byline('note')} · tap to review` : 'Add a photo or a little note';
      updateIdentity();
    }
    document.addEventListener('click', event => {
      const answer = event.target.closest('[data-answer-kind]');
      if (!answer) return;
      const { item: key, answer: value, answerKind: kind } = answer.dataset;
      if (!canEdit(key)) return;
      if (kind === 'meal') {
        if (value === 'less') { currentMeal = key; openDetail('appetite', answer); return; }
        state.care[key] = value === 'well';
        if (value === 'none') state.mealDetails[key] = { portion: 'None', note: '' }; else delete state.mealDetails[key];
      } else if (kind === 'medication') {
        if (state.care[key] !== value) delete state.medicationDetails[key];
        state.care[key] = value;
      } else state.personal[key] = value;
      persist(); updateCare();
      if (kind === 'medication' && value !== 'given') { currentDose = key; openDetail('medication', answer); }
      if (kind === 'personal' && !['Done','Bath','Shower'].includes(value)) { currentPersonal = key; openDetail('personalCare', answer); }
    });
    $$('[data-mood]').forEach(button => button.addEventListener('click', () => {
      if (!canEdit('mood')) return;
      state.mood = button.dataset.mood;
      if (['Withdrawn','Anxious','Agitated'].includes(state.mood)) state.changes.mood = { ...(state.changes.mood || {}), status: state.mood }; else delete state.changes.mood;
      persist(); updateCare();
      if (state.changes.mood) openDetail('mood', button);
    }));
    $$('[data-sleep]').forEach(button => button.addEventListener('click', () => {
      if (!canEdit('sleep')) return;
      state.sleep = button.dataset.sleep;
      if (state.sleep === 'As usual') delete state.changes.sleep; else state.changes.sleep = { ...(state.changes.sleep || {}), status: state.sleep };
      persist(); updateCare();
      if (state.sleep !== 'As usual') openDetail('sleep', button);
    }));
    $$('[data-concern]').forEach(button => button.addEventListener('click', () => {
      if (!canEdit('concerns')) return;
      const type = button.dataset.concern;
      if (type === 'none') { concernKeys.forEach(key => delete state.changes[key]); state.concernsChecked = true; persist(); updateCare(); return; }
      if (!state.changes[type]) state.changes[type] = {};
      state.concernsChecked = true;
      persist(); updateCare(); openDetail(type, button);
    }));
    $('#care-date').addEventListener('change', event => {
      if (!event.target.value) { event.target.value = state.date; return; }
      const next = D.fresh(event.target.value); next.caregiver = state.caregiver; next.phase = state.phase;
      D.replace(next); state = D.state; editing = false; updateCare(); toast('A fresh entry for this date.');
    });
    $('#save-part').addEventListener('click', () => {
      if (state.saved[state.caregiver] && !editing) {
        editing = true; updateCare();
        const first = $('.care-item button, .answer-choices:not([hidden]) button');
        first?.focus(); return;
      }
      if (!persist()) { toast('This browser could not save your part. Keep this page open.'); return; }
      state.saved[state.caregiver] = true;
      if (state.caregiver === 'anna') state.phase = 'handover';
      if (!persist()) { state.saved[state.caregiver] = false; toast('Your part could not be saved. Keep this page open.'); return; }
      editing = false;
      updateCare();
      showSaved();
    });
    function showSaved() {
      $('#shift-body').innerHTML = `<span class="art art-sun" aria-hidden="true"></span><p class="eyebrow">CARE RECORD SAVED</p><h1 id="shift-title">Your part is saved.</h1><p>${person().first}’s entries are part of ${escape(resident.first)}’s day.</p><p><strong>Nothing has been sent to the family.</strong></p><a class="primary-button" href="review.html">Review the day <span>→</span></a><button class="secondary-action" data-action="close-shift">Back to the day</button>`;
      $('#shift-dialog').showModal();
    }
    const textarea = (value, label = 'A little context') => `<div class="field-group"><label class="field-label" for="detail-note">${label}<span class="optional-label">OPTIONAL</span></label><textarea id="detail-note" name="note" rows="3" maxlength="400" placeholder="Just a sentence or two…">${escape(value)}</textarea><div class="textarea-footer"><span id="character-count">${value.length}</span> / 400</div></div>`;
    const segment = (name, options, value) => `<div class="segmented-control">${options.map(option => `<label><input type="radio" name="${name}" value="${escape(option)}" ${value === option ? 'checked' : ''}><span>${escape(option)}</span></label>`).join('')}</div>`;
    const detailKey = type => type === 'appetite' ? currentMeal : type === 'medication' ? currentDose : type === 'personalCare' ? currentPersonal : concernKeys.includes(type) ? 'concerns' : type;
    function openDetail(type, trigger) {
      if (!(type in detailNames) && !['note','observation'].includes(type)) return;
      if (type === 'appetite' && !canEdit(currentMeal)) currentMeal = mealKeys.find(canEdit) || currentMeal;
      if (type === 'medication') currentDose = trigger?.dataset.dose || currentDose;
      if (type !== 'observation' && !canEdit(detailKey(type))) { toast('This entry belongs to its recorded caregiver.'); return; }
      if (type === 'observation' && state.saved[state.caregiver] && !editing) return;
      opener = trigger || document.activeElement;
      currentDetail = type;
      const change = type === 'appetite' ? (state.mealDetails[currentMeal] || {}) : type === 'personalCare' ? (state.changes[currentPersonal] || {}) : (state.changes[type] || {});
      const saveButton = $('#detail-form>.primary-button');
      saveButton.hidden = false;
      const moodObservation = type === 'observation' && (state.observations[observationIndex]?.category || observationCategory) === 'Mood';
      saveButton.innerHTML = `${moodObservation ? 'Save mood observation' : type === 'observation' ? 'Save my observation' : 'Save this detail'} <span aria-hidden="true">→</span>`;
      if (type === 'observation') {
        const item = state.observations[observationIndex] || {};
        if (moodObservation) {
          detailBody.innerHTML = `<h1 id="detail-title">Mood later in the day.</h1><p class="detail-description">${escape(D.people[state.by.mood]?.first || 'The earlier caregiver')} recorded ${escape(state.mood || 'an earlier mood')}. What did you observe during your shift?</p><input type="hidden" name="category" value="Mood"><div class="field-group"><span class="field-label" id="later-mood-label">Choose a mood</span><div class="later-mood-options" role="radiogroup" aria-labelledby="later-mood-label">${Object.keys(faces).map(mood => `<label><input type="radio" name="status" value="${escape(mood)}" ${item.status === mood ? 'checked' : ''} required>${faces[mood]}<span>${escape(mood)}</span></label>`).join('')}</div></div>${textarea(item.note || '', 'A little context')}`;
        } else {
          detailBody.innerHTML = `<h1 id="detail-title">Later in the day.</h1><p class="detail-description">Add what you observed during your shift. Earlier entries stay with their caregiver.</p><div class="field-group"><label class="field-label" for="observation-category">What did you observe?</label><select id="observation-category" name="category">${['Sleep','Concerns'].map(value => `<option ${item.category === value ? 'selected' : ''}>${value}</option>`).join('')}</select></div>${textarea(item.note || '', 'Your observation')}<label class="observation-difference"><input type="checkbox" name="different" ${item.different ? 'checked' : ''}> This was different from ${escape(resident.first)}’s usual day</label>`;
          $('#detail-note').required = true;
          $('.optional-label', detailBody).remove();
        }
      } else if (type === 'appetite') {
        const meal = currentMeal[0].toUpperCase() + currentMeal.slice(1);
        const portion = change.portion || '';
        detailBody.innerHTML = `<span class="art art-meal detail-art" aria-hidden="true"></span><h1 id="detail-title">A change in appetite?</h1><p class="detail-description">Choose the meal and amount. Add context if it helps.</p><div class="field-group"><span class="field-label" id="meal-label">Which meal?</span><div role="group" aria-labelledby="meal-label">${segment('meal', mealKeys.filter(canEdit).map(key => D.labels[key]), meal)}</div></div><div class="field-group"><span class="field-label" id="portion-label">How much did she eat?</span><div class="portion-options" role="group" aria-labelledby="portion-label">${[['None','0%'],['A little','25%'],['Half','50%'],['Most','75%']].map(([label, value]) => `<label class="portion-option"><input type="radio" name="portion" value="${label}" ${portion === label ? 'checked' : ''}><span class="plate" style="--portion:${value}" aria-hidden="true"></span><span>${label}</span></label>`).join('')}</div></div>${textarea(change.note || '')}<div class="detail-info"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5V12a8 8 0 1 1-4.7-7.3M20 4l-8 8-3-3"/></svg><span>This will appear in the family update.</span></div>`;
      } else if (type === 'medication') {
        const status = state.care[currentDose];
        detailBody.innerHTML = `<span class="art art-medication detail-art" aria-hidden="true"></span><h1 id="detail-title">${currentDose.toUpperCase()} medication</h1><p class="detail-description">${status ? `${escape(status[0].toUpperCase() + status.slice(1))} recorded. Add a short note if needed.` : 'Choose given, not given, or refused on the daily screen first.'}</p>${textarea(state.medicationDetails[currentDose] || '', 'What happened?')}`;
      } else if (type === 'note') {
        detailBody.innerHTML = `<h1 id="detail-title">The little moments.</h1><p class="detail-description">A story, a smile, something her family would love to know.</p>${textarea(state.note, 'A note for her family')}<div class="field-group"><label class="field-label" for="moment-photo">Add a photo<span class="optional-label">OPTIONAL</span></label><input class="file-input" id="moment-photo" type="file" name="photo" accept="image/*"><p class="textarea-footer">${state.photo ? 'A photo is already attached. Choose another to replace it.' : 'Choose an image from this device.'}</p></div>${state.photo ? '<button class="text-button" data-action="remove-photo" type="button">Remove attached photo</button>' : ''}`;
      } else {
        const titles = { sleep: 'How did she sleep?', medication: 'A change in medication?', personalCare: 'A change in personal care?', wandering: 'A moment of wandering?', sundowning: 'An unsettled evening?', fall: 'A fall or a near-fall?', pain: 'Some discomfort today?', skin: 'Something with her skin?', mood: 'A different kind of day?', other: 'What would you like to add?' };
        const choices = { fall: ['Fall','Near-fall'] };
        const art = type === 'medication' ? 'art-medication' : type === 'personalCare' ? 'art-hygiene' : 'art-weary';
        const careType = currentPersonal;
        const description = type === 'sleep' ? `${state.sleep} recorded. Add context if it helps.` : type === 'mood' ? `${state.mood} recorded. Add context if it helps.` : 'A few details help her family understand.';
        detailBody.innerHTML = `<span class="art ${art} detail-art" aria-hidden="true"></span><h1 id="detail-title">${titles[type]}</h1><p class="detail-description">${escape(description)}</p>${type === 'personalCare' ? `<p class="detail-description">${D.labels[currentPersonal]} · ${state.personal[currentPersonal]}</p>` : ''}${choices[type] ? `<div class="field-group"><label class="field-label" for="detail-status">What was different?</label><select id="detail-status" name="status">${choices[type].map(option => `<option ${change.status === option ? 'selected' : ''}>${option}</option>`).join('')}</select></div>` : ''}${textarea(change.note || '', 'What happened?')}`;
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
      const editObservation = event.target.closest('[data-edit-observation]');
      if (editObservation) {
        observationIndex = Number(editObservation.dataset.editObservation);
        if (state.observations[observationIndex]?.caregiver === state.caregiver) { observationCategory = state.observations[observationIndex].category; openDetail('observation', editObservation); }
      }
      if (event.target.closest('#add-mood-observation')) { observationIndex = -1; observationCategory = 'Mood'; openDetail('observation', event.target.closest('#add-mood-observation')); }
      if (event.target.closest('#add-observation')) { observationIndex = -1; observationCategory = 'Sleep'; openDetail('observation', event.target.closest('#add-observation')); }
      const trigger = event.target.closest('[data-detail]');
      if (trigger) openDetail(trigger.dataset.detail, trigger);
      if (event.target.closest('[data-action="remove-detail"]')) {
        if (!canEdit(detailKey(currentDetail))) return;
        if (currentDetail === 'medication') { state.care[currentDose] = null; delete state.medicationDetails[currentDose]; }
        else if (currentDetail === 'personalCare') { state.personal[currentPersonal] = ''; delete state.changes[currentPersonal]; }
        else { delete state.changes[currentDetail]; if (currentDetail === 'sleep') state.sleep = ''; if (concernKeys.includes(currentDetail) && !concernKeys.some(key => state.changes[key])) state.concernsChecked = false; }
        persist(); updateCare(); closeDetail(); toast('Answer cleared.');
      }
      if (event.target.closest('[data-action="remove-photo"]') && canEdit('note')) { state.photo = ''; persist(); openDetail('note'); toast('Photo removed.'); }
    });
    function closeDetail() {
      dialog.close();
      const key = currentDetail === 'medication' ? currentDose : currentDetail === 'personalCare' ? currentPersonal : currentDetail === 'appetite' ? currentMeal : '';
      const fallback = key ? document.querySelector(`[data-item="${key}"][aria-pressed="true"]`) || document.querySelector(`[data-item="${key}"]`) : document.querySelector(`[data-detail="${currentDetail}"]`);
      const target = opener?.isConnected && opener.getClientRects().length ? opener : fallback;
      target?.focus({ preventScroll: true });
    }
    $('[data-action="close-detail"]').addEventListener('click', closeDetail);
    dialog.addEventListener('click', event => { if (event.target === dialog && event.clientY < dialog.getBoundingClientRect().top) closeDetail(); });
    $('#detail-form').addEventListener('submit', async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const values = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === 'string'));
      if (currentDetail !== 'observation' && !canEdit(detailKey(currentDetail))) return;
      if (currentDetail === 'observation') {
        if (values.category === 'Mood' && !Object.keys(faces).includes(values.status)) { toast('Choose the mood you observed.'); return; }
        if (values.category !== 'Mood' && !values.note?.trim()) { toast('Add what you observed.'); return; }
        const item = { category: values.category, ...(values.category === 'Mood' ? { status: values.status } : {}), note: (values.note || '').trim(), different: values.category === 'Mood' ? values.status !== state.mood : Boolean(values.different), caregiver: state.caregiver };
        if (observationIndex < 0) state.observations.push(item);
        else if (state.observations[observationIndex]?.caregiver === state.caregiver) state.observations[observationIndex] = item;
      } else if (currentDetail === 'note') {
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
        if (currentDetail === 'appetite') {
          const meal = values.meal.toLowerCase();
          if (!mealKeys.includes(meal) || !canEdit(meal)) return;
          state.mealDetails[meal] = { portion: values.portion, note: values.note || '' };
          state.care[meal] = values.portion !== 'None';
          if (state.changes.appetite && canEdit('concerns')) state.changes.appetite = { note: values.note || '' };
        } else if (currentDetail === 'personalCare') state.changes[currentPersonal] = values;
        else state.changes[currentDetail] = values;
        if (concernKeys.includes(currentDetail) && canEdit('concerns')) state.concernsChecked = true;

      }
      persist(); updateCare(); closeDetail(); toast(currentDetail === 'note' ? 'Your moment is ready to share.' : 'A little context, added.');
    });
    updateCare();
    if (params.has('detail')) openDetail(params.get('detail'));
    if (params.has('focus')) {
      const key = params.get('focus');
      if (D.keys.includes(key) && D.canEdit(key)) { editing = true; updateCare(); }
      requestAnimationFrame(() => (document.getElementById(`item-${key}`) || document.getElementById(`${key}-title`))?.scrollIntoView({ block: 'center' }));
    }
    if (params.get('stage') === 'saved') showSaved();
  }

  function progressHTML(final = false) {
    const count = D.keys.filter(D.recorded).length;
    const missing = D.keys.filter(key => !D.recorded(key) && (final || !D.later(key))).length;
    return `<strong>${count}/10 recorded</strong><span class="different-count">${D.changes().length} different</span><span>${missing} ${final ? 'not recorded' : 'to record'}</span>`;
  }
  function changeHTML() {
    return D.changes().map(item => `<div class="change-summary"><div><strong>${escape(item.title)}</strong></div>${item.note ? `<p>${escape(item.note)}</p>` : ''}${item.caregiver ? `<span class="byline">Recorded by ${escape(D.people[item.caregiver]?.first || '')}</span>` : authorHTML(item.key)}</div>`).join('') || '<p class="no-changes">No differences noted in the recorded care.</p>';
  }
  function showMoment() {
    $('#review-note').textContent = state.note;
    $('.moment-review').hidden = !state.note && !state.photo;
    if (state.photo && /^data:image\//.test(state.photo)) { $('#review-photo').src = state.photo; $('#review-photo').hidden = false; }
    $('.moment-signature').textContent = byline('note');
  }
  if (document.body.dataset.page === 'review') {
    const finalShift = true;
    $$('.recipient').forEach((label, index) => {
      const member = resident.family[index];
      if (!member) { label.hidden = true; return; }
      label.querySelector('input').value = member.name;
      label.querySelector('.avatar').textContent = member.name[0];
      label.querySelector('strong').textContent = member.name;
      label.querySelector('span:nth-of-type(2)>span').textContent = member.relation;
    });
    $('.review-hero>.eyebrow').textContent = formattedDate(state.date);
    $('.review-person>div>span').textContent = 'Care from ' + (D.list(D.caregivers()) || 'your caregivers');
    $('.review-step').textContent = finalShift ? 'FINAL SHIFT' : 'SAVED DAY';
    $('.review-hero').insertAdjacentHTML('afterend', `<p class="review-phase">${escape(person().name)} · ${finalShift ? 'Reviewing the whole day' : 'Morning shift · final caregiver sends the update'}</p><div class="day-progress review-progress">${progressHTML(finalShift)}</div>`);
    const laterMood = state.observations.filter(item => item.category === 'Mood' && item.status).at(-1);
    $('#review-mood').textContent = state.mood ? laterMood ? `${state.mood} in the morning, ${laterMood.status} later` : `${state.mood} today` : 'Mood not recorded';
    $('#review-mood-subtitle').textContent = laterMood ? `${byline('mood')} · Later recorded by ${D.people[laterMood.caregiver]?.first || 'another caregiver'}` : byline('mood') || 'Choose a mood before sharing.';
    const faces = { Withdrawn: ['low','M15 21h1m15 0h1M17 33q7-8 14 0'], Anxious: ['unsettled','m12 18 7 2m10 0 7-2M16 25h1m14 0h1M18 34q4-4 7 0t6 0'], Agitated: ['agitated','m12 19 8 3m16-3-8 3M16 27h1m14 0h1M17 35q7-5 14 0'], Calm: ['content','M12 22q4-5 8 0m8 0q4-5 8 0M17 30q7 8 14 0'], Cheerful: ['bright','M12 20q4-6 8 0m8 0q4-6 8 0M15 28q9 17 18 0Z'] };
    const face = $('.review-intro .mood-face');
    face.className = `mood-face ${(faces[state.mood] || ['okay'])[0]} small-face`;
    face.querySelector('path').setAttribute('d', (faces[state.mood] || ['okay','M15 21h1m15 0h1M18 31h12'])[1]);
    const item = key => `<div class="review-item"><span>${escape(D.labels[key])}${authorHTML(key)}</span><strong class="${!D.recorded(key) && !D.later(key) ? 'unrecorded' : ''}">${!D.recorded(key) && !finalShift && D.later(key) ? 'Later today' : escape(D.status(key))}</strong></div>`;
    $('#summary-meals').innerHTML = mealKeys.map(key => item(key) + (state.mealDetails[key]?.note ? `<p class="review-item-note">${escape(state.mealDetails[key].note)}</p>` : '')).join('');
    $('#summary-medication').innerHTML = doseKeys.map(key => item(key) + (state.medicationDetails[key] ? `<p class="review-item-note">${escape(state.medicationDetails[key])}</p>` : '')).join('');
    $('#summary-personal-care').innerHTML = ['shower','grooming'].map(item).join('');
    $('#summary-sleep').innerHTML = escape(D.status('sleep')) + authorHTML('sleep');
    $('#summary-sleep').classList.toggle('unrecorded', !state.sleep);
    $('#summary-concerns').innerHTML = escape(D.status('concerns')) + authorHTML('concerns');
    $('#review-changes').innerHTML = changeHTML();
    const laterNotes = state.observations.filter(item => !item.different);
    if (laterNotes.length) $('.changes-review').insertAdjacentHTML('afterend', `<section class="review-section"><div class="section-heading"><h2>Later observations</h2></div>${laterNotes.map(observationHTML).join('')}</section>`);
    $('.care-review .text-button').textContent = 'My entries';
    $('.sleep-review .text-button').hidden = !D.canEdit('sleep');
    $('.changes-review .text-button').hidden = !D.canEdit('concerns');
    showMoment();
    const missing = D.keys.filter(key => !D.recorded(key) && (finalShift || !D.later(key)));
    $('#missing-items').hidden = !missing.length;
    $('#missing-items>strong').textContent = finalShift ? 'Not recorded today' : 'Still to record this shift';
    $('#missing-list').innerHTML = missing.map(key => `<li>${escape(D.labels[key])} · not recorded <a href="${D.link('care.html', key)}" aria-label="Complete ${D.labels[key].toLowerCase()}">Complete</a></li>`).join('');
    if (missing.length) $('#complete-missing').href = D.link('care.html', missing[0]);
    $('.send-unrecorded').hidden = !finalShift;
    $('.recipients-section').hidden = !finalShift;
    $('#edit-recipients').addEventListener('click', () => { $('.recipient input').focus(); toast('Tap a person to include or remove them.'); });
    function updateRecipients() {
      if (!finalShift) { $('#send-update').disabled = false; $('#send-update').textContent = 'Back to my part'; $('.send-hint').textContent = 'Nothing sent. The final caregiver reviews and sends the whole day.'; return; }
      const selected = $$('input[name="recipient"]:checked');
      const accepted = !missing.length || $('#send-unrecorded').checked;
      $('#send-update').disabled = !selected.length || !accepted;
      $('#send-update').innerHTML = `Send daily update <span aria-hidden="true">↗</span>`;
      $('.send-hint').textContent = !selected.length ? 'Choose at least one family member.' : !accepted ? 'Complete missing items or send them marked not recorded.' : 'One update, with care from ' + D.list(D.caregivers());
    }
    $$('input[name="recipient"]').forEach(input => input.addEventListener('change', updateRecipients));
    $('#send-unrecorded').addEventListener('change', updateRecipients);
    $('#send-update').addEventListener('click', () => {
      if (!finalShift) { location.href = D.link('care.html'); return; }
      const recipients = $$('input[name="recipient"]:checked').map(input => input.value);
      if (!recipients.length || (missing.length && !$('#send-unrecorded').checked)) return;
      state.saved[state.caregiver] = true; state.sent = { recipients, gaps: missing }; persist();
      $('#sent-recipients').textContent = `One update for ${D.list(recipients)}, with care from ${D.list(D.caregivers())}.${missing.length ? ' Missing items are marked not recorded.' : ''}`;
      if (!$('#view-family')) $('#back-to-day').insertAdjacentHTML('beforebegin', `<a class="primary-button" id="view-family" href="family.html">View the family update <span>→</span></a>`);
      $('#back-to-day').className = 'secondary-action';
      $('#sent-dialog').classList.add('shift-dialog');
      $('#sent-dialog').showModal();
    });
    $('#back-to-day').addEventListener('click', () => $('#sent-dialog').close());
    updateRecipients();
  }
  if (document.body.dataset.page === 'family') {
    $('.review-hero>.eyebrow').textContent = formattedDate(state.date);
    $('#family-state').textContent = state.sent ? 'DAILY FAMILY UPDATE' : 'FAMILY UPDATE PREVIEW';
    $('.review-person>div>span').textContent = 'With care, from ' + (D.list(D.caregivers()) || 'her caregivers');
    showMoment();
    $('#family-changes').innerHTML = changeHTML();
    const recordedMeals = mealKeys.filter(D.recorded);
    const allWell = recordedMeals.length === 3 && recordedMeals.every(key => D.status(key) === 'Ate well');
    const sentences = [];
    if (allWell) sentences.push(`${resident.first} ate well at breakfast, lunch and dinner.`);
    else recordedMeals.forEach(key => sentences.push(`${D.labels[key]}: ${D.status(key).toLowerCase()}.`));
    const laterMood = state.observations.filter(item => item.category === 'Mood' && item.status).at(-1);
    if (state.mood) sentences.push(laterMood ? `${D.people[state.by.mood]?.first || 'Her caregiver'} observed ${resident.first} was ${state.mood.toLowerCase()} in the morning. ${D.people[laterMood.caregiver]?.first || 'Her next caregiver'} later observed she was ${laterMood.status.toLowerCase()}.` : `${D.people[state.by.mood]?.first || 'Her caregiver'} recorded that she appeared ${state.mood.toLowerCase()}.`);
    if (state.care.am === 'given' && state.care.pm === 'given') sentences.push('Her morning and evening medication were given.');
    else doseKeys.filter(D.recorded).forEach(key => {
      const period = key === 'am' ? 'morning' : 'evening';
      sentences.push(state.care[key] === 'refused' ? `She refused her ${period} medication.` : `Her ${period} medication was ${state.care[key]}.`);
    });
    const bathing = state.personal.shower;
    if (['Bath','Shower','Done'].includes(bathing)) sentences.push(`${D.people[state.by.shower]?.first || 'Her caregiver'} helped ${resident.first} with ${bathing === 'Bath' ? 'a bath' : bathing === 'Shower' ? 'a shower' : 'bathing'}.`);
    else if (bathing) sentences.push(bathing === 'Declined' ? 'She declined bathing.' : 'Bathing was not done.');
    if (state.personal.grooming) sentences.push(state.personal.grooming === 'Done' ? 'Her grooming was completed.' : state.personal.grooming === 'Declined' ? 'She declined grooming.' : 'Grooming was not done.');
    if (state.sleep === 'As usual') sentences.push('Sleep was recorded as usual.');
    if (state.concernsChecked && !concernKeys.some(key => state.changes[key])) sentences.push('No other concerns were recorded.');
    $('#family-day').textContent = sentences.join(' ');
    const laterNotes = state.observations.filter(item => !item.different);
    if (laterNotes.length) $('#family-day').insertAdjacentHTML('afterend', laterNotes.map(observationHTML).join(''));
    const missing = D.keys.filter(key => !D.recorded(key));
    $('#family-gaps').hidden = !missing.length;
    $('#family-gaps-list').textContent = D.list(missing.map(key => D.labels[key])) + (missing.length === 1 ? ' was' : ' were') + ' not recorded today.';
    $('#family-signature').textContent = D.list(D.caregivers()) || 'Caregiver names not recorded';
  }
})();
