# Mood Tracker

A simple, offline-first mood tracker built with vanilla HTML, CSS, and JavaScript. Track your daily mood, add notes, view history, and see monthly trends.

**Live:** https://nimaanoosh-sudo.github.io/mood-tracker/

## Features

- **Daily mood logging** — Choose from 5 moods (Awful → Great) with optional notes
- **Past entries** — Scrollable history of all your mood entries
- **Monthly chart** — Bar chart showing mood trends with month navigation
- **Offline support** — Works without internet via service worker
- **PWA ready** — Install as an app on desktop or mobile
- **Local storage** — Data stays in your browser, no account needed

## Setup

```bash
# Clone
git clone https://github.com/nimaanoosh-sudo/mood-tracker.git
cd mood-tracker

# Edit SCSS (optional)
# Install sass globally or use npx
npx sass scss/style.scss css/style.css --style=compressed --no-source-map

# Open index.html in browser
```

## Project Structure

```
moodtracker/
├── index.html          # Main page
├── css/style.css       # Compiled CSS
├── js/app.js           # Application logic
├── scss/style.scss     # SCSS source
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
└── icons/
    ├── icon-192.png    # PWA icon
    └── icon-512.png    # PWA icon
```

## How It Works

1. Select a mood emoji and optionally write a note
2. Click **Save** — entry is stored in `localStorage`
3. View past entries in the history section
4. Navigate months in the chart to see mood trends

Data is stored as JSON in the browser's `localStorage` under the key `moodTracker`.

## Tech Stack

- HTML5
- SCSS (compiled to CSS)
- Vanilla JavaScript (no frameworks)
- Canvas API (chart rendering)
- localStorage (data persistence)
- Service Worker (offline caching)

## License

MIT
