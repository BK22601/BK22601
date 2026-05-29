# HeartTrack ❤

A lightweight, dependency-free web app for tracking your heart rate over time.

## Features

- **Tap-to-measure pulse** — tap a button in rhythm with your pulse and HeartTrack calculates your BPM from the average interval between taps.
- **Manual logging** — record a reading with a context tag (resting, active, exercise, recovery, stressed) and an optional note.
- **At-a-glance stats** — latest, average, lowest, and highest readings.
- **Trend chart** — a canvas line chart of your most recent readings (no charting library required).
- **History** — a scrollable list of every reading with per-entry delete and a clear-all option.
- **Offline & private** — everything is stored in your browser's `localStorage`. No backend, no accounts, no network calls.

## Usage

Just open `index.html` in any modern browser:

```bash
# from the project directory
open index.html        # macOS
xdg-open index.html    # Linux

# or serve it locally
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup and layout |
| `styles.css` | Styling (dark theme, responsive) |
| `app.js` | App logic: storage, stats, chart, tap-to-measure |

## Note

HeartTrack is a personal tracking tool, **not a medical device**. Don't use it
for diagnosis or treatment decisions. Consult a healthcare professional for
medical advice.
