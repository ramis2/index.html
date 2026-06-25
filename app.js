// ===== HOMEWORK APP =====
(function() {
  'use strict';

  const state = {
    tasks: [], currentSubject: 'math',
    timerRunning: false, timerSeconds: 25 * 60, timerInterval: null,
    usage: { date: '', ms: 0, activeMs: 0 },
    streak: 0,
    settings: { pin: '0000', timeLimit: 2, notifications: true },
    focusMode: { active: false, startTime: null },
    lastActivity: Date.now(), isIdle: false,
    trackingInterval: null, usageSaveInterval: null
  };

  const SUBJECT_ICONS = { math: '🔢', science: '🔬', english: '📖', history: '🏛️', other: '📌' };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const BLOCKED_DOMAINS = [
    'instagram.com', 'facebook.com', 'tiktok.com', 'twitter.com', 'x.com',
    'snapchat.com', 'youtube.com', 'youtu.be', 'discord.com', 'discord.gg',
    'reddit.com', 'pinterest.com', 'whatsapp.com', 'telegram.org',
    'twitch.tv', 'roblox.com'
  ];
  const $ = id => document.getElementById(id);

  // ===== INIT =====
  function init() {
    loadData();
    if (!checkTimeLimit()) return;
    renderDate(); renderStats(); renderTasks(); renderWeeklyChart();
    setupEvents(); setupInstall(); setupActivity(); startTracking(); setupFocusBlocker();
  }

  function loadData() {
    const saved = localStorage.getItem('homeworkData');
    if (saved) {
      const d = JSON.parse(saved);
      state.tasks = d.tasks || [];
      state.streak = d.streak || 0;
      state.settings = Object.assign({}, state.settings, d.settings || {});
    }
    const u = localStorage.getItem('homeworkUsage');
    if (u) state.usage = JSON.parse(u);
    const today = new Date().toDateString();
    if (state.usage.date !== today) {
      state.usage = { date: today, ms: 0, activeMs: 0 };
      saveUsage();
    }
    const f = localStorage.getItem('homeworkFocus');
    if (f) {
      state.focusMode = JSON.parse(f);
      if (state.focusMode.active) activateFocus(false);
    }
    checkStreak();
  }

  function saveData() {
    localStorage.setItem('homeworkData', JSON.stringify({
      tasks: state.tasks, streak: state.streak, settings: state.settings
    }));
  }
  function saveUsage() {
    localStorage.setItem('homeworkUsage', JSON.stringify(state.usage));
  }
  function saveFocus() {
    localStorage.setItem('homeworkFocus', JSON.stringify(state.focusMode));
  }

  // ===== ACTIVITY =====
  function setupActivity() {
    ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(e => {
      document.addEventListener(e, onActivity, { passive: true });
    });
    setInterval(checkIdle, 10000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onActivity();
      else state.isIdle = true;
    });
  }
  function onActivity() {
    state.lastActivity = Date.now();
    state.isIdle = false;
  }
  function checkIdle() {
    if (Date.now() - state.lastActivity > 60000) state.isIdle = true;
  }

  // ===== TIME LIMIT =====
  function checkTimeLimit() {
    const limit = state.settings.timeLimit * 3600000;
    if (state.usage.ms >= limit) {
      showLimit();
      return false;
    }
    return true;
  }
  function showLimit() {
    $('time-limit-screen').classList.remove('hidden');
    $('app').classList.add('hidden');
    $('add-task-bar').classList.add('hidden');
  }
  function hideLimit() {
    $('time-limit-screen').classList.add('hidden');
    $('app').classList.remove('hidden');
    $('add-task-bar').classList.remove('hidden');
  }

  function startTracking() {
    state.usageSaveInterval = setInterval(() => {
      if (!state.isIdle && document.visibilityState === 'visible') saveUsage();
    }, 30000);
    state.trackingInterval = setInterval(() => {
      const visible = document.visibilityState === 'visible';
      const limitHidden = $('time-limit-screen').classList.contains('hidden');
      const parentHidden = $('parent-dashboard').classList.contains('hidden');
      const lockHidden = $('lock-screen').classList.contains('hidden');
      const focusExitHidden = $('focus-exit-lock').classList.contains('hidden');

      if (visible && !state.isIdle && limitHidden && parentHidden && lockHidden && focusExitHidden) {
        state.usage.ms += 1000;
        state.usage.activeMs += 1000;
        updateTimeDisplay();
        const limit = state.settings.timeLimit * 3600000;
        if (state.usage.ms >= limit) { saveUsage(); showLimit(); }
      }
    }, 1000);
  }

  function updateTimeDisplay() {
    const h = Math.floor(state.usage.ms / 3600000);
    const m = Math.floor((state.usage.ms % 3600000) / 60000);
    const txt = h + 'h ' + m + 'm';
    $('time-used').textContent = txt;
    const ptu = $('parent-time-used');
    if (ptu) ptu.textContent = txt;
  }

  // ===== STREAK =====
  function checkStreak() {
    const today = new Date().toDateString();
    const dates = [...new Set(
      state.tasks.filter(t => t.done && t.completedAt)
        .map(t => new Date(t.completedAt).toDateString())
    )].sort();
    if (dates.includes(today)) {
      let streak = 1, d = new Date();
      d.setDate(d.getDate() - 1);
      while (dates.includes(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
      state.streak = streak;
    } else if (dates.length > 0) {
      const last = new Date(dates[dates.length - 1]);
      const yest = new Date(); yest.setDate(yest.getDate() - 1);
      if (last.toDateString() !== yest.toDateString() && last.toDateString() !== today) {
        state.streak = 0;
      }
    }
    saveData();
  }

  // ===== FOCUS MODE BLOCKER =====
  function setupFocusBlocker() {
    // Block link clicks
    document.addEventListener('click', function(e) {
      const a = e.target.closest('a');
      if (a && a.href) {
        const url = a.href.toLowerCase();
        const blocked = BLOCKED_DOMAINS.some(d => url.includes(d));
        const external = !url.includes(window.location.hostname);
        if (blocked || (state.focusMode.active && external)) {
          e.preventDefault(); e.stopPropagation();
          notify(blocked ? '🚫 Social media blocked!' : '🔗 External links blocked in Focus Mode!');
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          return false;
        }
      }
    }, true);

    // Block form submissions
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.action && !form.action.includes(window.location.hostname)) {
        e.preventDefault(); notify('🔗 External links blocked!');
      }
    }, true);

    // Block window.open
    const origOpen = window.open;
    window.open = function(url, target, features) {
      if (url) {
        const u = url.toLowerCase();
        const blocked = BLOCKED_DOMAINS.some(d => u.includes(d));
        const external = !u.includes(window.location.hostname);
        if (blocked || (state.focusMode.active && external)) {
          notify(blocked ? '🚫 Social media blocked!' : '🔗 External links blocked!');
          return null;
        }
      }
      return origOpen.apply(window, arguments);
    };

    // Warn before leaving
    window.addEventListener('beforeunload', function(e) {
      if (state.focusMode.active) {
        e.preventDefault();
        e.returnValue = 'Focus Mode is ON. Leave?';
        return e.returnValue;
      }
    });
  }

  function toggleFocus() {
    if (state.focusMode.active) showFocusExit();
    else activateFocus(true);
  }

  function activateFocus(startTimer) {
    state.focusMode.active = true;
    if (startTimer) state.focusMode.startTime = Date.now();
    saveFocus();
    document.body.classList.add('focus-mode-active');
    const btn = $('focus-toggle');
    if (btn) { btn.textContent = '🔒 Focus ON'; btn.classList.add('active'); }
    const banner = $('focus-banner');
    if (banner) banner.classList.remove('hidden');
    notify('🔒 Focus Mode ON! Social media blocked.');
  }

  function deactivateFocus() {
    state.focusMode.active = false;
    state.focusMode.startTime = null;
    saveFocus();
    document.body.classList.remove('focus-mode-active');
    const btn = $('focus-toggle');
    if (btn) { btn.textContent = '🔓 Focus'; btn.classList.remove('active'); }
    const banner = $('focus-banner');
    if (banner) banner.classList.add('hidden');
    notify('🔓 Focus Mode OFF');
  }

  function showFocusExit() {
    $('focus-exit-lock').classList.remove('hidden');
    $('focus-exit-pin').value = '';
    setTimeout(() => $('focus-exit-pin').focus(), 100);
  }
  function hideFocusExit() {
    $('focus-exit-lock').classList.add('hidden');
  }
  function confirmFocusExit() {
    const pin = $('focus-exit-pin').value;
    if (pin === state.settings.pin) {
      hideFocusExit(); deactivateFocus();
    } else {
      notify('Wrong PIN!');
      $('focus-exit-pin').value = '';
      setTimeout(() => $('focus-exit-pin').focus(), 100);
    }
  }

  // ===== RENDER =====
  function renderDate() {
    const opts = { weekday: 'long', month: 'short', day: 'numeric' };
    $('date-display').textContent = new Date().toLocaleDateString('en-US', opts);
  }
  function renderStats() {
    $('completed-count').textContent = state.tasks.filter(t => t.done).length;
    $('pending-count').textContent = state.tasks.filter(t => !t.done).length;
    $('streak-count').textContent = '🔥 ' + state.streak;
    updateTimeDisplay();
  }
  function renderTasks() {
    const list = $('task-list');
    const items = state.tasks
      .filter(t => t.subject === state.currentSubject)
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.due && b.due) return new Date(a.due) - new Date(b.due);
        return b.id - a.id;
      });

    if (items.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>No homework in ' + state.currentSubject + '!</p><p class="empty-hint">Add your first task below</p></div>';
      return;
    }

    list.innerHTML = items.map(t => {
      const due = t.due ? fmtDue(t.due) : '';
      const urg = t.due && !t.done && isUrgent(t.due);
      return '<div class="task ' + (t.done ? 'done' : '') + '" data-id="' + t.id + '">' +
        '<div class="task-checkbox ' + (t.done ? 'checked' : '') + '" onclick="app.toggleTask(' + t.id + ')"></div>' +
        '<div class="task-content"><div class="task-text">' + esc(t.text) + '</div>' +
        '<div class="task-meta">' +
        (due ? '<span class="task-due ' + (urg ? 'urgent' : '') + '">📅 ' + due + '</span>' : '') +
        '<span class="task-subject-tag">' + t.subject + '</span></div></div>' +
        '<button class="task-delete" onclick="app.deleteTask(' + t.id + ')">🗑️</button></div>';
    }).join('');
  }

  function fmtDue(s) {
    const due = new Date(s), today = new Date();
    today.setHours(0,0,0,0);
    due.setHours(0,0,0,0);
    const diff = Math.round((due - today) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return Math.abs(diff) + ' days ago';
    if (diff <= 7) return 'In ' + diff + ' days';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function isUrgent(s) {
    const due = new Date(s), today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.round((due - today) / 86400000);
    return diff <= 1 && diff >= 0;
  }
  function esc(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  // ===== TASKS =====
  function addTask() {
    const text = $('new-task-text').value.trim();
    if (!text) { notify('Please enter a task!'); return; }
    const due = $('new-task-due').value;
    state.tasks.push({
      id: Date.now(), text: text, subject: state.currentSubject,
      done: false, due: due || null,
      createdAt: new Date().toISOString(), completedAt: null
    });
    saveData();
    $('new-task-text').value = '';
    $('new-task-due').value = '';
    renderTasks(); renderStats();
    notify('Homework added! 📚');
  }
  function toggleTask(id) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    t.completedAt = t.done ? new Date().toISOString() : null;
    saveData(); checkStreak(); renderTasks(); renderStats();
    if (t.done) {
      notify('Great job! 🎉');
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }
  function deleteTask(id) {
    if (!confirm('Delete this homework?')) return;
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveData(); renderTasks(); renderStats();
    notify('Task deleted');
  }

  // ===== TIMER =====
  function toggleTimer() {
    if (state.timerRunning) stopTimer(); else startTimer();
  }
  function startTimer() {
    state.timerRunning = true;
    $('timer').classList.add('running');
    state.timerInterval = setInterval(() => {
      state.timerSeconds--;
      updateTimerUI();
      if (state.timerSeconds <= 0) {
        stopTimer();
        notify('Focus time done! Take a break ☕');
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
  }
  function stopTimer() {
    state.timerRunning = false;
    clearInterval(state.timerInterval);
    $('timer').classList.remove('running');
    state.timerSeconds = 1500;
    updateTimerUI();
  }
  function updateTimerUI() {
    const m = Math.floor(state.timerSeconds / 60);
    const s = state.timerSeconds % 60;
    $('timer').textContent = '⏱️ ' + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ===== SUBJECTS =====
  function switchSubject(subj) {
    state.currentSubject = subj;
    document.querySelectorAll('.subject-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.subject === subj);
    });
    renderTasks();
  }

  // ===== PARENT =====
  function showParentLock() {
    $('lock-screen').classList.remove('hidden');
    $('parent-pin').value = '';
    setTimeout(() => $('parent-pin').focus(), 100);
  }
  function hideParentLock() {
    $('lock-screen').classList.add('hidden');
  }
  function unlockParent() {
    const pin = $('parent-pin').value;
    if (pin === state.settings.pin) {
      hideParentLock();
      if (window._override) {
        hideLimit(); window._override = false;
        state.settings.timeLimit += 0.5;
        saveData();
        notify('30 min extension added!');
      } else {
        showParentDash();
      }
    } else {
      notify('Wrong PIN!');
      $('parent-pin').value = '';
      setTimeout(() => $('parent-pin').focus(), 100);
    }
  }
  function showParentDash() {
    $('parent-dashboard').classList.remove('hidden');
    $('time-limit').value = state.settings.timeLimit;
    renderParentTasks(); renderWeeklyChart();
  }
  function hideParentDash() {
    $('parent-dashboard').classList.add('hidden');
  }
  function saveParentSettings() {
    state.settings.timeLimit = parseFloat($('time-limit').value) || 2;
    saveData();
    notify('Settings saved!');
  }
  function renderParentTasks() {
    const done = state.tasks.filter(t => t.done)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0, 20);
    const c = $('parent-task-list');
    if (done.length === 0) {
      c.innerHTML = '<p style="color:#999;text-align:center">No completed tasks yet</p>';
      return;
    }
    c.innerHTML = done.map(t =>
      '<div class="parent-task-item"><span>' + esc(t.text) + '</span>' +
      '<span class="pt-subject">' + SUBJECT_ICONS[t.subject] + ' ' + t.subject + '</span></div>'
    ).join('');
  }
  function renderWeeklyChart() {
    const c = $('weekly-chart');
    if (!c) return;
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const count = state.tasks.filter(t =>
        t.done && t.completedAt && new Date(t.completedAt).toDateString() === ds
      ).length;
      data.push({ day: DAYS[d.getDay()], count: count });
    }
    const max = Math.max(...data.map(d => d.count), 1);
    c.innerHTML = data.map(d => {
      const h = Math.max((d.count / max) * 100, 4);
      return '<div class="chart-bar ' + (d.count > 0 ? 'filled' : '') + '" style="height:' + h + '%">' +
        '<span class="chart-bar-value">' + d.count + '</span>' +
        '<span class="chart-bar-label">' + d.day + '</span></div>';
    }).join('');
  }
  function changePin() {
    const pin = $('new-pin').value;
    if (!/^\d{4}$/.test(pin)) { notify('PIN must be 4 digits'); return; }
    state.settings.pin = pin;
    saveData();
    $('new-pin').value = '';
    notify('PIN changed!');
  }
  function resetAll() {
    if (!confirm('Delete ALL homework forever?')) return;
    if (!confirm('Really sure? Cannot undo!')) return;
    state.tasks = []; state.streak = 0;
    state.usage = { date: new Date().toDateString(), ms: 0, activeMs: 0 };
    state.focusMode = { active: false, startTime: null };
    saveData(); saveUsage(); saveFocus();
    renderTasks(); renderStats(); renderParentTasks(); renderWeeklyChart();
    hideParentDash(); deactivateFocus();
    notify('All data cleared');
  }

  // ===== INSTALL =====
  function setupInstall() {
    let dp;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); dp = e;
      const b = $('install-banner');
      if (b && $('time-limit-screen').classList.contains('hidden')) b.classList.remove('hidden');
    });
    const ib = $('install-btn');
    if (ib) {
      ib.addEventListener('click', async () => {
        if (!dp) return;
        dp.prompt();
        const { outcome } = await dp.userChoice;
        if (outcome === 'accepted') {
          const b = $('install-banner');
          if (b) b.classList.add('hidden');
        }
        dp = null;
      });
    }
    const db = $('dismiss-install');
    if (db) db.addEventListener('click', () => {
      const b = $('install-banner');
      if (b) b.classList.add('hidden');
    });
    if (window.matchMedia('(display-mode: standalone)').matches) {
      const b = $('install-banner');
      if (b) b.classList.add('hidden');
    }
  }

  // ===== NOTIFY =====
  function notify(msg) {
    const n = $('notification');
    n.textContent = msg;
    n.classList.remove('hidden');
    n.classList.add('show');
    setTimeout(() => {
      n.classList.remove('show');
      setTimeout(() => n.classList.add('hidden'), 300);
    }, 2500);
  }

  // ===== EVENTS =====
  function setupEvents() {
    $('add-btn').addEventListener('click', addTask);
    $('new-task-text').addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
    document.querySelectorAll('.subject-btn').forEach(b => {
      b.addEventListener('click', () => switchSubject(b.dataset.subject));
    });
    $('timer').addEventListener('click', toggleTimer);
    $('parent-toggle').addEventListener('click', showParentLock);
    $('unlock-btn').addEventListener('click', unlockParent);
    $('back-to-app').addEventListener('click', hideParentLock);
    $('parent-pin').addEventListener('keypress', e => { if (e.key === 'Enter') unlockParent(); });
    $('close-parent').addEventListener('click', hideParentDash);
    $('time-limit').addEventListener('change', saveParentSettings);
    $('save-pin').addEventListener('click', changePin);
    $('new-pin').addEventListener('keypress', e => { if (e.key === 'Enter') changePin(); });
    $('reset-data').addEventListener('click', resetAll);
    $('override-limit').addEventListener('click', () => { showParentLock(); window._override = true; });
    const fb = $('focus-toggle');
    if (fb) fb.addEventListener('click', toggleFocus);
    const fe = $('focus-exit-confirm');
    if (fe) fe.addEventListener('click', confirmFocusExit);
    const fc = $('focus-exit-cancel');
    if (fc) fc.addEventListener('click', hideFocusExit);
    const fp = $('focus-exit-pin');
    if (fp) fp.addEventListener('keypress', e => { if (e.key === 'Enter') confirmFocusExit(); });
  }

  window.app = { toggleTask: toggleTask, deleteTask: deleteTask };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
