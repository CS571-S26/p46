# Copilot Instructions

## Project Overview

This is a **fantasy football analyzer** for the 2025 NFL season. Users build a virtual fantasy roster by:
1. Defining their team's roster format (number of QBs, RBs, WRs, TEs, FLEX spots, etc.)
2. Searching for and selecting NFL players to fill each slot
3. Viewing a breakdown of each player's **projected vs. actual stats** for the season

The app then produces an overall **team grade** — a score color-coded from dark red (well below expectations) to bright green (well above expectations) — representing how much their chosen roster over- or under-performed projections.

## Tech Stack

- **React 19** with JSX (`.jsx` files throughout)
- **Vite** — dev server and build tool
- **React Router DOM v7** — client-side routing via `HashRouter` (required for GitHub Pages)
- **React Bootstrap v2** + **Bootstrap 5** — UI components and utility classes
- **No TypeScript** — plain JavaScript only

## Commands

```bash
npm run dev      # Start dev server (localhost)
npm run build    # Build to docs/ for GitHub Pages deployment
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Project Structure

```
src/
  main.jsx          # Entry point — mounts app inside HashRouter
  App.jsx           # Route definitions (nested under Layout)
  App.css / index.css
  components/
    Layout.jsx      # Shared shell with nav; uses <Outlet /> for page content
  pages/
    HomePage.jsx
    AboutPage.jsx
    NotFoundPage.jsx
```

- **Pages** go in `src/pages/`, one component per file, default export.
- **Shared UI** goes in `src/components/`.
- All new routes are registered in `src/App.jsx` as children of the `<Layout>` route.

## Routing Conventions

- Uses `HashRouter` — links use `#` hashes (e.g. `/#/about`). Do **not** switch to `BrowserRouter`.
- Navigation links use `<Link>` from `react-router-dom`, not `<a>` tags.
- The `<Layout>` component wraps all pages via React Router's nested route + `<Outlet />` pattern.

## Styling Conventions

- Prefer **Bootstrap utility classes** (e.g. `d-flex`, `m-3`, `text-center`) over custom CSS.
- Use **React Bootstrap components** (`Button`, `Card`, `Container`, `Row`, `Col`, etc.) instead of plain HTML where a Bootstrap component exists.
- Bootstrap CSS is imported globally in `main.jsx` — do not re-import it in individual components.
- Custom styles go in `App.css` or `index.css`.

## Deployment

- Builds output to `docs/` (for GitHub Pages).
- Vite base path is set to `/p46/` in `vite.config.js` — do not change this.
- `HashRouter` ensures deep links work without server configuration.

## Key Constraints

- **Client-side only** — no Node.js/Express backend, no database, no server calls.
- No TypeScript — keep all files as `.jsx` / `.js`.
- Do not add unnecessary dependencies; the stack (React, React Bootstrap, React Router) covers all UI needs.

### Data Source
- **SportsDataIO Football API** — 2025 NFL season player stats and projections

### Key Interactive Features
- Roster format builder (configure position slots)
- Player search + assignment to roster slots
- Per-player projected vs. actual stat comparison
- Aggregate team grade visualization (color-coded score)

## API Shape (SportsDataIO)

Both the **Player Season Stats** and **Projected Player Season Stats** endpoints return an array of objects with identical field names. Actual and projected values are compared field-for-field.

**Identity fields** (both endpoints):
- `PlayerID`, `Name`, `Position`, `FantasyPosition`, `Team`, `TeamID`, `Season`

**Key stat fields by position** (zero-valued fields are omitted in display):

| Category | Fields |
|---|---|
| Passing (QB) | `PassingAttempts`, `PassingCompletions`, `PassingYards`, `PassingTouchdowns`, `PassingInterceptions`, `PassingRating`, `PassingSacks` |
| Rushing | `RushingAttempts`, `RushingYards`, `RushingTouchdowns` |
| Receiving | `ReceivingTargets`, `Receptions`, `ReceivingYards`, `ReceivingTouchdowns` |
| Misc | `Fumbles`, `FumblesLost`, `TwoPointConversionPasses`, `TwoPointConversionRuns`, `TwoPointConversionReceptions` |
| Fantasy scores | `FantasyPoints` (standard), `FantasyPointsPPR`, `FantasyPointsFanDuel`, `FantasyPointsDraftKings` |

**Notes:**
- Fields irrelevant to a player's position will be `0.00` — filter these out before displaying stats.
- `FantasyPoints` is the primary field for grade calculation (standard scoring).
- Full sample responses are in `api-samples/player-season-stats.json` and `api-samples/player-projections.json`.
