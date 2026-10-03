# Changelog

Record user-visible changes, fixes, and important verification limits here with every implementation or fix. Dates use Australia/Brisbane time. Unreleased entries are not claims of publication.

## Unreleased

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
