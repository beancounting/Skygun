# Milestone 1 review

Branch: `feat/local-duel`. Scope: one complete local two-player match on fixed terrain. Source remains unmerged. The first playable build was subsequently published with user approval; see the live verification below.

## What to review

- Play a full duel: angle/power, wind, readable shots, splash damage, health, handoff, victory and rematch.
- Try both sliders and step buttons, then focus the battlefield for arrow/Space controls. Fire is gated while a shot resolves and held Space cannot fire the next player's shot.
- Open help or pause during flight. Backgrounding requires explicit resume and cannot advance the hidden match.
- Resize/rotate without resetting the match. Desktop and tablet landscape controls fit the viewport; touch targets are at least 44 CSS pixels.
- The simulation is separate from rendering/input and supports deterministic seed/shot replays in development.

## Verification completed

| Check | Result |
| --- | --- |
| TypeScript (`npm run check`) | Passed |
| Frozen dependency reinstall (`npm ci`) | Passed; development server restarted successfully |
| Simulation (`npm test`) | 24 passed |
| Desktop Chromium browser tests | 6 passed |
| Tablet touch emulation in Chromium | 6 passed |
| Production build (`npm run build`) | Passed |
| Production served under `/Skygun/` | HTML/CSS/JS returned 200 under that prefix; a shot finished and handed over; reload worked; no JavaScript errors; development helpers absent |
| Visual inspection | Desktop, tablet and phone layouts inspected; desktop/tablet battlefield and victory screen inspected after layout corrections |
| Whitespace validation (`git diff --check`) | Passed |

The browser suites play a complete five-shot match through real controls, verify rematch, keyboard input, held-key protection, per-player aim memory, pause/resume, synthetic backgrounding, rotation/layout and pointer/touch adjustment. Synthetic visibility tests are not real-device backgrounding tests.

Node.js 24.19.0 and npm 11.9.0 were used. Browser automation used the installed system Chromium via the override documented in README.

## Remaining limits

Playwright's browser-download host returned a network-policy 403. Desktop WebKit and iPad-layout WebKit tests were therefore **not run**. Actual iPad Safari and M4 Mac Safari checks require the user's devices. Chromium touch emulation does not certify Safari compatibility.

Game feel and balance still need human playtesting. The first map is fixed, robots do not move, and there is no computer opponent or sound in this milestone. Reload/tab eviction starts a fresh match. These are deliberate scope boundaries from the approved plan.

See README for commands and the real-device checklist. See PLAN.md for subsequent milestones. Review this milestone before merging or starting terrain destruction.

## Follow-up review: downloaded index.html (2026-10-03)

The user confirmed they downloaded `index.html`. Static review identified a distribution problem: the source entry imports `/src/main.ts`, which must be transformed and served, and the normal production entry imports separate module/CSS files. Neither was a self-contained download. Earlier checks covered HTTP serving, so they did not validate that user workflow. The earlier shared review notes and screenshot were also not a playable distribution.

Fixed by adding `npm run build:download`, which bundles the existing source into a single classic inline script and stylesheet in `dist-download/Skygun-play.html`. It is a separate distribution format, not a second implementation. The generator rejects unexpected separate assets/imports. The normal website build and gameplay logic are unchanged. A fallback message now explains startup instead of leaving the source page blank.

Added `CHANGELOG.md` and a repository instruction to maintain it for future implementations and fixes.

Follow-up checks: TypeScript passed; all 24 simulation tests passed; the ordinary production build passed; the standalone document completed a five-shot match and rematch offline in Chromium, with zero external requests, zero runtime errors and no development helpers. The existing 12 desktop/tablet interaction checks are results from the prior milestone run, not a new full-suite run for this packaging-only change.

Direct `file://` navigation in the managed Chromium instance returned `ERR_BLOCKED_BY_ADMINISTRATOR`. The offline test therefore executes the actual generated HTML document with network access disabled; it does not establish direct Mac/Safari file-open compatibility. No browser policy was bypassed. Real Mac Safari and iPad checks remain open. On iPad, the intended launch method remains a hosted HTTPS page in Safari, not a Files/Quick Look preview; publication still requires approval.

This review covered launch/distribution, controls, pause/resume, physics and test boundaries. No additional release-blocking defect was identified in that scope. Human game-feel and actual-device checks are still needed before declaring version one ready.

## Publication follow-up (2026-10-03)

The user explicitly approved publishing the first playable web version. The static release passed 24 simulation tests and the TypeScript/production build, then was uploaded to `gh-pages` as `ca93fb2`. Source `main` and repository visibility were not changed. There is no source merge.

The GitHub API's HTTPS CONNECT request returned proxy 403, blocking automatic Pages configuration. API/Pages hostname requirements were saved additively in the environment draft, but this does not apply live network settings. The remaining action is repository Settings → Pages → Deploy from a branch → gh-pages → / (root) → Save. GitHub eligibility has not been established through the blocked API; if Pages is unavailable, do not change visibility without approval. Verify the URL supplied by GitHub before calling the site live.

## Live verification completed (2026-10-03)

The user enabled Pages. The earlier network restriction no longer blocks the required hosts: the Pages API now reports `built`, `https_enforced: true`, and source `gh-pages` / `/`. The confirmed public URL is https://beancounting.github.io/Skygun/.

The public page and both generated assets returned HTTP 200. An automated Chromium run using a tablet touch profile played the live five-shot match through the controls, reached “Moss takes the hill!”, and successfully rematched. No JavaScript errors or failed requests were observed. The test fixed the random seed in its browser context for reproducibility; production code and the deployed files were not altered by the test.

Actual Mac Safari and iPad checks remain open. No source merge or visibility change was performed.

## Shot wind-up follow-up (2026-10-03)

On `feat/shot-windup`, pressing Fire now starts a 450 ms wind-up before the projectile exists. The cocking lever pulls back, the barrel retracts, and both return forward at launch. Controls are locked from the initial press, so repeat fire cannot queue another shot. Pausing and tab backgrounding preserve wind-up progress. The animation mirrors for both players. Reduced-motion mode suppresses lever/barrel travel without changing simulation timing.

Validation: 25 simulation tests, 14 desktop/tablet Chromium interaction checks, TypeScript/build, and the standalone offline full-match/rematch check passed. Ready, pulled-back and release frames were visually inspected. The existing launch and damage values are unchanged, and complete seeded matches still reach the same results. A real iPad/Safari check is still required.

Published with user approval as Pages commit `b0ef87a` from source `2b08ebd`. GitHub reports `built`. The public page serves the new `index-le_Pv0AM.js` asset; a tablet-profile Chromium run verified winding-up status and locked controls on each of five shots, victory and rematch, with no JavaScript or request failures. No source merge or visibility change was performed.

## Milestone 2: destructible terrain (prepared, not yet live)

Branch: `feat/destructible-terrain`, based on the wind-up branch. Ground/robot impacts carve a 72-unit-radius lower circular arc into the heightmap. Overlapping blasts only remove ground; no caves, overhangs or terrain growth are introduced. Collision and cached rendering paths use the same samples. Misses do not carve.

After impact feedback, both upright carts settle against the highest remaining surface across their 52-unit track footprint. This intentionally lets a cart bridge a narrow hole or rest on an edge, without wheel/slope physics. Initial placement uses the same rule. Falling is animated, causes no damage, and is bounded at two seconds. Complete loss of support causes elimination; both landings/eliminations resolve before victory or draw. Input remains locked until handoff. Pausing/backgrounding freezes settling, and rematch restores a fresh heightmap.

Validation: 34 simulation tests, 16 desktop/tablet Chromium checks, TypeScript/production build, and the offline standalone full-match/rematch check passed. Cases cover overlapping and edge craters, zero floor, collision through a crater, missing support, simultaneous falls/draws, bounded settling, pause during settling, and terrain restoration on rematch. Visually inspected the tablet battlefield after four hits: both craters and lowered robot positions are readable. The seeded full-match fixture now accounts for changed spawn/support heights and aim adjustments after destruction.

No extra maps, movement, falling damage, character redesign, deployment or source merge is included. Additional map ideas are in PLAN.md. Real Safari/iPad testing and human balance playtests remain outstanding. Review this milestone before updating the live site.


## Designed maps (2026-10-04, prepared, not yet live)

Branch `feat/map-selection` is based on `feat/destructible-terrain`. It adds High Divide and The Basin alongside the original Sunpatch Ridge without changing the original terrain formula. Shared map definitions drive fresh simulation heightmaps, picker previews and battlefield labels. The new layouts are symmetric; a bounded shot search confirms both players can deal at least 30 damage on fresh terrain with wind at either extreme. This establishes reachable shots, not human-tested balance.

Maps opens a native modal with labelled radio choices and terrain previews. It pauses all simulation, including flights and settling. Selection alone does not discard a match: Start new match explicitly resets it, while Cancel or Escape resumes it. Rematch retains the map and restores its terrain. Replays carry map identity, with the original layout as the backwards-compatible default. No new dependencies or external assets are used.

Validation: 50 simulation tests, 20 desktop/tablet Chromium browser checks, TypeScript/production build and standalone offline full-match/rematch passed. Browser checks cover cancellation during flight and map selection/reset. Complete new-map matches are generated through the shared simulation and loaded through the development replay helper to exercise victory/rematch; the original map still has a full control-driven match test. Visually inspected both new battlefields at 1024×768 and the picker at 1024×768 and 390×844, with no page errors or horizontal overflow. Actual Safari/iPad and human map-balance playtests remain outstanding.

Release status: automatic approval review rejected the attempted Pages deployment because the user had not explicitly approved this specific release. The live link remains on the wind-up version. Present the combined crater-and-map update for explicit publishing approval; do not retry publication without it. Source branches remain unmerged and repository visibility is unchanged.


## Crater and map release verified (2026-10-04)

The user explicitly approved publishing the tested combined update. Published source `1493bca` to the existing `gh-pages` branch as `a78b29d`; GitHub reports `built` and the public page serves `index-DU4EMwHG.js`. This approval resolves the earlier blocked deployment described above.

Live tablet-profile Chromium verification completed a seeded five-shot match through the real controls, reached victory, and rematched with full health. It then selected High Divide and The Basin, confirmed the selection persisted when reopening the picker, cancelled without resetting, and fired through a successful turn handoff on each. The public page and assets loaded without failed HTTP requests or runtime errors. Production debug helpers are absent. Source branches remain unmerged and repository visibility is unchanged. Actual Safari/iPad and human balance checks remain open.


## Milestone 3: Friendly solo opponent (2026-10-05, prepared)

Branch `feat/solo-play` builds on the released map branch. Play opens a setup menu for Solo · Friendly or Two players plus a map. Moss is always the human in solo, Ember the computer; local play remains the initial default. Starting explicitly resets the match, while cancelling preserves it. Rematches retain mode and map.

`src/game/computer.ts` cooperatively searches 116 candidate shots against copied game states using the existing fixed-step simulation, including damage, craters and settling. It scores damage and penalises self-damage, with impact distance as a tie breaker. Seed/turn-derived angle error of up to two degrees and power error of up to three points make it fallible without changing wind randomness. The search yields after at most 64 simulation steps and after each candidate; each frame runs at most 16 chunks with a soft 3 ms budget. A one-second minimum thinking delay avoids immediate firing. There are no timers or workers that could fire a stale shot after reset.

The controller runs only on an unpaused computer aiming turn and is discarded after firing, replay loading or starting another match. All human input paths reject computer turns; HUD/announcements explain thinking and handoff. Pause, help, setup and backgrounding use the existing pause gate, freezing both search and thinking time. Real shot commands still use the normal wind-up/flight/settling flow.

Validation: 67 simulation tests and 24 desktop/tablet Chromium browser checks passed, including complete solo matches, input gating, paused thinking, mode switches while thinking, retained map/mode on rematch and the existing local-match coverage. Nine seeded computer-versus-computer matches completed within 40 shots across all layouts; maximum-wind opening tests found useful damage without self-hits. TypeScript and production build passed. Inspected setup at 1024×768 and 390×844 and the thinking state. One local Chromium search took 73 batches/frames, 82.6 ms total, with a 7.7 ms slowest batch; the soft deadline is not a hard real-time guarantee or actual-device result.

The standalone offline build passed a full local match/rematch and a human/computer exchange without external requests or runtime errors; production debug helpers are absent.

Publication and source merging remain pending review/explicit approval. Human difficulty tuning, real iPad responsiveness and Safari testing remain outstanding. No new runtime dependencies or external services were added.


## Solo release verified (2026-10-05)

The user explicitly approved publishing Solo · Friendly. Deployed source `715d48d` as Pages build `8ea0fcd`. GitHub reports `built`, and the public page serves `index-BZb_yE70.js`. Live tablet-profile Chromium verification checked automatic computer turns on Sunpatch Ridge, High Divide and The Basin, completed a solo match, rematched with full health and retained mode/map, then switched to local play and verified the second player waits for manual input. No runtime or HTTP errors occurred; production debug helpers are absent.

The live entry is Play → Solo · Friendly → Start new match. Source branches remain unmerged; repository visibility is unchanged. Actual-device Safari/iPad verification and human difficulty tuning remain outstanding.


## Shot feedback (2026-10-05, prepared)

Branch `feat/shot-feedback` strengthens the existing render-only feedback: dark contrasting HP badges above damaged robots; a bright core, outward ring and short radial sparks on impact; and a labelled LAST SHOT cross/leader at the active player's previous non-miss impact. Badge/label scaling accounts for CSS canvas size independently of device pixel ratio, improving phone readability. The last-shot label is horizontally clamped and the cross remains at the exact historical impact, even if terrain has since changed. In-game help explains that this is history, not a trajectory prediction.

Damage detail also appears in the existing turn hint. No damage badges are drawn for zero damage, and misses have no explosion or last-impact marker. Effects use existing impact phase time, so pausing preserves them. Reduced motion suppresses radial travel/rays and floating badge movement; checked two reduced-motion canvas frames 200 ms apart were pixel-identical during impact. Simulation, damage, wind, computer decisions and turn timings are unchanged.

Inspected tablet (1024×768) impact/marker and phone (390×844) marker screenshots. A focused Chromium check verified a seeded hit's “Ember −40 HP” detail with no runtime errors. Actual iPad/Safari and human readability/timing checks remain outstanding. Relaxed difficulty and sound/mute are backlog items, not included. Publication and source merge remain pending approval.

Browser regression checks: 23 desktop/tablet Chromium cases passed in the initial run; the final tablet solo case was reset to LOCAL DUEL by a development hot reload during the small-screen rendering edit. It passed when rerun against the finished code (35.9 s). No test or timeout changes were needed. Final TypeScript/production build passed.

The final standalone offline build completed a five-shot local match/rematch and solo exchange, without runtime errors or external requests and with development helpers absent.
