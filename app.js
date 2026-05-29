/* HeartTrack — a small heart rate tracker.
   Readings are stored in localStorage; no backend required. */

(function () {
  "use strict";

  const STORAGE_KEY = "hearttrack.readings.v1";
  const MAX_CHART_POINTS = 30;

  /* ---------- State ---------- */
  /** @type {{id:string, bpm:number, tag:string, note:string, ts:number}[]} */
  let readings = load();

  /* ---------- Elements ---------- */
  const el = {
    statLatest: document.getElementById("statLatest"),
    statAvg: document.getElementById("statAvg"),
    statMin: document.getElementById("statMin"),
    statMax: document.getElementById("statMax"),
    form: document.getElementById("logForm"),
    bpm: document.getElementById("bpm"),
    tag: document.getElementById("tag"),
    note: document.getElementById("note"),
    history: document.getElementById("history"),
    historyEmpty: document.getElementById("historyEmpty"),
    clearAll: document.getElementById("clearAll"),
    chart: document.getElementById("chart"),
    chartEmpty: document.getElementById("chartEmpty"),
    // measure
    tapButton: document.getElementById("tapButton"),
    tapText: document.getElementById("tapText"),
    tapBpm: document.getElementById("tapBpm"),
    tapCount: document.getElementById("tapCount"),
    useMeasured: document.getElementById("useMeasured"),
    resetMeasure: document.getElementById("resetMeasure"),
  };

  /* ---------- Storage ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Could not load readings:", e);
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
    } catch (e) {
      console.warn("Could not save readings:", e);
    }
  }

  /* ---------- Reading operations ---------- */
  function addReading(bpm, tag, note) {
    readings.push({
      id: String(Date.now()) + Math.random().toString(16).slice(2, 6),
      bpm: bpm,
      tag: tag,
      note: note || "",
      ts: Date.now(),
    });
    save();
    render();
  }

  function deleteReading(id) {
    readings = readings.filter((r) => r.id !== id);
    save();
    render();
  }

  /* ---------- Rendering ---------- */
  function render() {
    renderStats();
    renderHistory();
    renderChart();
  }

  function renderStats() {
    if (readings.length === 0) {
      el.statLatest.textContent = "—";
      el.statAvg.textContent = "—";
      el.statMin.textContent = "—";
      el.statMax.textContent = "—";
      return;
    }
    const sorted = [...readings].sort((a, b) => a.ts - b.ts);
    const values = readings.map((r) => r.bpm);
    const latest = sorted[sorted.length - 1].bpm;
    const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
    el.statLatest.textContent = latest;
    el.statAvg.textContent = avg;
    el.statMin.textContent = Math.min(...values);
    el.statMax.textContent = Math.max(...values);
  }

  function renderHistory() {
    el.history.innerHTML = "";
    const sorted = [...readings].sort((a, b) => b.ts - a.ts);
    el.historyEmpty.style.display = sorted.length ? "none" : "block";

    for (const r of sorted) {
      const li = document.createElement("li");
      li.className = "history-item";

      const bpm = document.createElement("div");
      bpm.className = "history-bpm";
      bpm.innerHTML = r.bpm + "<br><small>BPM</small>";

      const meta = document.createElement("div");
      meta.className = "history-meta";

      const tag = document.createElement("span");
      tag.className = "history-tag";
      tag.textContent = r.tag;
      meta.appendChild(tag);

      if (r.note) {
        const note = document.createElement("div");
        note.className = "history-note";
        note.textContent = r.note;
        meta.appendChild(note);
      }

      const time = document.createElement("div");
      time.className = "history-time";
      time.textContent = formatTime(r.ts);
      meta.appendChild(time);

      const del = document.createElement("button");
      del.className = "history-delete";
      del.type = "button";
      del.setAttribute("aria-label", "Delete reading");
      del.textContent = "✕";
      del.addEventListener("click", () => deleteReading(r.id));

      li.appendChild(bpm);
      li.appendChild(meta);
      li.appendChild(del);
      el.history.appendChild(li);
    }
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (sameDay) return "Today, " + time;
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + time;
  }

  /* ---------- Chart (canvas line chart, no dependencies) ---------- */
  function renderChart() {
    const canvas = el.chart;
    const points = [...readings]
      .sort((a, b) => a.ts - b.ts)
      .slice(-MAX_CHART_POINTS);

    el.chartEmpty.style.display = points.length ? "none" : "block";
    canvas.style.display = points.length ? "block" : "none";
    if (points.length === 0) return;

    // Handle high-DPI displays.
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || canvas.parentElement.clientWidth;
    const cssHeight = 220;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const padding = { top: 16, right: 14, bottom: 24, left: 34 };
    const w = cssWidth - padding.left - padding.right;
    const h = cssHeight - padding.top - padding.bottom;

    const values = points.map((p) => p.bpm);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) { min -= 5; max += 5; }
    const range = max - min;
    const pad = range * 0.15;
    min = Math.floor(min - pad);
    max = Math.ceil(max + pad);

    const x = (i) => padding.left + (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w);
    const y = (v) => padding.top + h - ((v - min) / (max - min)) * h;

    // Grid + y-axis labels
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.fillStyle = "#9aa3b2";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const val = min + ((max - min) / ticks) * i;
      const yy = y(val);
      ctx.beginPath();
      ctx.moveTo(padding.left, yy);
      ctx.lineTo(padding.left + w, yy);
      ctx.stroke();
      ctx.fillText(Math.round(val), padding.left - 6, yy);
    }

    // Area fill
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + h);
    grad.addColorStop(0, "rgba(225,29,72,0.35)");
    grad.addColorStop(1, "rgba(225,29,72,0)");
    ctx.beginPath();
    ctx.moveTo(x(0), y(values[0]));
    for (let i = 1; i < points.length; i++) ctx.lineTo(x(i), y(values[i]));
    ctx.lineTo(x(points.length - 1), padding.top + h);
    ctx.lineTo(x(0), padding.top + h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(x(0), y(values[0]));
    for (let i = 1; i < points.length; i++) ctx.lineTo(x(i), y(values[i]));
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Points
    ctx.fillStyle = "#e11d48";
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.arc(x(i), y(values[i]), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------- Tap-to-measure ---------- */
  const TAP_RESET_MS = 5000; // forget taps after a pause
  let tapTimes = [];
  let lastTapAt = 0;
  let measuredBpm = 0;

  function handleTap() {
    const now = performance.now();
    if (lastTapAt && now - lastTapAt > TAP_RESET_MS) {
      tapTimes = []; // long pause — start fresh
    }
    lastTapAt = now;
    tapTimes.push(now);

    // Animate
    el.tapButton.classList.remove("tapped");
    void el.tapButton.offsetWidth; // restart animation
    el.tapButton.classList.add("tapped");

    el.tapCount.textContent = tapTimes.length + (tapTimes.length === 1 ? " tap" : " taps");

    if (tapTimes.length < 2) {
      el.tapText.textContent = "Keep tapping…";
      return;
    }

    // Average interval between taps -> BPM.
    const intervals = [];
    for (let i = 1; i < tapTimes.length; i++) {
      intervals.push(tapTimes[i] - tapTimes[i - 1]);
    }
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    measuredBpm = Math.round(60000 / avgInterval);
    el.tapBpm.textContent = measuredBpm;
    el.tapText.textContent = "Measuring…";
    el.useMeasured.disabled = !(measuredBpm >= 20 && measuredBpm <= 300);
  }

  function resetMeasure() {
    tapTimes = [];
    lastTapAt = 0;
    measuredBpm = 0;
    el.tapBpm.textContent = "0";
    el.tapCount.textContent = "0 taps";
    el.tapText.textContent = "Tap to start";
    el.useMeasured.disabled = true;
  }

  /* ---------- Events ---------- */
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bpm = parseInt(el.bpm.value, 10);
    if (!Number.isFinite(bpm) || bpm < 20 || bpm > 300) {
      el.bpm.focus();
      return;
    }
    addReading(bpm, el.tag.value, el.note.value.trim());
    el.bpm.value = "";
    el.note.value = "";
    el.bpm.focus();
  });

  el.clearAll.addEventListener("click", () => {
    if (readings.length === 0) return;
    if (confirm("Delete all " + readings.length + " readings? This cannot be undone.")) {
      readings = [];
      save();
      render();
    }
  });

  el.tapButton.addEventListener("click", handleTap);
  el.resetMeasure.addEventListener("click", resetMeasure);
  el.useMeasured.addEventListener("click", () => {
    if (measuredBpm >= 20 && measuredBpm <= 300) {
      el.bpm.value = measuredBpm;
      el.tag.value = "resting";
      el.bpm.scrollIntoView({ behavior: "smooth", block: "center" });
      el.bpm.focus();
    }
  });

  // Re-render chart on resize (debounced).
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderChart, 150);
  });

  /* ---------- Init ---------- */
  render();
})();
