/* Shared local prototype record. All screens and screenshot scenarios use this model. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const embedded = params.has('embed');
  const storageKey = 'dailycare-shared-day-v1';
  const people = { anna: { name: 'Anna Lewis', first: 'Anna', initials: 'AL', shift: 'Morning shift' }, jane: { name: 'Jane Doe', first: 'Jane', initials: 'JD', shift: 'Final shift' } };
  const labels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', am: 'AM medication', pm: 'PM medication', shower: 'Shower', grooming: 'Grooming', mood: 'Mood', sleep: 'Sleep', concerns: 'Concerns' };
  const keys = Object.keys(labels);
  const concernKeys = ['appetite', 'wandering', 'sundowning', 'fall', 'pain', 'skin', 'other'];
  const concernNames = { appetite: 'Appetite', wandering: 'Wandering', sundowning: 'Sundowning', fall: 'Fall or near-fall', pain: 'Pain', skin: 'Skin concern', other: 'Other' };
  const fresh = (date = '2026-09-13') => ({ date, caregiver: 'anna', phase: 'morning', care: { breakfast: null, lunch: null, dinner: null, am: null, pm: null }, personal: { shower: '', grooming: '' }, mealDetails: {}, medicationDetails: {}, mood: '', sleep: '', concernsChecked: false, changes: {}, note: '', photo: '', by: {}, saved: {}, sent: null });
  const value = (s, key) => key in s.care ? s.care[key] : key in s.personal ? s.personal[key] : key === 'concerns' ? (s.concernsChecked ? 'recorded' : '') : s[key];
  const recorded = (s, key) => value(s, key) !== null && value(s, key) !== '' && value(s, key) !== undefined;
  function normalize(s) { const base = fresh(); return { ...base, ...s, caregiver: people[s?.caregiver] ? s.caregiver : 'anna', care: { ...base.care, ...s?.care }, personal: { ...base.personal, ...s?.personal }, changes: s?.changes || {}, mealDetails: s?.mealDetails || {}, medicationDetails: s?.medicationDetails || {}, by: s?.by || {}, saved: s?.saved || {} }; }
  function example(stage) {
    const s = fresh();
    s.care.breakfast = true; s.by.breakfast = 'anna';
    if (stage === 'morning') return s;
    Object.assign(s.care, { lunch: true, am: 'given' });
    Object.assign(s.personal, { shower: 'Done', grooming: 'Done' });
    Object.assign(s, { mood: 'Calm', sleep: 'Restless', concernsChecked: true, note: 'After lunch, Margaret sat by the window and told Anna about the roses she used to grow.', phase: 'handover' });
    s.changes.sleep = { status: 'Restless', note: 'Woke twice overnight and settled after reassurance.' };
    keys.filter(key => recorded(s, key)).concat('note').forEach(key => { s.by[key] = 'anna'; });
    if (stage === 'anna-end') return s;
    s.saved.anna = true;
    if (stage === 'saved') return s;
    s.caregiver = 'jane'; s.phase = 'evening';
    if (stage === 'handover') return s;
    s.care.dinner = true; s.by.dinner = 'jane';
    if (!['gap', 'family-gap'].includes(stage)) { s.care.pm = 'given'; s.by.pm = 'jane'; }
    s.saved.jane = true;
    if (stage.startsWith('family')) s.sent = { recipients: ['Sophie', 'James'], gaps: stage === 'family-gap' ? ['pm'] : [] };
    return s;
  }
  let state = fresh();
  if (!embedded) try { const saved = JSON.parse(sessionStorage.getItem(storageKey)); if (saved?.care) state = normalize(saved); } catch { /* Local file previews can block storage. */ }
  if (params.has('stage') || params.has('sample')) state = example(params.get('stage') || 'final');
  if (location.hash.startsWith('#%7B')) try { const incoming = JSON.parse(decodeURIComponent(location.hash.slice(1))); if (incoming?.care) state = normalize({ ...incoming, photo: incoming.photo || state.photo }); history.replaceState(null, '', location.pathname + location.search); } catch { /* Ignore malformed links. */ }
  let previous = structuredClone(state);
  const fingerprint = (s, key) => JSON.stringify([value(s, key), key === 'concerns' ? concernKeys.map(k => s.changes[k]) : s.changes[key], s.mealDetails[key], s.medicationDetails[key], key === 'note' ? s.photo : null]);
  function persist() {
    [...keys, 'note'].forEach(key => {
      if (fingerprint(state, key) !== fingerprint(previous, key)) {
        if (recorded(state, key) || (key === 'note' && state.photo)) state.by[key] = state.caregiver;
        else delete state.by[key];
        state.saved[state.caregiver] = false; state.sent = null;
      }
    });
    previous = structuredClone(state);
    if (!embedded) try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { return false; }
    return true;
  }
  function later(key) { return !recorded(state, key) && (state.phase === 'morning' ? ['lunch', 'dinner', 'pm'].includes(key) : state.phase === 'handover' ? ['dinner', 'pm'].includes(key) : false); }
  function status(key) {
    if (!recorded(state, key)) return 'Not recorded';
    if (['breakfast', 'lunch', 'dinner'].includes(key)) return ({ None: 'Did not eat', 'A little': 'Ate a little', Half: 'Ate half', Most: 'Ate most' })[state.mealDetails[key]?.portion] || (state.care[key] ? 'Ate well' : 'Did not eat');
    if (['am', 'pm'].includes(key)) return state.care[key][0].toUpperCase() + state.care[key].slice(1);
    if (key === 'concerns') return concernKeys.filter(k => state.changes[k]).map(k => concernNames[k]).join(', ') || 'No concerns';
    return value(state, key);
  }
  function changes() {
    const result = [];
    ['breakfast', 'lunch', 'dinner'].forEach(key => { if (state.mealDetails[key]) result.push({ key, title: labels[key] + ' · ' + status(key).toLowerCase(), note: state.mealDetails[key].note || '' }); });
    ['am', 'pm'].forEach(key => { if (state.care[key] && state.care[key] !== 'given') result.push({ key, title: labels[key] + ' · ' + state.care[key], note: state.medicationDetails[key] || '' }); });
    ['shower', 'grooming'].forEach(key => { if (state.personal[key] && state.personal[key] !== 'Done') result.push({ key, title: labels[key] + ' · ' + status(key).toLowerCase(), note: state.changes[key]?.note || '' }); });
    if (state.mood && !['Calm', 'Cheerful'].includes(state.mood)) result.push({ key: 'mood', title: 'Mood · ' + state.mood.toLowerCase(), note: state.changes.mood?.note || '' });
    if (state.sleep && state.sleep !== 'As usual') result.push({ key: 'sleep', title: 'Sleep · ' + state.sleep.toLowerCase(), note: state.changes.sleep?.note || '' });
    concernKeys.forEach(key => { if (state.changes[key]) result.push({ key: 'concerns', title: concernNames[key] + (state.changes[key].status ? ' · ' + state.changes[key].status.toLowerCase() : ''), note: state.changes[key].note || '' }); });
    return result;
  }
  const list = items => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items);
  function caregivers() { return [...new Set(Object.values(state.by).filter(id => people[id]))].map(id => people[id].name); }
  function link(page, focus = '') {
    persist();
    const url = new URL(page, location.href);
    if (embedded) url.searchParams.set('embed', '1');
    if (focus) url.searchParams.set('focus', focus);
    url.hash = encodeURIComponent(JSON.stringify({ ...state, photo: '' }));
    return url.href;
  }
  window.DailyCare = { state, people, labels, keys, concernKeys, concernNames, embedded, params, fresh, recorded: key => recorded(state, key), later, status, changes, caregivers, list, persist, link, replace(next) { state = normalize(next); this.state = state; previous = structuredClone(state); persist(); } };
})();
