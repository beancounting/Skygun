# Milestone 1 review

Branch: `feat/local-duel`. Scope: one complete local two-player match on fixed terrain. No merge or publication has been performed.

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
