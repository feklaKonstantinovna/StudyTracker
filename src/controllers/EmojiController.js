import { EMOJIS } from '../data/emojis.js';

export function toggleEmojiPicker(fieldId) {
  const picker = document.getElementById('epicker-' + fieldId);
  const isShow = picker.classList.contains('show');
  document.querySelectorAll('.emoji-picker').forEach(p => p.classList.remove('show'));
  if (!isShow) { _buildReplace(fieldId); picker.classList.add('show'); }
}

export function toggleEmojiPickerInto(fieldId) {
  const picker = document.getElementById('epicker-' + fieldId);
  const isShow = picker.classList.contains('show');
  document.querySelectorAll('.emoji-picker').forEach(p => p.classList.remove('show'));
  if (!isShow) { _buildInsert(fieldId); picker.classList.add('show'); }
}

function _buildReplace(fieldId) {
  const cats = Object.keys(EMOJIS);
  const catsEl = document.getElementById('epcats-' + fieldId);
  const gridEl = document.getElementById('epgrid-' + fieldId);
  const activeCat = cats[0];
  catsEl.innerHTML = cats.map(c =>
    `<button class="ep-cat${c === activeCat ? ' active' : ''}" data-cat="${c}" onclick="window._renderEpCat('${fieldId}','${c}')">${c.split(' ')[0]}</button>`
  ).join('');
  gridEl.innerHTML = EMOJIS[activeCat].map(e =>
    `<button class="ep-btn" onclick="window._pickEmoji('${fieldId}','${e}')">${e}</button>`
  ).join('');
}

function _buildInsert(fieldId) {
  const cats = Object.keys(EMOJIS);
  const catsEl = document.getElementById('epcats-' + fieldId);
  const gridEl = document.getElementById('epgrid-' + fieldId);
  const activeCat = cats[0];
  catsEl.innerHTML = cats.map(c =>
    `<button class="ep-cat${c === activeCat ? ' active' : ''}" data-cat="${c}" onclick="window._renderEpCatInto('${fieldId}','${c}')">${c.split(' ')[0]}</button>`
  ).join('');
  gridEl.innerHTML = EMOJIS[activeCat].map(e =>
    `<button class="ep-btn" onclick="window._pickEmojiInto('${fieldId}','${e}')">${e}</button>`
  ).join('');
}

export function renderEpCat(fid, cat) {
  document.getElementById('epcats-' + fid)?.querySelectorAll('.ep-cat').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  const gridEl = document.getElementById('epgrid-' + fid);
  if (gridEl) gridEl.innerHTML = EMOJIS[cat].map(e => `<button class="ep-btn" onclick="window._pickEmoji('${fid}','${e}')">${e}</button>`).join('');
}

export function renderEpCatInto(fid, cat) {
  document.getElementById('epcats-' + fid)?.querySelectorAll('.ep-cat').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  const gridEl = document.getElementById('epgrid-' + fid);
  if (gridEl) gridEl.innerHTML = EMOJIS[cat].map(e => `<button class="ep-btn" onclick="window._pickEmojiInto('${fid}','${e}')">${e}</button>`).join('');
}

export function pickEmoji(fid, e) {
  const field = document.getElementById(fid);
  if (field) field.value = e;
  document.getElementById('epicker-' + fid)?.classList.remove('show');
}

export function pickEmojiInto(fid, e) {
  const field = document.getElementById(fid);
  if (!field) return;
  const start = field.selectionStart ?? field.value.length;
  const end   = field.selectionEnd   ?? field.value.length;
  field.value = field.value.slice(0, start) + e + field.value.slice(end);
  field.selectionStart = field.selectionEnd = start + e.length;
  document.getElementById('epicker-' + fid)?.classList.remove('show');
  field.focus();
}

export function closeAllEmoji() {
  document.addEventListener('click', e => {
    if (!e.target.closest('.emoji-picker') && !e.target.closest('[onclick*="toggleEmojiPicker"]'))
      document.querySelectorAll('.emoji-picker').forEach(p => p.classList.remove('show'));
  });
}
