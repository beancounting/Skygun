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
