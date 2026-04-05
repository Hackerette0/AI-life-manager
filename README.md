<p align="center">
  <img src="public/Leplan-gif.gif" alt="le plan demo" width="600" />
</p>

> AI-powered life management — plan your day around how you actually feel.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)
![Claude AI](https://img.shields.io/badge/Claude-Opus_4.6-D97706?style=flat-square)

---

## Overview

**le plan** is a personal productivity app that combines energy-aware AI scheduling with habit tracking, deep focus sessions, drag-and-drop calendar planning, and third-party integrations — all in one dark, minimal interface.

Instead of treating every task equally, le plan factors in your current energy level, sleep, and mood before generating a daily schedule. The result is a plan built around how you actually feel, not just what's on your list.

---

## Features

### Vibe
Check in with your energy level, sleep hours, and mood each morning. This context feeds directly into the AI planner.

### Plan
A drag-and-drop time grid (6am–11pm). Create reminders with priority levels and drop them onto time slots. The AI-generated schedule populates the same grid — everything in one view.

### Focus
Pomodoro and deep work timer with session tracking. Includes a Deep Work Index calculated from your daily focus minutes. Tasks can be linked to sessions.

### Habits
Streak-based habit tracker with daily, weekday, and weekend frequency options. Logs completion history and surfaces your longest active streak.

### Notes
Color-coded notes with tags, priority, pinning, and full-text search. Designed for quick capture alongside your tasks.

### Connect
Integration hub for external data sources:
- **GitHub** — imports open issues as tasks
- **Notion** — imports database pages as tasks or notes
- **CSV / Excel** — uploads and parses task lists from spreadsheets
- **LinkedIn** — saves profile link for quick access
- **Google Calendar** — OAuth setup instructions included

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 |
| AI | Anthropic Claude Opus 4.6 via SSE streaming |
| State | React `useState` + `localStorage` (key: `sanctuary_v3`) |
| Deployment | Netlify + `@netlify/plugin-nextjs` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Local Development

```bash
# Clone the repository
git clone https://github.com/Hackerette0/1.-AI-life-manager.git
cd 1.-AI-life-manager

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Powers the AI day planner |

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── plan-day/          # SSE streaming endpoint — Claude day planner
│   │   └── integrations/
│   │       ├── github/        # GitHub Issues proxy
│   │       └── notion/        # Notion Database query proxy
│   ├── globals.css            # Design tokens + Tailwind base
│   ├── layout.tsx
│   └── page.tsx               # Root — tab routing + global state
├── components/
│   ├── DragCalendar.tsx       # Time grid with HTML5 drag-and-drop
│   ├── FocusTimer.tsx         # Pomodoro / deep work timer
│   ├── HabitsTracker.tsx      # Streak tracker
│   ├── NotesPanel.tsx         # Notes with tags + search
│   ├── IntegrationsHub.tsx    # External data connectors
│   ├── EnergyCheckIn.tsx      # Morning check-in form
│   ├── TaskManager.tsx        # Task CRUD
│   └── WellnessReminders.tsx  # Wellness nudges
└── lib/
    ├── types.ts               # All shared TypeScript interfaces
    └── storage.ts             # localStorage helpers + daily reset logic
```

---

## Deployment

The project deploys to Netlify automatically on push to `main`.

```bash
# Push changes
git add .
git commit -m "your message"
git push
```

Netlify picks up the build config from `netlify.toml`. Add `ANTHROPIC_API_KEY` under **Project configuration → Environment variables** in the Netlify dashboard before the first deploy.

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `primary` | `#930500` | Brand red |
| `primary-fixed` | `#ff5252` | Accent / active states |
| `secondary` | `#95BBEA` | Focus / info elements |
| `tertiary` | `#FFF8E7` | Habits / warm tones |
| `background` | `#121212` | App background |

---

## License

MIT
