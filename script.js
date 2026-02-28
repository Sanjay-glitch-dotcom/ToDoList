// ── Theme Toggle ──
function toggleTheme() {
  const isLight = document.getElementById('themeToggle').checked;
  document.documentElement.classList.toggle('light', isLight);
  document.getElementById('toggleLabel').textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// ── Splash Screen Dismiss ──
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
    document.querySelector('.card').classList.add('visible');
  }, 2800);
});

// ── localStorage Helpers ──
function saveData() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('history', JSON.stringify(history));
  localStorage.setItem('nextId', nextId);
}

function loadData() {
  try {
    tasks   = JSON.parse(localStorage.getItem('tasks'))   || [];
    history = JSON.parse(localStorage.getItem('history')) || [];
    history = history.map(h => ({ ...h, completedAt: new Date(h.completedAt) }));
    nextId  = parseInt(localStorage.getItem('nextId')) || 1;
  } catch(e) {
    tasks = []; history = []; nextId = 1;
  }
}

// ── Restore Theme on Load ──
(function() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light');
    document.getElementById('themeToggle').checked = true;
    document.getElementById('toggleLabel').textContent = '☀️';
  }
})();

// ── State ──
let filter = 'all';
let historyOpen = true;
let tasks = [];
let history = [];
let nextId = 1;

loadData();

// ── Input Listener ──
const input = document.getElementById('taskInput');
input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

// ── Task Functions ──
function addTask() {
  const text = input.value.trim();
  if (!text) return;
  tasks.push({ id: nextId++, text, done: false });
  input.value = '';
  saveData();
  render();
}

function toggle(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  if (!task.done) {
    history.unshift({ id: Date.now(), text: task.text, completedAt: new Date() });
  }
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveData();
  render();
  renderHistory();
}

function remove(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveData();
  render();
}

function clearDone() {
  tasks = tasks.filter(t => !t.done);
  saveData();
  render();
}

function setFilter(f, btn) {
  filter = f;
  document.querySelectorAll('.filter-tabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

// ── Edit Functions ──
function startEdit(id) {
  const item = document.getElementById('item-' + id);
  const task = tasks.find(t => t.id === id);
  item.innerHTML = `
    <button class="check-btn" onclick="toggle(${id})">${task.done ? '✓' : ''}</button>
    <input class="edit-input" id="edit-${id}" value="${escapeHtml(task.text)}" />
    <button class="edit-btn" style="opacity:1;color:var(--accent)" onclick="saveEdit(${id})" title="Save">✔</button>
    <button class="delete-btn" style="opacity:1" onclick="cancelEdit()" title="Cancel">✕</button>
  `;
  const inp = document.getElementById('edit-' + id);
  inp.focus();
  inp.select();
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveEdit(id);
    if (e.key === 'Escape') cancelEdit();
  });
}

function saveEdit(id) {
  const inp = document.getElementById('edit-' + id);
  const newText = inp.value.trim();
  if (newText) {
    tasks = tasks.map(t => t.id === id ? { ...t, text: newText } : t);
    saveData();
  }
  render();
}

function cancelEdit() {
  render();
}

// ── History Functions ──
function removeHistory(hid) {
  history = history.filter(h => h.id !== hid);
  saveData();
  renderHistory();
}

function clearHistory(e) {
  e.stopPropagation();
  history = [];
  saveData();
  renderHistory();
}

function toggleHistory() {
  historyOpen = !historyOpen;
  document.getElementById('historyList').classList.toggle('collapsed', !historyOpen);
  document.getElementById('historyIcon').classList.toggle('open', historyOpen);
}

function formatTime(date) {
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  return `${dateStr} • ${time}`;
}

// ── Render Functions ──
function render() {
  const list = document.getElementById('todoList');
  const remaining = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;

  document.getElementById('stats').textContent =
    `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
  document.getElementById('doneCount').textContent = `${done} completed`;

  const visible = tasks.filter(t =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done
  );

  if (visible.length === 0) {
    list.innerHTML = `<div class="empty"><span class="icon">✦</span>${
      filter === 'done' ? 'No completed tasks yet.' :
      filter === 'active' ? 'All caught up!' : 'Add your first task above.'
    }</div>`;
    return;
  }

  list.innerHTML = visible.map(t => `
    <li class="todo-item ${t.done ? 'done' : ''}" id="item-${t.id}">
      <button class="check-btn" onclick="toggle(${t.id})">${t.done ? '✓' : ''}</button>
      <span class="todo-text">${escapeHtml(t.text)}</span>
      <button class="edit-btn" onclick="startEdit(${t.id})" title="Edit">✎</button>
      <button class="delete-btn" onclick="remove(${t.id})" title="Delete">✕</button>
    </li>
  `).join('');
}

function renderHistory() {
  const list = document.getElementById('historyList');
  document.getElementById('historyCount').textContent = history.length;
  if (history.length === 0) {
    list.innerHTML = `<div class="history-empty">No completed tasks yet.</div>`;
    return;
  }
  list.innerHTML = history.map(h => `
    <li class="history-item">
      <div class="history-check">✓</div>
      <div class="history-info">
        <div class="history-text">${escapeHtml(h.text)}</div>
        <div class="history-time">${formatTime(h.completedAt)}</div>
      </div>
      <button class="history-remove" onclick="removeHistory(${h.id})" title="Remove">✕</button>
    </li>
  `).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Init ──
render();
renderHistory();