# Skygun

Little robots. Big shots. A small, original browser artillery game for solo play or two people sharing a device.

**Now live:** three selectable maps, explosions that carve craters, and robots that settle onto remaining ground before the next turn. Landing does not cause damage; losing all support down to the bottom eliminates a robot. Rematch restores the original hill. Aim, read the wind, fire, and bring the other robot to zero health. Blast damage can hurt either player, and wind stays the same for both turns in a round.

**[Play Skygun](https://beancounting.github.io/Skygun/)** — open the link in your browser; no download or installation required.

The live link includes **Solo · Friendly**, two-player mode, craters and all three maps. Use **Play → Solo · Friendly → Start new match** to play against the computer. You control Moss; Ember reads the wind and terrain and fires automatically. Character refinement and sound remain later work. See [the approved plan](PLAN.md). Actual Safari/iPad verification remains outstanding.

## Downloading and opening the game

The review notes (`REVIEW.md`) and screenshot are not playable game files. Double-clicking the source `index.html`, or the normal `dist/index.html`, is also not the supported launch method: those editions need an HTTP server and their companion files.

For a standalone desktop download, generate:

```sh
npm ci
npm run build:download
```

Download **`dist-download/Skygun-play.html`** and open that entire file in a current desktop browser on your Mac (Open With → Safari or Chrome). It contains the game, styles and artwork, requires no Node installation on the playing device, and makes no external requests. Do not download only an individual source file. The Cloud build artifact can be supplied directly, so players do not need to run these build commands.

The standalone document is tested offline in Chromium; actual Mac Safari file opening is not yet verified. On iPad, Files/Quick Look may show a preview without running the game. Use the live HTTPS game link in Safari instead.

To recheck the downloadable edition in this Cloud instance:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:download
```

This executes the standalone document offline and plays a complete match/rematch. The managed browser blocks direct `file://` navigation, so this test does not certify actual-device file opening.

See [CHANGELOG.md](CHANGELOG.md) for ongoing changes, fixes, and verification limits.

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
- Share the device when the other player's turn begins. Each player keeps their own aim settings. The current live version uses a small cross for the previous impact. This branch prepares a clearer LAST SHOT label pointing to that exact location, larger damage badges and an impact burst. These feedback changes are not published yet.
- Explosions change the ground. Wait for robots to settle, then adjust your next shot to account for their new height. There is no movement or falling damage.
- **Play** offers Solo · Friendly or Two players, plus Sunpatch Ridge, High Divide and The Basin with terrain previews. Opening the picker pauses play; Cancel preserves the match. Start new match resets health and terrain. Play again keeps your chosen map and opponent.
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

## GitHub Pages hosting

Vite uses `base: './'`; generated asset URLs are relative and there is no client-side router. The production build can therefore live under a repository subdirectory such as `/Skygun/`. Validate that prefix before any release.

The user has approved publishing the first playable version. The release command is `npm run publish:pages`; it builds and uploads only the static output to `gh-pages`, preserving the source branch and repository visibility. This command writes to GitHub and should only be used for an approved release. It never force-pushes.

GitHub Pages must be enabled in repository **Settings → Pages**, with **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**. A successful branch upload does not by itself enable Pages. GitHub account/repository eligibility still applies; do not change repository visibility to work around it.

Pages is enabled at https://beancounting.github.io/Skygun/ with HTTPS enforced. On 2026-10-03, the public HTML/CSS/JS returned HTTP 200, and a complete five-shot match and rematch passed with no JavaScript or request errors in Chromium using a tablet touch profile. Actual iPad testing remains outstanding. Verify the live page after each subsequent approved release. Source merging and visibility changes still require separate approval.

## Real-device checklist

On desktop Safari and the actual iPad, play a full match and rematch; adjust sliders and step buttons; verify deliberate Fire and no unwanted control scrolling; rotate during aiming and flight; background and resume during both; check text/controls with Safari chrome visible. Audio checks belong to the later sound milestone. A desktop or emulated browser passing cannot replace these checks.
