# Skygun — approved development plan

## Concept and constraints

A small, colourful browser artillery game: two expressive scrap-built robots on spring-legged carts launch bright pop shells across a hillside. Fun comes from learning from misses, judging wind, and adapting to the terrain. Skygun is the working name. Original geometric placeholder art proves the game before final assets. An alternative garden-creature theme is deferred.

Primary devices are desktop Safari on an M4 Mac mini and landscape Safari on an iPad. Support other current desktop browsers; phone polish is secondary. No fullscreen or orientation-lock requirement. No backend, database, paid API, or AI service during gameplay. Assume short matches of roughly 3–6 minutes.

Develop in the existing Codex Cloud checkout. Each task already has an isolated environment; do not create extra worktrees unless requested. Implement one milestone per feature branch, test it, and present changes for review before merging. Do not publish or change repository visibility without explicit approval.

## Version one scope

- One robot per side, one handcrafted map, one basic weapon.
- Angle/power aiming, gravity, wind, explosion damage, health, clear turns, victory/draw, immediate rematch.
- Local pass-and-play first; basic computer opponent later.
- Heightmap destruction with craters and character settling, without caves or overhangs.
- Brief in-game help, restrained effects, basic sound and mute.
- Responsive desktop and touch controls designed together.

Defer movement, falling damage, complex vehicle physics, extra maps/weapons/characters, accounts, online multiplayer, matchmaking, progression, inventories, shops, leaderboards, campaigns, and map editing. Improve map shape and balance before adding movement. Initial damage/health constants are provisional and must be tuned through play.

## Match and controls

Aim → flight → explosion → terrain update/settling when implemented → result check → handoff. Wind is constant through a shot and shared by both turns of a round. Resolve damage to both players before deciding victory; simultaneous defeats draw. Preserve each player's aim settings and show their previous impact. No perfect trajectory preview; show a short barrel direction guide.

The battlefield dominates the screen. A narrow top strip shows health, turn, and wind. A bottom strip holds labelled angle and power sliders, step buttons, and a separate deliberate Fire action. Native controls have comfortable targets of at least 44 CSS pixels, clear keyboard focus, and numeric outputs. Arrow shortcuts work only when the battlefield owns focus; Space fires only once per deliberate press. Respect focused form controls. Prevent unwanted scrolling on game controls while preserving page zoom elsewhere. Use inward-facing angle values for both players.

Preserve world state on resize/rotation. Pause when hidden, discard hidden elapsed time, and require Resume. No promise to survive tab eviction/reload in version one. Respect reduced motion. Portrait remains usable with a gentle landscape suggestion.

## Stack and architecture

TypeScript + Vite + Canvas 2D with ordinary HTML/CSS controls; Vitest for simulation tests and Playwright for browser interaction tests. A small framework such as Kontra.js provides loop/sprite helpers, but custom artillery and terrain logic remain necessary. Plain Canvas avoids an unnecessary dependency and native controls simplify touch and accessibility. No application framework, generic physics engine, elaborate entity engine, or speculative multiplayer architecture.

Separate simulation, rendering, input/UI, computer aiming, audio, and balance constants. Fixed logical world around 1200 × 675; responsive proportional rendering and device-pixel-ratio backing buffer capped at 2. Pointer coordinates map into world units.

Fixed simulation timestep, initially 1/120 second, driven by requestAnimationFrame with bounded catch-up. Gravity and wind acceleration are deterministic. Swept projectile paths account for radius and resolve the earliest terrain/robot collision. Heightmap terrain stores one height per horizontal sample. Craters lower intersecting samples and update the terrain drawing only after changes. Carts settle and lean against their track footprint, up to 35 degrees, around a fixed track centre; no rolling, sliding or wheel simulation. World-space aiming remains independent of chassis tilt. Bottom void eliminates a robot. Bound flight and settling times and explicitly resolve map exits.

Use explicit aiming, flight, impact, settling (when needed), handoff, and game-over states. Commands are gated by state and turn ownership. Computer aiming searches bounded candidate shots through the same simulation against a copied world; score damage and self-hits, introduce adjustable error, and spread work across frames. Audio starts/resumes from user gestures and is muted/paused appropriately.

## Milestones

| Milestone | Visible result and acceptance | Main risk and validation |
| --- | --- | --- |
| 1. Complete local duel | Fixed map, placeholder robots, angle/power/wind, health, turns, victory/draw, rematch. A whole local match works with mouse, keyboard and touch-compatible controls. Misses terminate; no double firing; reset is complete. | Reliable physics/turn loop: automated physics, swept collision, damage and transition tests; complete-match browser smoke test; desktop/iPad-sized visual inspection. |
| 2. Destructible battlefield | Craters, matching collision/render geometry, robots settle before handoff, edge explosions and unsupported robots resolve. | Support errors: reproducible crater/edge/under-robot shots, automated terrain and support checks, visual inspection. |
| 3. Solo play | Selectable computer opponent with plausible hits/misses, bounded turns and responsive UI. | Accuracy and cost: seeded candidate tests, simulated matches, human play across wind and terrain states. |
| 4. Feel/device polish | Cohesive placeholder art, trail/impact/damage feedback, audio/mute, help and rematch polish. Clear ownership beyond colour; working resize/background/resume; comfortable real-iPad controls. | Safari/touch behaviour: browser tests, actual-device checklist, complete human playtests. |
| 5. Release preparation | Production build suitable for GitHub Pages; clean checks, assets work under /Skygun/, direct load/refresh works, publishing documented. | Hosting paths: test production output under repository prefix. Publication remains separately approved. |

Milestone 1 and the subsequent wind-up improvement have been implemented and published with approval. The user has now authorised milestone 2: make craters and settling work on the existing map, on `feat/destructible-terrain`. Validate and present it for review before publication or merging. The subsequent request to keep iterating continues with the two designed layouts below on `feat/map-selection`, stacked on the crater branch. The user subsequently selected solo play as the next task (2026-10-05). Milestone 3 is implemented on `feat/solo-play` and published with explicit approval on 2026-10-05 (source `715d48d`, Pages build `8ea0fcd`): one Friendly opponent, available on all maps, with bounded cooperative shot search and modest deterministic aim error. Character redesign remains future work.

## Map backlog (after the current crater milestone)

- [x] Add High Divide (central ridge) and The Basin (raised edges, low middle), alongside Sunpatch Ridge, with a map picker.
- [x] Check supported starts, symmetry of the new layouts, and reachable damage from both sides at maximum wind in either direction.
- [ ] Human playtest all three layouts for pacing and fairness; adjust shapes if needed.
- [ ] Keep random terrain deferred until the designed maps establish what is fun.

Map implementation follows the user’s request to continue iterating. The user explicitly approved publishing the combined crater/map update after the initial automatic approval rejection. Published source `1493bca` as Pages build `a78b29d` on 2026-10-04. Source review/merging remains separate.

## Ground contact correction (2026-10-05)

- [x] Address the user's crater screenshots: fit and animate robot tilt against the terrain rather than resting an upright cart on its highest support sample.
- [x] Keep tracks clear of terrain throughout settling, preserve world-space barrel aim, and keep rooftop apes upright on flat roofs.
- [ ] Publish the tested fix only after explicit approval; check crater-edge appearance on actual devices.

## Feedback and difficulty follow-up (2026-10-05)

- [x] Publish clearer damage badges, a labelled last-impact marker and an outward impact burst with explicit user approval (2026-10-05, source `bb00fd3`, Pages build `c1ac1d9`).
- [ ] Human playtest feedback readability and timing on iPad.
- [ ] Add a Relaxed opponent with more aiming error; consider naming the current difficulty Standard. Preserve the current opponent's behaviour until that change is approved.
- [ ] Add sound with a mute button after visual feedback.

## Rooftop easter egg (2026-10-05)

- [x] Publish hidden Rooftop Rivals with explicit user approval (2026-10-05, source `69ecd99`, Pages build `94cf038`), revealed by the star in the Skygun logo, with original ape drawings, throwing animation, bananas and a stepped city skyline.
- [x] Keep Solo and Two players available; reveal opens a paused setup menu and requires Start new match, so discovery does not discard a match.
- [x] Start with solid buildings and existing damage/wind/turn rules. Preserve the tank maps and their crater behaviour.
- [ ] Human playtest rooftop angles and readability on actual devices.
- [ ] Consider destructible buildings with wall holes as a separate follow-up after the basic rooftop game feels good.

## Character-refinement to-do (milestone 4)

- [ ] Refine the existing robot silhouettes and expressions while keeping them readable at normal gameplay size.
- [ ] Make the firing lever visibly part of the weapon rather than a second antenna. Explore a thicker handle connected to the barrel and a small spring that compresses during wind-up.
- [ ] Check that aiming, pulling back and release are understandable on both robots, including at iPad size and with reduced motion enabled.

This is deferred visual polish, not an immediate redesign or a request for additional characters. Keep the current playable art until this milestone is approved.

## Risks and testing

Use moderate wind, readable trails and impact markers to make misses understandable. Start with broad hills and modest future craters to avoid trapping players. Test high-speed collision, self-damage, explosion boundaries, simultaneous defeats, shot exits/timeouts, duplicate fire, handoffs and rematch resets. Later test crater boundaries and settling. Use a development seed, snapshot and shot log to reproduce failures; not a user-facing editor.

Compare fixed-step results under different rendering schedules. Browser tests exercise actual controls, focus, repeated Fire, resizing and complete matches. Inspect rendered output; automated success alone cannot prove game feel. Measure bounded AI work on iPad when added. Prefer small effects and reduced-motion support.

Distinguish desktop browser automation, emulated touch/layout testing, and actual-device verification. Playwright WebKit does not certify iPad Safari. Real iPad checklist: sliders and step controls, deliberate Fire, no unwanted scroll, complete match/rematch, later mute/unmute, rotation during aim/flight, background/resume during aim/flight, readability with browser chrome visible. Also manually check desktop Safari on the M4 Mac mini. Bring device testing forward when an approved access method exists.

## Local development and eventual hosting

Intended commands: `npm ci`, `npm run dev`, `npm run check`, `npm test`, `npm run test:e2e`, `npm run build`. Record unavailable checks honestly. Cloud dev servers are not inherently public links.

Build static `dist/` assets with Vite `base: './'`, imported/base-aware asset references, no hard-coded root asset paths or client-side router. Validate under `/Skygun/` before deployment. GitHub Pages publication needs separate approval; preserve repository visibility. If visibility/account constraints prevent Pages, report before selecting an alternative.

References: [Vite deployment](https://vite.dev/guide/static-deploy.html), [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action). Documentation access during planning returned proxy 403 responses; current contents were not verified.
