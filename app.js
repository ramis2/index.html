// ===== HOMEWORK APP - Complete JavaScript =====
// Built for kids, works offline, parental controls included

(function() {
    'use strict';

    // ===== STATE =====
    const state = {
        tasks: [],
        currentSubject: 'math',
        timerRunning: false,
        timerSeconds: 25 * 60,
        timerInterval: null,
        usage: { date: '', ms: 0 },
        streak: 0,
        settings: {
            pin: '0000',
            timeLimit: 2,
            notifications: true
        }
    };

    const SUBJECTS = ['math', 'science', 'english', 'history', 'other'];
    const SUBJECT_ICONS = { math: '🔢', science: '🔬', english: '📖', history: '🏛️', other: '📌' };
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // ===== DOM REFERENCES =====
    const $ = id => document.getElementById(id);

    // ===== INITIALIZATION =====
    function init() {
        loadData();
        checkTimeLimit();
        renderDate();
        renderStats();
        renderTasks();
        renderWeeklyChart();
        setupEventListeners();
        setupInstallPrompt();
        trackUsage();
    }

    // ===== DATA PERSISTENCE =====
    function loadData() {
        const saved = localStorage.getItem('homeworkData');
        if (saved) {
            const data = JSON.parse(saved);
            state.tasks = data.tasks || [];
            state.streak = data.streak || 0;
            state.settings = { ...state.settings, ...(data.settings || {}) };
        }

        const usageSaved = localStorage.getItem('homeworkUsage');
        if (usageSaved) {
            state.usage = JSON.parse(usageSaved);
        }

        const today = new Date().toDateString();
        if (state.usage.date !== today) {
            state.usage = { date: today, ms: 0 };
            saveUsage();
        }

        checkStreak();
    }

    function saveData() {
        localStorage.setItem('homeworkData', JSON.stringify({
            tasks: state.tasks,
            streak: state.streak,
            settings: state.settings
        }));
    }

    function saveUsage() {
        localStorage.setItem('homeworkUsage', JSON.stringify(state.usage));
    }

    // ===== TIME LIMIT =====
    function checkTimeLimit() {
        const limitMs = state.settings.timeLimit * 60 * 60 * 1000;
        if (state.usage.ms >= limitMs) {
            showTimeLimitScreen();
            return false;
        }
        return true;
    }

    function showTimeLimitScreen() {
        $('time-limit-screen').classList.remove('hidden');
        $('app').classList.add('hidden');
        $('add-task-bar').classList.add('hidden');
    }

    function hideTimeLimitScreen() {
        $('time-limit-screen').classList.add('hidden');
        $('app').classList.remove('hidden');
        $('add-task-bar').classList.remove('hidden');
    }

    function trackUsage() {
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                state.usage.ms += 1000;
                saveUsage();
                updateTimeDisplay();

                const limitMs = state.settings.timeLimit * 60 * 60 * 1000;
                if (state.usage.ms >= limitMs) {
                    const screenHidden = $('time-limit-screen').classList.contains('hidden');
                    if (screenHidden) {
                        showTimeLimitScreen();
                    }
                }
            }
        }, 1000);
    }

    function updateTimeDisplay() {
        const hours = Math.floor(state.usage.ms / 3600000);
        const mins = Math.floor((state.usage.ms % 3600000) / 60000);
        const text = hours + 'h ' + mins + 'm';
        $('time-used').textContent = text;
        const ptu = $('parent-time-used');
        if (ptu) ptu.textContent = text;
    }

    // ===== STREAK LOGIC =====
    function checkStreak() {
        const today = new Date().toDateString();
        const completedDates = [...new Set(
            state.tasks
                .filter(t => t.done && t.completedAt)
                .map(t => new Date(t.completedAt).toDateString())
        )].sort();

        if (completedDates.includes(today)) {
            let streak = 1;
            let checkDate = new Date();
            checkDate.setDate(checkDate.getDate() - 1);

            while (completedDates.includes(checkDate.toDateString())) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            state.streak = streak;
        } else if (completedDates.length > 0) {
            const lastCompleted = completedDates[completedDates.length - 1];
            const lastDate = new Date(lastCompleted);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate.toDateString() !== yesterday.toDateString() && 
                lastDate.toDateString() !== today) {
                state.streak = 0;
            }
        }

        saveData();
    }

    // ===== RENDERING =====
    function renderDate() {
        const now = new Date();
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        $('date-display').textContent = now.toLocaleDateString('en-US', options);
    }

    function renderStats() {
        const completed = state.tasks.filter(t => t.done).length;
        const pending = state.tasks.filter(t => !t.done).length;

        $('completed-count').textContent = completed;
        $('pending-count').textContent = pending;
        $('streak-count').textContent = '🔥 ' + state.streak;
        updateTimeDisplay();
    }

    function renderTasks() {
        const list = $('task-list');
        const subjectTasks = state.tasks
            .filter(t => t.subject === state.currentSubject)
            .sort((a, b) => {
                if (a.done !== b.done) return a.done ? 1 : -1;
                if (a.due && b.due) return new Date(a.due) - new Date(b.due);
                return b.id - a.id;
            });

        if (subjectTasks.length === 0) {
            list.innerHTML =
                '<div class="empty-state">' +
                '<div class="empty-icon">📝</div>' +
                '<p>No homework in ' + state.currentSubject + '!</p>' +
                '<p class="empty-hint">Add your first task below</p>' +
                '</div>';
            return;
        }

        list.innerHTML = subjectTasks.map(task => {
            const dueText = task.due ? formatDueDate(task.due) : '';
            const isUrgent = task.due && !task.done && isUrgentDate(task.due);

            return '<div class="task ' + (task.done ? 'done' : '') + '" data-id="' + task.id + '">' +
                '<div class="task-checkbox ' + (task.done ? 'checked' : '') + '" onclick="app.toggleTask(' + task.id + ')"></div>' +
                '<div class="task-content">' +
                    '<div class="task-text">' + escapeHtml(task.text) + '</div>' +
                    '<div class="task-meta">' +
                        (dueText ? '<span class="task-due ' + (isUrgent ? 'urgent' : '') + '">📅 ' + dueText + '</span>' : '') +
                        '<span class="task-subject-tag">' + task.subject + '</span>' +
                    '</div>' +
                '</div>' +
                '<button class="task-delete" onclick="app.deleteTask(' + task.id + ')">🗑️</button>' +
            '</div>';
        }).join('');
    }

    function formatDueDate(dueStr) {
        const due = new Date(dueStr);
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(due);
        dueDate.setHours(0,0,0,0);

        const diffDays = Math.round((dueDate - today) / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < 0) return Math.abs(diffDays) + ' days ago';
        if (diffDays <= 7) return 'In ' + diffDays + ' days';
        return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function isUrgentDate(dueStr) {
        const due = new Date(dueStr);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diff = Math.round((due - today) / 86400000);
        return diff <= 1 && diff >= 0;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== TASK OPERATIONS =====
    function addTask() {
        const text = $('new-task-text').value.trim();
        if (!text) {
            showNotification('Please enter a task!');
            return;
        }

        const due = $('new-task-due').value;

        const task = {
            id: Date.now(),
            text: text,
            subject: state.currentSubject,
            done: false,
            due: due || null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        state.tasks.push(task);
        saveData();

        $('new-task-text').value = '';
        $('new-task-due').value = '';

        renderTasks();
        renderStats();
        showNotification('Homework added! 📚');
    }

    function toggleTask(id) {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;

        task.done = !task.done;
        task.completedAt = task.done ? new Date().toISOString() : null;

        saveData();
        checkStreak();
        renderTasks();
        renderStats();

        if (task.done) {
            showNotification('Great job! 🎉 Task completed!');
            if (navigator.vibrate) navigator.vibrate(50);
        }
    }

    function deleteTask(id) {
        if (!confirm('Delete this homework?')) return;
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveData();
        renderTasks();
        renderStats();
        showNotification('Task deleted');
    }

    // ===== TIMER / POMODORO =====
    function toggleTimer() {
        if (state.timerRunning) {
            stopTimer();
        } else {
            startTimer();
        }
    }

    function startTimer() {
        state.timerRunning = true;
        $('timer').classList.add('running');

        state.timerInterval = setInterval(() => {
            state.timerSeconds--;
            updateTimerDisplay();

            if (state.timerSeconds <= 0) {
                stopTimer();
                showNotification('Focus time done! Take a break ☕');
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            }
        }, 1000);
    }

    function stopTimer() {
        state.timerRunning = false;
        clearInterval(state.timerInterval);
        $('timer').classList.remove('running');
        state.timerSeconds = 25 * 60;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const mins = Math.floor(state.timerSeconds / 60);
        const secs = state.timerSeconds % 60;
        $('timer').textContent = '⏱️ ' + mins + ':' + secs.toString().padStart(2, '0');
    }

    // ===== SUBJECT SWITCHING =====
    function switchSubject(subject) {
        state.currentSubject = subject;

        document.querySelectorAll('.subject-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subject === subject);
        });

        renderTasks();
    }

    // ===== PARENT DASHBOARD =====
    function showParentLock() {
        $('lock-screen').classList.remove('hidden');
        $('parent-pin').value = '';
        $('parent-pin').focus();
    }

    function hideParentLock() {
        $('lock-screen').classList.add('hidden');
    }

    function unlockParent() {
        const pin = $('parent-pin').value;
        if (pin === state.settings.pin) {
            hideParentLock();
            if (window._limitOverride) {
                hideTimeLimitScreen();
                window._limitOverride = false;
                state.settings.timeLimit += 0.5;
                saveData();
                showNotification('30 min extension added!');
            } else {
                showParentDashboard();
            }
        } else {
            showNotification('Wrong PIN! Try again.');
            $('parent-pin').value = '';
            $('parent-pin').focus();
        }
    }

    function showParentDashboard() {
        $('parent-dashboard').classList.remove('hidden');
        $('time-limit').value = state.settings.timeLimit;
        renderParentTaskList();
        renderWeeklyChart();
    }

    function hideParentDashboard() {
        $('parent-dashboard').classList.add('hidden');
    }

    function saveParentSettings() {
        state.settings.timeLimit = parseFloat($('time-limit').value) || 2;
        saveData();
        showNotification('Settings saved!');
    }

    function renderParentTaskList() {
        const completed = state.tasks
            .filter(t => t.done)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 20);

        const container = $('parent-task-list');
        if (completed.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No completed tasks yet</p>';
            return;
        }

        container.innerHTML = completed.map(t => 
            '<div class="parent-task-item">' +
                '<span>' + escapeHtml(t.text) + '</span>' +
                '<span class="pt-subject">' + SUBJECT_ICONS[t.subject] + ' ' + t.subject + '</span>' +
            '</div>'
        ).join('');
    }

    function renderWeeklyChart() {
        const container = $('weekly-chart');
        if (!container) return;

        const weekData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            const count = state.tasks.filter(t => 
                t.done && t.completedAt && 
                new Date(t.completedAt).toDateString() === dateStr
            ).length;
            weekData.push({ day: DAYS[d.getDay()], count: count });
        }

        const maxCount = Math.max(...weekData.map(d => d.count), 1);

        container.innerHTML = weekData.map(d => {
            const height = Math.max((d.count / maxCount) * 100, 4);
            return '<div class="chart-bar ' + (d.count > 0 ? 'filled' : '') + '" style="height: ' + height + '%">' +
                '<span class="chart-bar-value">' + d.count + '</span>' +
                '<span class="chart-bar-label">' + d.day + '</span>' +
            '</div>';
        }).join('');
    }

    function changePin() {
        const newPin = $('new-pin').value;
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            showNotification('PIN must be 4 digits');
            return;
        }
        state.settings.pin = newPin;
        saveData();
        $('new-pin').value = '';
        showNotification('PIN changed successfully!');
    }

    function resetAllData() {
        if (!confirm('WARNING: This will delete ALL homework forever! Are you sure?')) return;
        if (!confirm('Really sure? This cannot be undone!')) return;

        state.tasks = [];
        state.streak = 0;
        state.usage = { date: new Date().toDateString(), ms: 0 };
        saveData();
        saveUsage();

        renderTasks();
        renderStats();
        renderParentTaskList();
        renderWeeklyChart();
        hideParentDashboard();
        showNotification('All data cleared');
    }

    // ===== INSTALL PROMPT =====
    function setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            $('install-banner').classList.remove('hidden');
        });

        $('install-btn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    $('install-banner').classList.add('hidden');
                }
                deferredPrompt = null;
            }
        });

        $('dismiss-install').addEventListener('click', () => {
            $('install-banner').classList.add('hidden');
        });

        if (window.matchMedia('(display-mode: standalone)').matches) {
            $('install-banner').classList.add('hidden');
        }
    }

    // ===== NOTIFICATIONS =====
    function showNotification(msg) {
        const notif = $('notification');
        notif.textContent = msg;
        notif.classList.remove('hidden');
        notif.classList.add('show');

        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.classList.add('hidden'), 300);
        }, 2500);
    }

    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        $('add-btn').addEventListener('click', addTask);
        $('new-task-text').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        document.querySelectorAll('.subject-btn').forEach(btn => {
            btn.addEventListener('click', () => switchSubject(btn.dataset.subject));
        });

        $('timer').addEventListener('click', toggleTimer);

        $('parent-toggle').addEventListener('click', showParentLock);
        $('unlock-btn').addEventListener('click', unlockParent);
        $('back-to-app').addEventListener('click', hideParentLock);
        $('parent-pin').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') unlockParent();
        });
        $('close-parent').addEventListener('click', hideParentDashboard);

        $('time-limit').addEventListener('change', saveParentSettings);
        $('save-pin').addEventListener('click', changePin);
        $('new-pin').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') changePin();
        });
        $('reset-data').addEventListener('click', resetAllData);

        $('override-limit').addEventListener('click', () => {
            showParentLock();
            window._limitOverride = true;
        });
    }

    // ===== EXPOSE PUBLIC API =====
    window.app = {
        toggleTask: toggleTask,
        deleteTask: deleteTask
    };

    // ===== START =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
