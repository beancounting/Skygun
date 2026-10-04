# Changelog

Record user-visible changes, fixes, and important verification limits here with every implementation or fix. Dates use Australia/Brisbane time. Historical preparation notes below describe status at the time; confirmed releases are recorded separately.

## Unreleased

### 2026-10-05 — Solo play with a Friendly computer opponent

- Added Solo · Friendly alongside Two players in the new Play setup menu, on all three maps. You control Moss; Ember automatically chooses and fires its shots. The current two-player mode remains the initial default.
- The opponent searches copied game states using the same wind, collision, crater and settling rules. It scores enemy damage, penalises self-hits and adds modest seeded aim error. Search work is split across frames, with a short thinking pause before firing.
- Human aiming and firing are locked on computer turns. Pause/backgrounding and the setup menu freeze thinking; new matches discard pending plans. Rematches retain the opponent and map. Updated status text, help and mode labels.
- Verified 67 simulation tests (including nine complete computer matches across all maps and strong-wind opening shots), 24 desktop/tablet Chromium browser checks and TypeScript/production build. Visually inspected the setup menu at tablet/phone sizes and the thinking state.
- The standalone offline build also passed a full local match/rematch and a human/computer exchange, with no external requests or runtime errors.
- Local Chromium measurement for one opening search: 73 frames, 82.6 ms total search work, slowest batch 7.7 ms. The 3 ms batch deadline is a soft target, checked between bounded simulation chunks; this is not an iPad performance claim.
- Prepared on `feat/solo-play` for review. The live game is unchanged. Human difficulty tuning and actual Mac Safari/iPad tests remain outstanding.

## Published — 2026-10-04

- Published the crater-and-three-map update with explicit user approval: source `1493bca`, Pages build `a78b29d`. GitHub reports the build complete; the live page serves `index-DU4EMwHG.js`.
- Verified a complete five-shot match and rematch on the public link in tablet-profile Chromium, then selected High Divide and The Basin and fired a shot through handoff on each. No page errors or failed HTTP requests occurred; production debug helpers are absent.
- Updated the README and plan to reflect the live release. Source branches remain unmerged; repository visibility is unchanged. Actual Mac Safari/iPad testing and human map-balance playtests remain outstanding.

## Published — 2026-10-03

- Published the lever/barrel wind-up update from `2b08ebd` as Pages build `b0ef87a`. GitHub reports the build complete. Verified the new JavaScript asset and winding-up status on all five shots of a complete live match, followed by rematch, in tablet-profile Chromium with no errors.
- The first playable local duel is live at https://beancounting.github.io/Skygun/ after the user enabled Pages. GitHub reports `built`, serving `gh-pages` from `/` with HTTPS enforced.
- Verified the public HTML/CSS/JS returned HTTP 200 and completed a five-shot match plus rematch on the live site in Chromium with a tablet touch profile. No JavaScript errors or failed requests occurred.
- Updated the README with the verified play link. No download or installation is required to use the hosted game.
- Source `main` and repository visibility remain unchanged. Actual Mac Safari and iPad verification remains outstanding; touch emulation is not device certification.

## Preparation history

The crater and map entries below describe their pre-release status; both were subsequently published with approval on 2026-10-04.

### 2026-10-04 — Three selectable battlefields

- Added High Divide (central ridge) and The Basin (raised banks) alongside the unchanged Sunpatch Ridge. Both new layouts have symmetric starting terrain; all three use the existing crater and settling simulation.
- Added a Maps button and accessible picker with terrain previews. Opening it pauses play; Cancel preserves the current match. Starting a new match resets health, wind and terrain. Play again keeps the selected map, and the battlefield displays its name.
- Included map identity in development replay data so different layouts reproduce correctly.
- Verified 50 simulation tests, 20 desktop/tablet Chromium browser checks, TypeScript/production build and the standalone offline full-match/rematch check. Checked reachable damage from both players at both maximum wind directions. New-map browser checks use deterministic simulation replays to reach victory, then the real rematch controls. Inspected both new battlefields and tablet/phone picker screenshots.
- Prepared on `feat/map-selection`, stacked on the crater branch. Neither update is live. Automatic approval review rejected the attempted live deployment because this specific release lacked explicit publication approval. No source merge or visibility change occurred.
- Human balance playtests and actual Mac Safari/iPad testing remain outstanding.

### 2026-10-03 — Craters and settling on the current map

- Added overlapping circular craters to the heightmap, used by both collision and drawing. Zero-height terrain represents a hole through the bottom. Cached ground paths rebuild after carving.
- Added upright robot settling against the full track footprint, with bounded falls and locked controls until both robots finish. Landing causes no extra damage; losing all support eliminates a robot. Simultaneous eliminations draw.
- Rematch restores the hill. Updated in-game help and turn feedback, and aligned initial cart placement with the same support rules used after craters.
- Verified 34 simulation tests, 16 desktop/tablet Chromium browser checks, TypeScript/production build and a complete offline downloadable match/rematch. Visually inspected the battlefield after repeated craters.
- Recorded additional-map ideas in the backlog; did not implement a map selector, random terrain or character redesign.
- Prepared on `feat/destructible-terrain` for review; the live game is unchanged pending publication approval. Actual Safari/iPad checks remain outstanding.

### 2026-10-03 — Character refinement backlog

- Added character/weapon readability tasks to milestone 4, including clarifying the lever's connection to the barrel so it does not resemble another antenna. Deferred the artwork changes; gameplay and the live site are unchanged.

### 2026-10-03 — Shot wind-up animation

- Added a 450 ms wind-up: the robot's cocking lever pulls back, the barrel retracts, then both spring forward as the projectile launches. Mirrored for both players.
- Locked aiming and repeat Fire during wind-up; pause/backgrounding freezes it. Launch power, wind and trajectory rules are unchanged. Reduced-motion mode keeps the mechanism still and uses the winding-up status instead.
- Verified 25 simulation tests, 14 desktop/tablet Chromium checks, TypeScript/production build and a complete offline downloadable match/rematch. Visually inspected ready, pulled-back and release frames.
- Paused the browser tests' virtual clock between explicit advances so assertions about sub-second animation timing are deterministic.
- Implemented on `feat/shot-windup`; subsequently published with approval (see Published above). Actual Safari/iPad checks remain outstanding.

### 2026-10-03 — First web publication approved; Pages activation pending

- The user approved publishing a playable web link. Uploaded the verified static build to GitHub's `gh-pages` branch (`ca93fb2`), with `.nojekyll` and relative asset paths. This does not merge the source branch or change repository visibility.
- Added `npm run publish:pages` to reproduce the static upload from the same source, using a temporary Git index and a normal non-force push.
- All 24 simulation tests and the TypeScript/production build passed before upload.
- GitHub API access is blocked by the environment's network proxy, preventing automatic Pages activation. Saved additive network requirements for `api.github.com` and `beancounting.github.io` in the environment draft. Draft saving does not apply runtime network changes.
- Pages must be enabled using `gh-pages` and `/ (root)` in the repository's Pages settings. A live public site and actual Safari/iPad behavior have not yet been verified.

### 2026-10-03 — Cloud install and startup

- Executed the saved locked-dependency installation and started the development server.
- Saved refreshed `install_script` and `start_skill` environment drafts, including standalone-download generation and verification instructions.
- Verified 24 simulation tests, TypeScript and both builds, a complete browser match/rematch, and the offline standalone match/rematch. Process-sandbox restrictions required the supported command escalation flow.
- Environment configuration is saved as a draft; no environment publication, game deployment, or merge was performed. Actual Safari/iPad verification remains outstanding.

### 2026-10-03 — Download troubleshooting and review

- Added a standalone `Skygun-play.html` build with inline JavaScript and CSS, generated from the same game source. It needs no development server or companion files.
- Added an offline browser check of the downloadable document, including a complete match and rematch, with external requests blocked.
- Added a useful loading/failure message instead of an empty page when the source entry cannot start.
- Clarified that review notes/screenshots are not playable downloads, that ordinary source/production HTML needs HTTP serving, and that an iPad Files preview is not a supported way to play.
- Reviewed startup, packaging, controls, pause/resume, physics, and test coverage. Real Safari/device verification remains outstanding; managed Chromium blocks direct `file://` navigation, so offline document execution is tested separately from actual file opening.

### 2026-10-03 — Milestone 1: local duel (`a5dcbb1`)

- Added a complete local two-player game: fixed battlefield, original robot placeholders, angle/power controls, gravity, seeded wind, swept collision, blast damage, turns, victory/draw, and rematch.
- Added responsive desktop/touch controls, keyboard aiming, pause/help, and background/resume protection.
- Separated simulation from rendering/input and added development-only seed/shot replay helpers.
- Added TypeScript/Vite tooling, 24 simulation tests, and desktop/tablet browser tests. The 12 available Chromium checks passed; WebKit downloads were blocked. Production assets were checked under `/Skygun/`.
- Saved the approved plan and review/run instructions. No merge, deployment, or visibility change.
