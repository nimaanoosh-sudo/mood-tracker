(function () {
  'use strict';

  var STORAGE_KEY = 'moodTracker';

  var MOODS = [
    { value: 1, emoji: '😩', label: 'Awful', color: '#e74c3c' },
    { value: 2, emoji: '😟', label: 'Bad', color: '#e67e22' },
    { value: 3, emoji: '😐', label: 'Okay', color: '#f1c40f' },
    { value: 4, emoji: '🙂', label: 'Good', color: '#2ecc71' },
    { value: 5, emoji: '😄', label: 'Great', color: '#27ae60' }
  ];

  var MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var selectedMood = null;
  var chartDate = new Date();

  function loadData() {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function dateKey(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Render: Current Date ---
  function renderCurrentDate() {
    var el = document.getElementById('currentDate');
    el.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // --- Render: Today's Entry ---
  function renderTodayEntry() {
    var data = loadData();
    var entry = data[todayKey()];

    if (entry) {
      selectedMood = entry.mood;
      document.getElementById('noteInput').value = entry.note || '';
      highlightMood(entry.mood);
      document.getElementById('saveBtn').disabled = false;
    }
  }

  function highlightMood(mood) {
    document.querySelectorAll('.mood-btn').forEach(function (btn) {
      btn.classList.toggle('selected', parseInt(btn.dataset.mood) === mood);
    });
  }

  // --- Render: History ---
  function renderHistory() {
    var data = loadData();
    var container = document.getElementById('historyList');
    var entries = Object.keys(data).sort().reverse();

    if (entries.length === 0) {
      container.innerHTML = '<p class="empty">No entries yet. Start tracking your mood!</p>';
      return;
    }

    container.innerHTML = entries.map(function (key) {
      var entry = data[key];
      var mood = MOODS.find(function (m) { return m.value === entry.mood; });
      var d = new Date(key + 'T00:00:00');
      var dateStr = d.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      });
      var noteHtml = entry.note
        ? '<p class="history-note">' + escapeHtml(entry.note) + '</p>'
        : '';
      return '<div class="history-entry">' +
        '<span class="history-date">' + dateStr + '</span>' +
        '<span class="history-mood">' + mood.emoji + ' ' + mood.label + '</span>' +
        noteHtml +
        '</div>';
    }).join('');
  }

  // --- Render: Chart ---
  function renderChart() {
    var canvas = document.getElementById('moodChart');
    var ctx = canvas.getContext('2d');
    var data = loadData();

    var year = chartDate.getFullYear();
    var month = chartDate.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    document.getElementById('chartMonth').textContent = MONTH_NAMES[month] + ' ' + year;

    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    var w = rect.width;
    var h = rect.height;
    var pad = { top: 20, right: 16, bottom: 36, left: 32 };
    var chartW = w - pad.left - pad.right;
    var chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    // Grid lines and Y labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var i = 1; i <= 5; i++) {
      var y = pad.top + chartH - (i / 5) * chartH;
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = '#aaa';
      ctx.font = '11px sans-serif';
      ctx.fillText(String(i), pad.left - 8, y);
    }

    // Bars
    var gap = chartW / daysInMonth;
    var barW = Math.min(gap * 0.65, 22);

    for (var day = 1; day <= daysInMonth; day++) {
      var key = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var entry = data[key];
      var x = pad.left + (day - 1) * gap + (gap - barW) / 2;

      if (entry) {
        var m = MOODS.find(function (m) { return m.value === entry.mood; });
        var barH = (entry.mood / 5) * chartH;
        var barY = pad.top + chartH - barH;

        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.moveTo(x + 3, barY);
        ctx.lineTo(x + barW - 3, barY);
        ctx.quadraticCurveTo(x + barW, barY, x + barW, barY + 3);
        ctx.lineTo(x + barW, pad.top + chartH);
        ctx.lineTo(x, pad.top + chartH);
        ctx.lineTo(x, barY + 3);
        ctx.quadraticCurveTo(x, barY, x + 3, barY);
        ctx.fill();
      } else {
        ctx.fillStyle = '#eee';
        ctx.fillRect(x, pad.top + chartH - 3, barW, 3);
      }

      // X labels
      var showLabel = daysInMonth <= 15 || day % 2 === 1 || day === daysInMonth;
      if (showLabel) {
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(day), x + barW / 2, h - pad.bottom + 8);
      }
    }
  }

  // --- Init ---
  function init() {
    renderCurrentDate();
    renderTodayEntry();
    renderHistory();
    renderChart();

    document.querySelectorAll('.mood-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedMood = parseInt(btn.dataset.mood);
        highlightMood(selectedMood);
        document.getElementById('saveBtn').disabled = false;
      });
    });

    document.getElementById('saveBtn').addEventListener('click', function () {
      if (!selectedMood) return;
      var data = loadData();
      data[todayKey()] = {
        mood: selectedMood,
        note: document.getElementById('noteInput').value.trim()
      };
      saveData(data);
      renderHistory();
      renderChart();

      var btn = document.getElementById('saveBtn');
      btn.textContent = 'Saved!';
      setTimeout(function () { btn.textContent = 'Save'; }, 1500);
    });

    document.getElementById('prevMonth').addEventListener('click', function () {
      chartDate.setMonth(chartDate.getMonth() - 1);
      renderChart();
    });

    document.getElementById('nextMonth').addEventListener('click', function () {
      chartDate.setMonth(chartDate.getMonth() + 1);
      renderChart();
    });

    window.addEventListener('resize', renderChart);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
