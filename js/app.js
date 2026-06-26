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
  var chartType = 'bar';
  var editingDate = null;

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
      return '<div class="history-entry" data-date="' + key + '">' +
        '<div class="history-top">' +
          '<div class="history-info">' +
            '<span class="history-date">' + dateStr + '</span>' +
            '<span class="history-mood">' + mood.emoji + ' ' + mood.label + '</span>' +
          '</div>' +
          '<div class="history-actions">' +
            '<button class="action-btn edit-btn" data-date="' + key + '" title="Edit">&#9998;</button>' +
            '<button class="action-btn delete-btn" data-date="' + key + '" title="Delete">&#128465;</button>' +
          '</div>' +
        '</div>' +
        noteHtml +
        '</div>';
    }).join('');
  }

  // --- Render: Chart ---
  function setupCanvas() {
    var canvas = document.getElementById('moodChart');
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    return { canvas: canvas, ctx: ctx, w: rect.width, h: rect.height };
  }

  function drawGrid(ctx, w, h, pad, chartH) {
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
  }

  function drawXLabels(ctx, h, pad, daysInMonth, gap, barW, padLeft) {
    for (var day = 1; day <= daysInMonth; day++) {
      var showLabel = daysInMonth <= 15 || day % 2 === 1 || day === daysInMonth;
      if (showLabel) {
        var x = padLeft + (day - 1) * gap + gap / 2;
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(day), x, h - pad.bottom + 8);
      }
    }
  }

  function drawBarChart(ctx, data, w, h, pad, chartW, chartH, year, month, daysInMonth) {
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
    }

    drawXLabels(ctx, h, pad, daysInMonth, gap, barW, pad.left);
  }

  function drawLineChart(ctx, data, w, h, pad, chartW, chartH, year, month, daysInMonth) {
    var gap = chartW / daysInMonth;
    var points = [];

    for (var day = 1; day <= daysInMonth; day++) {
      var key = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var entry = data[key];
      var x = pad.left + (day - 1) * gap + gap / 2;

      if (entry) {
        var y = pad.top + chartH - (entry.mood / 5) * chartH;
        points.push({ x: x, y: y, mood: entry.mood, color: MOODS.find(function (m) { return m.value === entry.mood; }).color });
      }
    }

    if (points.length === 0) {
      drawXLabels(ctx, h, pad, daysInMonth, gap, 0, pad.left);
      return;
    }

    // Draw filled area under the line
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, pad.top + chartH);
      for (var i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
      ctx.closePath();
      var gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      gradient.addColorStop(0, 'rgba(92, 107, 192, 0.25)');
      gradient.addColorStop(1, 'rgba(92, 107, 192, 0.02)');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw line
    if (points.length > 1) {
      ctx.strokeStyle = '#5c6bc0';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    // Draw dots
    for (var i = 0; i < points.length; i++) {
      ctx.fillStyle = points[i].color;
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    drawXLabels(ctx, h, pad, daysInMonth, gap, 0, pad.left);
  }

  function renderChart() {
    var info = setupCanvas();
    var ctx = info.ctx;
    var data = loadData();

    var year = chartDate.getFullYear();
    var month = chartDate.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    document.getElementById('chartMonth').textContent = MONTH_NAMES[month] + ' ' + year;

    var pad = { top: 20, right: 16, bottom: 36, left: 32 };
    var chartW = info.w - pad.left - pad.right;
    var chartH = info.h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, info.w, info.h);
    drawGrid(ctx, info.w, info.h, pad, chartH);

    if (chartType === 'line') {
      drawLineChart(ctx, data, info.w, info.h, pad, chartW, chartH, year, month, daysInMonth);
    } else {
      drawBarChart(ctx, data, info.w, info.h, pad, chartW, chartH, year, month, daysInMonth);
    }
  }

  // --- Edit & Delete ---
  function startEdit(date) {
    var data = loadData();
    var entry = data[date];
    if (!entry) return;

    editingDate = date;
    selectedMood = entry.mood;
    document.getElementById('noteInput').value = entry.note || '';
    highlightMood(entry.mood);
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('saveBtn').textContent = 'Update';

    var d = new Date(date + 'T00:00:00');
    var dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    document.querySelector('.today-section h2').textContent = 'Editing: ' + dateStr;

    document.querySelector('.today-section').scrollIntoView({ behavior: 'smooth' });
  }

  function resetForm() {
    editingDate = null;
    selectedMood = null;
    document.getElementById('noteInput').value = '';
    document.getElementById('saveBtn').disabled = true;
    document.getElementById('saveBtn').textContent = 'Save';
    document.querySelector('.today-section h2').textContent = 'How are you feeling today?';
    highlightMood(null);
  }

  function deleteEntry(date) {
    var d = new Date(date + 'T00:00:00');
    var dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!confirm('Delete mood entry for ' + dateStr + '?')) return;

    var data = loadData();
    delete data[date];
    saveData(data);

    if (editingDate === date) resetForm();
    renderHistory();
    renderChart();
  }

  // --- Easter Egg: Flowers ---
  function triggerFlowers() {
    var overlay = document.getElementById('flowerOverlay');
    overlay.innerHTML = '';
    overlay.classList.add('active');
    document.body.classList.add('blurred');

    var flowers = ['🌸','🌹','🌺','🌻','🌷','💐','🌼','🪷','🏵️','🪻'];
    for (var i = 0; i < 60; i++) {
      var span = document.createElement('span');
      span.className = 'flower';
      span.textContent = flowers[Math.floor(Math.random() * flowers.length)];
      span.style.left = Math.random() * 100 + '%';
      span.style.animationDelay = Math.random() * 2 + 's';
      span.style.animationDuration = (2 + Math.random() * 3) + 's';
      span.style.fontSize = (24 + Math.random() * 32) + 'px';
      overlay.appendChild(span);
    }

    setTimeout(function () {
      overlay.classList.remove('active');
      document.body.classList.remove('blurred');
      overlay.innerHTML = '';
    }, 5000);
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
      var date = editingDate || todayKey();
      data[date] = {
        mood: selectedMood,
        note: document.getElementById('noteInput').value.trim()
      };
      saveData(data);
      editingDate = null;
      resetForm();
      renderHistory();
      renderChart();

      var btn = document.getElementById('saveBtn');
      btn.textContent = 'Saved!';
      setTimeout(function () { btn.textContent = 'Save'; }, 1500);
    });

    document.getElementById('historyList').addEventListener('click', function (e) {
      var editBtn = e.target.closest('.edit-btn');
      var deleteBtn = e.target.closest('.delete-btn');

      if (editBtn) {
        var date = editBtn.dataset.date;
        startEdit(date);
      }

      if (deleteBtn) {
        var date = deleteBtn.dataset.date;
        deleteEntry(date);
      }
    });

    document.getElementById('prevMonth').addEventListener('click', function () {
      chartDate.setMonth(chartDate.getMonth() - 1);
      renderChart();
    });

    document.getElementById('nextMonth').addEventListener('click', function () {
      chartDate.setMonth(chartDate.getMonth() + 1);
      renderChart();
    });

    document.querySelectorAll('.chart-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        chartType = btn.dataset.chart;
        document.querySelectorAll('.chart-type-btn').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        renderChart();
      });
    });

    document.getElementById('noteInput').addEventListener('input', function () {
      if (this.value.toLowerCase().indexOf('sharareh') !== -1) {
        triggerFlowers();
        this.value = '';
      }
    });

    window.addEventListener('resize', renderChart);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
