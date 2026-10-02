/* DailyCare interaction prototype: a shared day is simulated in this browser. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const residents = [
    { id:'margaret', name:'Margaret Rose', initials:'MR', family:'Sophie and James' },
    { id:'elsie', name:'Elsie Carter', initials:'EC', family:'Nora' },
    { id:'david', name:'David Moore', initials:'DM', family:'Leah' }
  ];
  const caregivers = [
    { id:'anna', name:'Anna Lewis', first:'Anna', initials:'AL' },
    { id:'maya', name:'Maya Patel', first:'Maya', initials:'MP' }
  ];
  const items = [
    { id:'sleep', title:'Sleep', usual:'Usually: sleeps well', due:0, options:['As usual','Restless','Less than usual','More than usual'], normal:'As usual', group:'Overnight' },
    { id:'breakfast', title:'Breakfast', usual:'Usually: eats well', due:0, options:['Ate well','A little','Did not eat'], normal:'Ate well', group:'Morning' },
    { id:'am', title:'AM medication', usual:'Usually: given', due:0, options:['Given','Not given','Refused'], normal:'Given', group:'Morning' },
    { id:'shower', title:'Shower', usual:'Usually: when planned', due:0, options:['Completed','Not today'], normal:'Completed', group:'Morning' },
    { id:'grooming', title:'Grooming', usual:'Usually: each morning', due:0, options:['Completed','Not today'], normal:'Completed', group:'Morning' },
    { id:'lunch', title:'Lunch', usual:'Usually: eats well', due:1, options:['Ate well','A little','Did not eat'], normal:'Ate well', group:'Midday' },
    { id:'dinner', title:'Dinner', usual:'Usually: eats well', due:2, options:['Ate well','A little','Did not eat'], normal:'Ate well', group:'Evening' },
    { id:'pm', title:'PM medication', usual:'Usually: given', due:2, options:['Given','Not given','Refused'], normal:'Given', group:'Evening' },
    { id:'mood', title:'Mood', usual:'Usually: calm', due:0, options:['Calm','Cheerful','Withdrawn','Anxious','Agitated'], normal:'Calm', group:'Whole day' },
    { id:'concerns', title:'Concerns', usual:'Usually: none', due:0, options:['No concerns','Appetite','Wandering','Sundowning','Fall or near-fall','Pain','Skin concern','Other'], normal:'No concerns', group:'Whole day' }
  ];
  const itemById = Object.fromEntries(items.map(item => [item.id, item]));
  const params = new URLSearchParams(location.search);
  const sample = params.get('sample') || '';
  const storageKey = 'dailycare-shared-day-v1-' + (sample || 'live');
  const freshDay = () => ({ entries:{}, moment:'', photo:'', momentBy:'', savedBy:[], sent:false, markedMissing:[] });
  const newState = () => ({ activeResident:'margaret', activeCaregiver:'anna', phase:0, days:{ margaret:freshDay() } });
  const entry = (value, by, note = '', amount = '') => ({ value, by, note, amount });
  function makeFixture(name) {
    const next = newState();
    const d = next.days.margaret;
    d.entries.sleep = entry('Restless','anna','Woke twice overnight and settled after reassurance.');
    d.entries.breakfast = entry('Ate well','anna');
    d.entries.am = entry('Given','anna');
    if (name !== 'morning') {
      d.entries.shower = entry('Completed','anna');
      d.entries.grooming = entry('Completed','anna');
      d.entries.lunch = entry('Ate well','anna');
      d.moment = 'Margaret paused beside the garden roses and told Anna about the ones she used to grow.';
      d.momentBy = 'anna';
      d.savedBy = ['anna'];
      next.activeCaregiver = 'maya';
      next.phase = 2;
    }
    if (name === 'complete' || name === 'missing') {
      d.entries.dinner = entry('Ate well','maya');
      if (name === 'complete') d.entries.pm = entry('Given','maya');
      d.entries.mood = entry('Calm','maya');
      d.entries.concerns = entry('No concerns','maya');
      d.savedBy.push('maya');
    }
    return next;
  }
  let state;
  try { state = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { state = null; }
  if (!state || !state.days) state = sample ? makeFixture(sample) : newState();
  const day = () => state.days[state.activeResident] || (state.days[state.activeResident] = freshDay());
  const resident = () => residents.find(person => person.id === state.activeResident) || residents[0];
  const caregiver = id => caregivers.find(person => person.id === id) || caregivers[0];
  const changed = item => day().entries[item.id] && day().entries[item.id].value !== item.normal;
  const url = (page, hash = '') => page + (sample ? '?sample=' + encodeURIComponent(sample) : '') + (hash ? '#' + hash : '');
  function persist() { try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch {} }
  function toast(message) { const node = $('#toast'); if (!node) return; node.textContent = message; node.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('visible'), 2800); }
  const openItems = new Set();
  if (location.hash && itemById[location.hash.slice(1)]) openItems.add(location.hash.slice(1));

  function setStaticLinks() {
    document.querySelectorAll('a[href^="care.html"],a[href^="review.html"],a[href^="family.html"]').forEach(link => {
      const href = link.getAttribute('href');
      const parts = href.split('#');
      link.href = url(parts[0], parts[1] || '');
    });
  }
  setStaticLinks();
  function renderCare() {
    const person = resident();
    const carer = caregiver(state.activeCaregiver);
    $('#resident-name').textContent = person.name;
    $('#resident-avatar').textContent = person.initials;
    $('#caregiver-name').textContent = carer.first;
    $('#caregiver-avatar').textContent = carer.initials;
    $('.shared-main h1').innerHTML = esc(person.name.split(' ')[0]) + '’s day,<br>together.';
    $('#shift-label').textContent = state.phase === 2 ? 'EVENING SHIFT · 7:30 PM' : state.phase === 1 ? 'DAY SHIFT · 1:30 PM' : 'MORNING SHIFT · 10:00 AM';
    const recorded = items.filter(item => day().entries[item.id]).length;
    const different = items.filter(changed).length;
    const later = items.filter(item => !day().entries[item.id] && item.due > state.phase).length;
    const needs = items.length - recorded - later;
    $('#progress-heading').textContent = state.phase === 2 ? 'Whole day progress' : 'Today so far';
    $('#progress-fraction').textContent = recorded + ' of ' + items.length + ' recorded';
    $('#progress-fill').style.width = recorded * 10 + '%';
    $('#progress-recorded').textContent = recorded + ' recorded';
    $('#progress-different').textContent = different + ' different';
    $('#progress-needs').textContent = needs + ' need' + (needs === 1 ? 's' : '') + ' an answer';
    $('#progress-later').textContent = later + ' later today';
    $('#progress-later').hidden = !later;
    const nextItem = items.find(item => !day().entries[item.id] && item.due <= state.phase);
    $('#next-answer').hidden = !nextItem;
    if (nextItem) $('#next-answer').textContent = 'Next answer: ' + nextItem.title + ' →';
    const saved = day().savedBy;
    const notice = $('#saved-notice');
    notice.hidden = !saved.length && !day().sent;
    if (day().sent) notice.innerHTML = '<strong>Family update prepared.</strong><span>Open the family view to read the combined day.</span><a href="' + url('family.html') + '">View family update →</a>';
    else if (saved.length) {
      const savedLabel = saved.length === 1 ? caregiver(saved[0]).first + '’s part is saved.' : 'Parts from ' + saved.map(id => caregiver(id).first).join(' and ') + ' are saved.';
      notice.innerHTML = '<strong>' + esc(savedLabel) + '</strong><span>Nothing has gone to the family yet.</span>' + (state.activeCaregiver === 'anna' && !saved.includes('maya') ? '<button type="button" data-next="maya">Continue as Maya →</button>' : '');
    }
    let lastGroup = '';
    $('#care-list').innerHTML = items.map(item => {
      const record = day().entries[item.id];
      const upcoming = !record && item.due > state.phase && !openItems.has(item.id);
      const expanded = !record && !upcoming || openItems.has(item.id);
      let html = '';
      if (item.group !== lastGroup) { lastGroup = item.group; html += '<h3 class="time-heading">' + esc(item.group) + '</h3>'; }
      html += '<article class="check-card ' + (record ? 'is-recorded ' : '') + (record && changed(item) ? 'is-different ' : '') + (upcoming ? 'is-later ' : '') + (expanded ? 'is-open' : '') + '" id="' + item.id + '">';
      if (record && !expanded) {
        html += '<button class="check-summary" type="button" data-reopen="' + item.id + '" aria-expanded="false" aria-label="' + esc(item.title + '. ' + record.value + '. Recorded by ' + caregiver(record.by).name + (changed(item) ? '. Different from usual' : '')) + '"><span class="summary-icon">✓</span><span class="summary-copy"><strong>' + esc(item.title) + '</strong><span>· ' + esc(record.value) + (record.amount ? ', ' + esc(record.amount) : '') + '</span><small>by ' + esc(caregiver(record.by).first) + '</small></span>' + (changed(item) ? '<em>Different</em>' : '') + '<span class="summary-chevron">⌄</span></button>';
      } else if (upcoming) {
        html += '<button class="later-summary" type="button" data-reopen="' + item.id + '"><span><strong>' + esc(item.title) + '</strong><small>' + esc(item.usual) + '</small></span><span class="later-tag">Later today</span></button>';
      } else {
        html += '<div class="check-open-head"><span><strong>' + esc(item.title) + '</strong><small>' + esc(item.usual) + '</small></span><span class="needs-tag">' + (record ? 'Edit answer' : item.due > state.phase ? 'Record early' : 'Needs an answer') + '</span></div>';
        html += '<div class="answer-options ' + (item.id === 'mood' ? 'mood-answers' : '') + '" role="group" aria-label="' + esc(item.title) + '">';
        html += item.options.map(option => '<button type="button" data-answer="' + item.id + '" data-value="' + esc(option) + '" aria-pressed="' + (record && record.value === option ? 'true' : 'false') + '">' + esc(option) + '</button>').join('');
        html += '</div>';
        if (record) html += '<div class="edit-meta"><span>Recorded by ' + esc(caregiver(record.by).first) + (record.note ? ' · ' + esc(record.note) : '') + '</span><button type="button" data-collapse="' + item.id + '">Done</button></div>';
      }
      html += '</article>';
      return html;
    }).join('');
    $('#moment-note').value = day().moment;
    $('#moment-photo-preview').hidden = !day().photo;
    if (day().photo) $('#moment-photo-preview').src = day().photo;
    $('#moment-byline').textContent = day().momentBy ? 'Added by ' + caregiver(day().momentBy).first : 'Optional · one moment for the family';
    $('#review-link').href = url('review.html');
  }
  let detailItem = '';
  function openDetail(item) {
    detailItem = item.id;
    const record = day().entries[item.id];
    $('#detail-title').textContent = item.id === 'breakfast' || item.id === 'lunch' || item.id === 'dinner' ? 'How much at ' + item.title.toLowerCase() + '?' : 'A little more about ' + item.title.toLowerCase();
    $('#detail-prompt').textContent = item.id === 'sleep' ? 'Add what changed during the night.' : item.id === 'mood' ? 'What helped Margaret today?' : item.id === 'concerns' ? 'What happened, and what should the next caregiver know?' : item.id === 'am' || item.id === 'pm' ? 'Add helpful context without medication names or doses.' : 'A short detail helps the next caregiver and family.';
    $('#detail-note').value = record.note || '';
    $('#detail-extra').innerHTML = ['breakfast','lunch','dinner'].includes(item.id) ? '<div class="amount-label">How much did she eat?</div><div class="amount-options">' + ['Most','Half','A little','None'].map(amount => '<label><input type="radio" name="amount" value="' + amount + '" ' + (record.amount === amount ? 'checked' : '') + '><span>' + amount + '</span></label>').join('') + '</div>' : '';
    $('#detail-dialog').showModal();
  }
  function showSwitcher(type) {
    $('#switch-title').textContent = type === 'resident' ? 'Choose a resident' : 'View another caregiver’s shift';
    $('#switch-dialog').dataset.type = type;
    const list = type === 'resident' ? residents : caregivers;
    $('#switch-options').innerHTML = list.map(person => '<button class="switch-option" type="button" data-select="' + esc(person.id) + '"><span class="avatar ' + (type === 'resident' ? 'person-avatar' : 'caregiver') + '">' + esc(person.initials) + '</span><span><strong>' + esc(person.name) + '</strong><small>' + (type === 'resident' ? person.id === state.activeResident ? 'Current resident' : 'Open care day' : person.id === 'anna' ? 'Morning and midday' : 'Evening and final review') + '</small></span><span>→</span></button>').join('');
    $('#switch-dialog').showModal();
  }
  if (document.body.dataset.page === 'care') {
    renderCare();
    $('#resident-switch').addEventListener('click', () => showSwitcher('resident'));
    $('#caregiver-switch').addEventListener('click', () => showSwitcher('caregiver'));
    $('#next-answer').addEventListener('click', () => { const item = items.find(candidate => !day().entries[candidate.id] && candidate.due <= state.phase); if (item) document.getElementById(item.id).scrollIntoView({block:'center',behavior:'smooth'}); });
    $('#switch-close').addEventListener('click', () => $('#switch-dialog').close());
    $('#switch-options').addEventListener('click', event => {
      const button = event.target.closest('[data-select]'); if (!button) return;
      if ($('#switch-dialog').dataset.type === 'resident') state.activeResident = button.dataset.select;
      else { state.activeCaregiver = button.dataset.select; state.phase = button.dataset.select === 'maya' ? 2 : Math.max(1, state.phase === 2 ? 1 : state.phase); }
      persist(); $('#switch-dialog').close(); openItems.clear(); renderCare();
    });
    $('#care-list').addEventListener('click', event => {
      const answer = event.target.closest('[data-answer]');
      if (answer) {
        const item = itemById[answer.dataset.answer];
        const previous = day().entries[item.id];
        const value = answer.dataset.value;
        day().entries[item.id] = entry(value, state.activeCaregiver, previous && previous.value === value ? previous.note : '', previous && previous.value === value ? previous.amount : '');
        day().sent = false;
        openItems.delete(item.id);
        persist(); renderCare();
        if (value !== item.normal) openDetail(item);
        return;
      }
      const reopen = event.target.closest('[data-reopen]');
      if (reopen) { openItems.add(reopen.dataset.reopen); renderCare(); document.getElementById(reopen.dataset.reopen).scrollIntoView({block:'center',behavior:'smooth'}); return; }
      const collapse = event.target.closest('[data-collapse]');
      if (collapse) { openItems.delete(collapse.dataset.collapse); renderCare(); }
    });
    $('#detail-close').addEventListener('click', () => $('#detail-dialog').close());
    $('#detail-form').addEventListener('submit', event => {
      event.preventDefault();
      const record = day().entries[detailItem]; if (!record) return;
      record.note = $('#detail-note').value.trim();
      const amount = document.querySelector('input[name="amount"]:checked');
      record.amount = amount ? amount.value : '';
      persist(); $('#detail-dialog').close(); renderCare(); toast('Detail saved for the shared day.');
    });
    $('#moment-note').addEventListener('change', event => { day().moment = event.target.value.trim(); day().momentBy = day().moment || day().photo ? state.activeCaregiver : ''; day().sent = false; persist(); renderCare(); });
    $('#moment-photo').addEventListener('change', event => {
      const file = event.target.files[0]; if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast('Please choose a photo under 2 MB.'); event.target.value = ''; return; }
      const reader = new FileReader();
      reader.onload = () => { if (!/^data:image\//.test(String(reader.result))) return; day().photo = String(reader.result); day().momentBy = state.activeCaregiver; day().sent = false; persist(); renderCare(); toast('Photo added to the shared day.'); };
      reader.readAsDataURL(file);
    });
    $('#save-part').addEventListener('click', () => { if (!day().savedBy.includes(state.activeCaregiver)) day().savedBy.push(state.activeCaregiver); if (state.activeCaregiver === 'anna') state.phase = 1; persist(); renderCare(); toast(caregiver(state.activeCaregiver).first + '’s part saved. Nothing sent to family.'); });
    $('#saved-notice').addEventListener('click', event => { if (event.target.closest('[data-next]')) { state.activeCaregiver = 'maya'; state.phase = 2; persist(); renderCare(); scrollTo({top:0,behavior:'smooth'}); } });
    if (location.hash && itemById[location.hash.slice(1)]) setTimeout(() => document.getElementById(location.hash.slice(1)).scrollIntoView({block:'center'}), 100);
  }

  function renderReview() {
    const person = resident();
    $('.review-eyebrow').textContent = 'SUNDAY, SEPTEMBER 13 · ' + person.name.toUpperCase();
    $('.review-main h1').innerHTML = 'One day,<br>many caring hands.';
    $('.review-lede').textContent = 'A shared update from everyone who looked after ' + person.name.split(' ')[0] + ' today.';
    const recorded = items.filter(item => day().entries[item.id]);
    const differences = recorded.filter(changed);
    const missing = items.filter(item => !day().entries[item.id] && item.due <= state.phase);
    const upcoming = items.filter(item => !day().entries[item.id] && item.due > state.phase);
    $('#review-completed').textContent = recorded.length + ' recorded';
    $('#review-different').textContent = differences.length + ' different';
    $('#review-unrecorded').textContent = missing.length + ' not recorded';
    if (day().moment || day().photo) { $('#review-moment').hidden = false; $('#review-moment-text').textContent = day().moment ? '“' + day().moment + '”' : ''; $('#review-moment-text').hidden = !day().moment; $('#review-photo').hidden = !day().photo; if (day().photo) $('#review-photo').src = day().photo; $('#review-moment-by').textContent = 'Shared by ' + caregiver(day().momentBy).first; }
    $('#review-recorded-list').innerHTML = recorded.map(item => {
      const record = day().entries[item.id];
      return '<div class="review-line"><span><strong>' + esc(item.title) + '</strong><small>Recorded by ' + esc(caregiver(record.by).first) + '</small></span><span>' + esc(record.value) + (record.amount ? ' · ' + esc(record.amount) : '') + '</span></div>';
    }).join('') || '<p>No answers recorded yet.</p>';
    $('#review-differences').innerHTML = differences.map(item => {
      const record = day().entries[item.id];
      return '<div class="difference-line"><strong>' + esc(item.title) + ' · ' + esc(record.value) + '</strong><span>Recorded by ' + esc(caregiver(record.by).first) + '</span>' + (record.note ? '<p>' + esc(record.note) + '</p>' : '') + '</div>';
    }).join('') || '<p>No changes recorded.</p>';
    $('#missing-block').hidden = !missing.length && !upcoming.length;
    $('#review-missing-list').innerHTML = missing.map(item => '<div class="missing-line"><strong>' + esc(item.title) + ' · not recorded</strong><a href="' + url('care.html', item.id) + '">Complete →</a></div>').join('') + upcoming.map(item => '<div class="missing-line later-review"><strong>' + esc(item.title) + '</strong><span>Later today</span></div>').join('');
    $('.missing-confirm').hidden = !missing.length || state.phase < 2;
    const names = [...new Set([...day().savedBy, ...recorded.map(item => day().entries[item.id].by), ...(day().momentBy ? [day().momentBy] : [])])].map(id => caregiver(id).name);
    $('#review-caregivers').textContent = names.length ? names.join(' and ') : 'No caregiver entries yet.';
    $('.recipient-block p').textContent = person.family + ' will see one update for ' + person.name.split(' ')[0] + '’s day.';
    function updateSend() {
      const ready = state.phase === 2 && (!missing.length || $('#mark-unrecorded').checked);
      $('#send-day').disabled = !ready;
      $('#review-hint').textContent = state.phase < 2 ? 'The last caregiver will review and send at the end of the day.' : missing.length && !$('#mark-unrecorded').checked ? 'Complete the missing answers or mark them not recorded.' : 'One update is ready for ' + person.family + '.';
    }
    $('#mark-unrecorded').addEventListener('change', updateSend);
    updateSend();
    $('#send-day').addEventListener('click', () => {
      if ($('#send-day').disabled) return;
      day().savedBy = [...new Set([...day().savedBy, state.activeCaregiver])];
      day().markedMissing = missing.map(item => item.id);
      day().sent = true;
      persist();
      location.href = url('family.html');
    });
  }
  if (document.body.dataset.page === 'review') renderReview();

  function renderFamily() {
    const person = resident();
    const first = person.name.split(' ')[0];
    $('#family-moment').after($('#family-changes-block'), $('#family-missing-block'));
    $('.family-main h1').innerHTML = 'A little window<br>into ' + esc(first) + '’s day.';
    $('.family-salutation').textContent = 'For ' + person.family + ', with care.';
    const recorded = items.filter(item => day().entries[item.id]);
    const differences = recorded.filter(changed);
    const missing = items.filter(item => !day().entries[item.id] && item.due <= state.phase);
    if (day().moment || day().photo) { $('#family-moment').hidden = false; $('#family-moment-text').textContent = day().moment ? '“' + day().moment + '”' : ''; $('#family-moment-text').hidden = !day().moment; $('#family-photo').hidden = !day().photo; if (day().photo) $('#family-photo').src = day().photo; }
    $('#family-intro').textContent = recorded.length ? first + ' had care and company from ' + [...new Set(recorded.map(item => caregiver(day().entries[item.id].by).first))].join(' and ') + ' today.' : 'Her care day is still being recorded.';
    const groups = [
      { label:'Meals', ids:['breakfast','lunch','dinner'] },
      { label:'Medication', ids:['am','pm'] },
      { label:'Personal care', ids:['shower','grooming'] },
      { label:'Mood and sleep', ids:['mood','sleep'] },
      { label:'Concerns', ids:['concerns'] }
    ];
    $('#family-highlights').innerHTML = groups.map(group => {
      const parts = group.ids.filter(id => day().entries[id]).map(id => itemById[id].title + ': ' + day().entries[id].value.toLowerCase());
      return parts.length ? '<div class="family-highlight"><strong>' + group.label + '</strong><span>' + esc(parts.join(' · ')) + '</span></div>' : '';
    }).join('');
    $('#family-changes-block').hidden = !differences.length;
    $('#family-changes').innerHTML = differences.map(item => {
      const record = day().entries[item.id];
      return '<p><strong>' + esc(item.title) + ':</strong> ' + esc(record.value) + '.' + (record.note ? ' ' + esc(record.note) : '') + '</p>';
    }).join('');
    $('#family-missing-block').hidden = !missing.length;
    $('#family-missing').textContent = missing.length ? missing.map(item => item.title).join(', ') + '. ' + (missing.length === 1 ? 'This item was' : 'These items were') + ' not recorded in today’s update.' : '';
    const names = [...new Set([...day().savedBy, ...recorded.map(item => day().entries[item.id].by), ...(day().momentBy ? [day().momentBy] : [])])].map(id => caregiver(id).name);
    $('#family-caregivers').textContent = names.join(' and ') || 'Margaret’s care team';
  }
  if (document.body.dataset.page === 'family') renderFamily();
})();
