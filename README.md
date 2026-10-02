# Skygun

Little robots. Big shots. A small, original browser artillery game for two people sharing a device.

**Milestone 1:** a complete local duel on fixed terrain. Aim, read the wind, fire, and bring the other robot to zero health. Three solid hits usually win. Blast damage can hurt either player. Wind stays the same for both turns in a round.

Terrain destruction, computer play, sound, and publication are later milestones. See [the approved plan](PLAN.md). Nothing has been deployed.

## Run in Codex Cloud or locally

Use Node.js 22.12+ or Node.js 24 (validated with 24.19.0), with npm. In this Cloud environment, use the existing `/workspace/Skygun` checkout.

```sh
npm ci
npm run dev
```

The development server listens on port 5173 by default. Binding to `0.0.0.0` permits the development environment's supported access mechanism; it does not publish a public site.

```sh
npm run check       # TypeScript checks
npm test            # Deterministic simulation tests
npm run build       # Type checks and static dist/ build
npm run preview     # Locally serve the production build
```

## Controls

- Use the **angle** and **power** sliders or their minus/plus buttons, then press **Fire shot**.
- Focus the battlefield for arrow shortcuts: left/right change angle, up/down change power, and Space fires. Sliders also support their standard keyboard controls.
- Share the device when the other player's turn begins. Each player keeps their own aim settings. A small cross marks their previous impact.
- The **?** button explains the rules. **Pause** and backgrounding stop the match until you resume.
- Rotation/resizing preserves the match. Reloading or browser tab eviction does not.

Landscape desktop/iPad layouts are primary; portrait and phones remain usable. No fullscreen, account, audio permissions, or external service is needed for this milestone. All artwork is drawn from original geometric shapes; there are no downloaded fonts or game assets.

## Browser tests

```sh
npm run test:browsers
npm run test:e2e
```

Browser binaries are installed alongside Playwright inside `node_modules`, so run the browser-install command again after a clean `npm ci`. Linux hosts may also need Playwright's documented OS dependencies.

The projects are desktop Chromium, desktop WebKit, iPad-layout WebKit, and tablet-layout Chromium. Emulation is not actual-device certification.

In this Codex Cloud instance, the browser CDN returns a network-policy 403. Use the installed system Chromium for the available projects:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e -- --project=chromium --project=tablet-chromium
```

This fallback does **not** run WebKit. Actual Safari on the M4 Mac mini and actual iPad testing remain outstanding.

## Architecture and reproducible shots

- `src/game/simulation.ts`: seeded wind, fixed-step physics, swept collisions, damage, explicit turn states, and replay. No DOM or rendering dependency.
- `src/game/render.ts`: responsive Canvas rendering and original placeholder art.
- `src/main.ts`: native HTML controls, keyboard/pointer input, pause/resume, and the fixed-clock adapter.
- `src/style.css`: desktop/touch layouts and reduced-motion styling.

World coordinates are independent of display size, with positive y pointing upward. Physics runs at 120 fixed steps per simulated second, with bounded wall-clock catch-up. Rendering pauses its expensive drawing work while the scene is unchanged.

In development only, the browser console exposes:

```js
skygun.snapshot()                 // Detached copy of the current world
skygun.replayData()               // { seed, shots }
skygun.loadReplay(seed, shots)    // Restore a completed-shot history
```

Copy the seed and shots when reporting an issue. Shot logs preserve player, angle, and power; snapshots additionally show in-flight state. Replay accepts valid alternating turns, executes the shared physics, and ends at the next aim state or game over. These helpers are omitted from production builds.

## Eventual GitHub Pages hosting

Vite uses `base: './'`; generated asset URLs are relative and there is no client-side router. The production build can therefore live under a repository subdirectory such as `/Skygun/`. Validate that prefix before any release.

Publication, repository visibility changes, and merging require approval. This milestone contains no deployment workflow.

## Real-device checklist

On desktop Safari and the actual iPad, play a full match and rematch; adjust sliders and step buttons; verify deliberate Fire and no unwanted control scrolling; rotate during aiming and flight; background and resume during both; check text/controls with Safari chrome visible. Audio checks belong to the later sound milestone. A desktop or emulated browser passing cannot replace these checks.
