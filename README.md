# Jetlag Billionaire

A Vite + React + Tailwind CSS idle clicker game about climate guilt, fictional celebrity-private-jet satire, and watching a single CO2 molecule snowball into absurd emissions.

The playable home page uses Phaser for the entire visible game cockpit: stats, emit/save/reset controls, scrollable command and shop panels, achievements, PR upgrades, and the carbon-cookie click target. React handles the navbar, sticky footer, about page, state bridge, save data, and overall site shell.

## Run Locally

```sh
make up
```

The dev server starts at <http://localhost:5173>. Stop it with:

```sh
make down
```

You can also run Vite directly:

```sh
npm install
npm run dev
```

## Test

```sh
make test
```

The unit tests cover the clicker economy, upgrades, idle production, formatting, and prestige reset logic.

## Deploy

```sh
make deploy
```

Deployment uses the `gh-pages` npm module and publishes the Vite `dist/` build to GitHub Pages.

## Files

- `src/App.jsx` - React page shell, navbar, home game UI, about page, and sticky footer.
- `src/components/GameCanvas.jsx` - React wrapper that mounts and destroys Phaser.
- `src/game/JetlagScene.js` - Phaser scene for the interactive carbon-cookie canvas and all visible game UI.
- `src/game/mechanics.js` - pure clicker economy, achievements, formatting, and progress calculations.
- `src/game/mechanics.test.js` - Vitest unit tests for the game logic.
- `src/index.css` - Tailwind import plus bounded game layout and scroll-panel styling.
- `vite.config.js` - Vite, React, Tailwind, Vitest, and GitHub Pages base configuration.
- `Makefile` - `make up`, `make down`, `make deploy`, and `make test`.
- `agents.md` - repository instructions for future Codex work.

## Satire and Sources

This is parody, not a live tracker. It does not use flight-tracking data, real-time personal-location data, or real-time claims about any real person. The in-game benchmark is fictionalized and intentionally labeled as such.

The premise is informed by public discussion around private aviation emissions and disputed celebrity-jet estimates. Two useful background references from the original brief:

- AP News on public criticism of celebrity private-jet emissions estimates, carbon-credit claims, and safety concerns around jet tracking: <https://apnews.com/article/taylor-swift-climate-jet-carbon-emissions-kelce-chiefs-02ac425d24281bd26d73bfdf4590bc82>
- Nature Communications Earth & Environment study estimating private aviation emissions: <https://www.nature.com/articles/s43247-024-01775-z>
