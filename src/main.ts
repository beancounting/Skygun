import './style.css';
import { ComputerTurn } from './game/computer';
import { MAPS, ROOFTOP_MAP, terrainHeight, type MapId } from './game/maps';
import { createGame, fire, FixedClock, replay, RULES, setAim, type Game, type ShotCommand } from './game/simulation';
import { PLAYER_NAMES, render } from './game/render';

const target = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="3"/><path d="M16 1v7m0 16v7M1 16h7m16 0h7"/></svg>`;
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="game-page">
    <header class="masthead">
      <span class="brand" aria-label="Skygun">${target}<span>sky<span class="brand-light">gun</span><button id="rooftop-secret" class="brand-dot" aria-label="A little rooftop secret" title="Something up there…">✳︎</button></span></span>
      <span class="tagline">LITTLE ROBOTS. BIG SHOTS.</span>
      <div class="header-actions"><span id="mode-label" class="mode-label">LOCAL DUEL</span><button id="maps" class="quiet-button maps-button" aria-label="Set up match">Play</button><button id="help" class="quiet-button" aria-label="How to play">?</button><button id="pause" class="quiet-button" aria-label="Pause game"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button></div>
    </header>

    <section class="arena" aria-label="Artillery match">
      <header class="scoreboard">
        <div class="player-score moss" id="player-0">
          <span class="avatar" aria-hidden="true"><i></i><i></i></span>
          <div class="player-info"><div class="player-heading"><span class="player-name">Moss <small>P1</small></span><span class="health-value" id="health-0">100 <small>HP</small></span></div><progress id="hp-0" max="100" value="100" aria-label="Moss health"></progress></div>
        </div>
        <div class="match-info"><span id="round">ROUND 01</span><span class="wind" id="wind" aria-label="Wind"></span></div>
        <div class="player-score ember" id="player-1">
          <span class="avatar" aria-hidden="true"><i></i><i></i></span>
          <div class="player-info"><div class="player-heading"><span class="player-name">Ember <small id="ember-role">P2</small></span><span class="health-value" id="health-1">100 <small>HP</small></span></div><progress id="hp-1" max="100" value="100" aria-label="Ember health"></progress></div>
        </div>
      </header>

      <div class="battlefield" id="battlefield">
        <canvas id="game" tabindex="0" aria-label="Battlefield. Focus here for arrow-key aiming and Space to fire." aria-describedby="keyboard-help"></canvas>
        <div class="turn-banner" aria-hidden="true"><span class="turn-dot"></span><span id="turn-label">MOSS, TAKE YOUR SHOT</span></div>
        <div id="result" class="result" hidden>
          <div class="result-card"><span class="eyebrow">A LITTLE AIM. A LITTLE LUCK.</span><span class="trophy" aria-hidden="true">✳︎</span><h1 id="result-title"></h1><p id="result-detail"></p><button id="rematch" class="primary-button">Play again <span aria-hidden="true">↻</span></button><span class="result-footnote">Same map. Fresh rivalry.</span></div>
        </div>
      </div>

      <div class="controls">
        <div class="turn-summary"><span class="eyebrow" id="turn-number">TURN 01 / PLAYER 1</span><strong id="action-title">Make it count.</strong><span id="shot-hint">Adjust your aim, then let it fly.</span></div>
        <fieldset id="aim-controls">
          <legend class="sr-only">Shot controls</legend>
          <div class="aim-control"><div class="control-label"><label for="angle">ANGLE</label><output id="angle-value" for="angle">55°</output></div><div class="slider-row"><button class="step-button" data-control="angle" data-step="-1" aria-label="Decrease angle">−</button><input id="angle" type="range" min="5" max="85" value="55" aria-label="Angle"/><button class="step-button" data-control="angle" data-step="1" aria-label="Increase angle">+</button></div><span class="range-label"><span>LOW</span><span>HIGH</span></span></div>
          <div class="aim-control"><div class="control-label"><label for="power">POWER</label><output id="power-value" for="power">52<span>%</span></output></div><div class="slider-row"><button class="step-button" data-control="power" data-step="-1" aria-label="Decrease power">−</button><input id="power" type="range" min="10" max="100" value="52" aria-label="Power"/><button class="step-button" data-control="power" data-step="1" aria-label="Increase power">+</button></div><span class="range-label"><span>GENTLE</span><span>MIGHTY</span></span></div>
          <button id="fire" class="primary-button fire-button">${target}<span>Fire shot<small>SPACE</small></span></button>
        </fieldset>
      </div>
    </section>
    <footer class="page-footer"><span id="keyboard-help"><kbd>←</kbd><kbd>→</kbd> angle <span class="footer-separator">/</span> <kbd>↑</kbd><kbd>↓</kbd> power <span class="footer-separator">/</span> <kbd>SPACE</kbd> fire <span class="focus-note">· focus the battlefield</span></span><span id="play-hint">PASS THE DEVICE. KEEP THE RIVALRY.</span></footer>
    <p class="portrait-note">A little more room? Try turning your device sideways.</p>
    <p id="announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
    <dialog id="pause-dialog" aria-labelledby="dialog-title"><form method="dialog"><span class="eyebrow">SKYGUN / HOW TO PLAY</span><h2 id="dialog-title">Take a breather.</h2><div id="dialog-copy"></div><button id="resume" class="primary-button" type="submit">Back to the hill <span aria-hidden="true">→</span></button></form></dialog>
    <dialog id="map-dialog" aria-labelledby="map-title">
      <form method="dialog">
        <span class="eyebrow">A LITTLE FRIENDLY RIVALRY</span><h2 id="map-title" tabindex="-1">Set up a match.</h2>
        <p>Starting a new match resets both players and the battlefield. Cancel to keep playing.</p>
        <div class="opponent-options" role="radiogroup" aria-label="Opponent">
          <label class="map-option"><input type="radio" name="mode" value="solo"/><span><strong>Solo · Friendly</strong><small>You play Moss. The computer plays Ember.</small></span></label>
          <label class="map-option"><input type="radio" name="mode" value="local"/><span><strong>Two players</strong><small>Take turns on this device.</small></span></label>
        </div>
        <h3>Battlefield</h3>
        <div class="map-options" role="radiogroup" aria-label="Battlefield map">
          ${[...MAPS, ROOFTOP_MAP].map(map => {
            const points = Array.from({ length: 61 }, (_, i) => `${i * 2},${67.5 - terrainHeight(map.id, i * 20) / 10}`).join(' ');
            return `<label class="map-option" ${map.id === 'rooftops' ? 'id="rooftop-option" hidden' : ''}><input type="radio" name="map" value="${map.id}"/><svg viewBox="0 0 120 68" aria-hidden="true"><polygon points="0,68 ${points} 120,68"/></svg><span><strong>${map.name}</strong><small>${map.description}</small></span></label>`;
          }).join('')}
        </div>
        <button id="start-map" class="primary-button" type="button">Start new match <span aria-hidden="true">→</span></button>
        <button class="map-cancel" type="submit" autofocus>Cancel — keep this match</button>
      </form>
    </dialog>
  </main>`;

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>('game');
const context = canvas.getContext('2d');
if (!context) throw new Error('Skygun needs a browser with Canvas 2D support.');
const ctx = context;
const angle = el<HTMLInputElement>('angle');
const power = el<HTMLInputElement>('power');
const fireButton = el<HTMLButtonElement>('fire');
const dialog = el<HTMLDialogElement>('pause-dialog');
const result = el<HTMLDivElement>('result');
const mapDialog = el<HTMLDialogElement>('map-dialog');
const clock = new FixedClock();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let game = createGame(crypto.getRandomValues(new Uint32Array(1))[0]);
type Mode = 'local' | 'solo';
let mode: Mode = 'local';
let computer: ComputerTurn | null = null;
const computerOwnsTurn = () => mode === 'solo' && game.active === 1;
let paused = false;
let previousTime = 0;
let lastAnnouncement = '';
let lastUiKey = '';
let needsRender = true;

function announce(message: string): void {
  if (message === lastAnnouncement) return;
  el('announcement').textContent = message;
  lastAnnouncement = message;
}

function updateUI(): void {
  const robot = game.robots[game.active];
  const uiKey = [game.phase, game.turn, robot.angle, robot.power, ...game.robots.map(r => r.health), paused, mode, game.mapId].join('|');
  if (uiKey === lastUiKey) return;
  lastUiKey = uiKey;
  needsRender = true;
  document.documentElement.dataset.player = String(game.active);
  const ready = game.phase === 'aiming' && !paused && !computerOwnsTurn();
  const rooftops = game.mapId === 'rooftops';
  document.querySelector('.tagline')!.textContent = rooftops ? 'BIG APES. BANANA BUSINESS.' : 'LITTLE ROBOTS. BIG SHOTS.';
  el('fire').querySelector('span')!.innerHTML = `${rooftops ? 'Throw banana' : 'Fire shot'}<small>SPACE</small>`;
  el('mode-label').textContent = mode === 'solo' ? 'SOLO · FRIENDLY' : 'LOCAL DUEL';
  el('ember-role').textContent = mode === 'solo' ? 'CPU' : 'P2';
  el('play-hint').textContent = mode === 'solo' ? 'YOU ARE MOSS. MAKE IT COUNT.' : 'PASS THE DEVICE. KEEP THE RIVALRY.';
  el<HTMLFieldSetElement>('aim-controls').disabled = !ready;
  angle.value = String(robot.angle); power.value = String(robot.power);
  el('angle-value').textContent = `${robot.angle}°`;
  el('power-value').innerHTML = `${robot.power}<span>%</span>`;
  angle.style.setProperty('--fill', `${(robot.angle - RULES.minAngle) / (RULES.maxAngle - RULES.minAngle) * 100}%`);
  power.style.setProperty('--fill', `${(robot.power - RULES.minPower) / (RULES.maxPower - RULES.minPower) * 100}%`);
  game.robots.forEach((r, i) => {
    el(`health-${i}`).innerHTML = `${r.health} <small>HP</small>`;
    el<HTMLProgressElement>(`hp-${i}`).value = r.health;
    el(`player-${i}`).classList.toggle('active', game.active === i);
  });
  el('round').textContent = `ROUND ${String(Math.ceil(game.turn / 2)).padStart(2, '0')}`;
  const windDirection = game.wind < 0 ? 'left' : 'right';
  el('wind').textContent = game.wind === 0 ? '—  CALM' : `${game.wind < 0 ? '←' : '→'}  ${Math.abs(game.wind)} WIND`;
  el('wind').setAttribute('aria-label', game.wind === 0 ? 'Wind is calm' : `Wind ${Math.abs(game.wind)} to the ${windDirection}`);
  el('turn-number').textContent = `TURN ${String(game.turn).padStart(2, '0')} / PLAYER ${game.active + 1}`;

  let banner = `${PLAYER_NAMES[game.active].toUpperCase()}, TAKE YOUR SHOT`;
  let title = 'Make it count.';
  let hint = 'Adjust your aim, then let it fly.';
  if (game.phase === 'aiming' && computerOwnsTurn()) { banner = 'EMBER IS THINKING'; title = 'Sizing up the shot…'; hint = 'Your opponent is choosing an angle and power.'; }
  if (game.phase === 'windup') { banner = 'WINDING UP'; title = 'Here it comes…'; hint = rooftops ? 'Wind back. Let it fly.' : 'Pull back. Let it fly.'; }
  if (game.phase === 'flight') { banner = 'EYES ON THE SKY'; title = 'There it goes…'; hint = 'A good miss teaches you something.'; }
  if (game.phase === 'impact') {
    const total = game.impact!.damage[0] + game.impact!.damage[1];
    banner = total ? `${total} DAMAGE` : 'A LITTLE CLOSER NEXT TIME';
    title = total ? 'That left a mark.' : 'Finding your range.';
    hint = game.impact?.kind === 'miss' ? 'Out of bounds. Try a little less power.' : total ? game.impact!.damage.map((damage, player) => damage ? `${PLAYER_NAMES[player]} −${damage} HP` : '').filter(Boolean).join(' · ') : 'No damage. Use the last-shot marker to adjust.';
  }
  if (game.phase === 'handoff') {
    banner = `PASS TO ${PLAYER_NAMES[game.active === 0 ? 1 : 0].toUpperCase()}`;
    title = 'Over to you.'; hint = 'Pass the device to the other player.';
    if (mode === 'solo') { banner = game.active === 0 ? 'EMBER’S TURN NEXT' : 'YOUR TURN NEXT'; hint = game.active === 0 ? 'Ember will take the next shot.' : 'Get ready to aim, Moss.'; }
  }
  if (game.phase === 'settling') { banner = 'WATCH YOUR FOOTING'; title = 'Finding solid ground.'; hint = 'The next turn starts once both robots settle.'; }
  if (game.phase === 'gameover') { banner = 'THAT’S A WRAP'; title = 'Good shooting.'; hint = 'Ready for another round?'; }
  el('turn-label').textContent = banner;
  el('action-title').textContent = title;
  el('shot-hint').textContent = hint;
  const wasHidden = result.hidden;
  result.hidden = game.phase !== 'gameover';
  if (!result.hidden) {
    const heading = game.result === 'draw' ? 'A glorious draw.' : `${PLAYER_NAMES[game.result as 0 | 1]} takes the ${rooftops ? 'rooftops' : 'hill'}!`;
    el('result-title').textContent = heading;
    el('result-detail').textContent = `${game.shots.length} shots. ${Math.ceil(game.turn / 2)} rounds. One lovely rivalry.`;
    if (wasHidden) el('rematch').focus({ preventScroll: true });
    announce(heading + ' Play again for a fresh match.');
  } else if (game.phase === 'aiming') {
    announce(computerOwnsTurn() ? 'Ember is thinking. Your controls will return after its shot.' : `Player ${game.active + 1}, ${PLAYER_NAMES[game.active]}'s turn. Wind ${Math.abs(game.wind)} ${game.wind === 0 ? 'calm' : windDirection}. Moss ${game.robots[0].health} health. Ember ${game.robots[1].health} health.`);
  } else if (game.phase === 'windup') {
    announce(`${PLAYER_NAMES[game.active]} is winding up the shot.`);
  } else if (game.phase === 'impact') {
    announce(`${banner}. Moss ${game.robots[0].health} health. Ember ${game.robots[1].health} health.`);
  }
}

function shoot(): void {
  if (paused || computerOwnsTurn() || !fire(game)) return;
  clock.reset();
  updateUI();
  canvas.focus({ preventScroll: true });
}

function changeAim(): void {
  if (paused || computerOwnsTurn()) return;
  setAim(game, game.active, { angle: Number(angle.value), power: Number(power.value) });
  updateUI();
}
for (const input of [angle, power]) {
  input.addEventListener('input', changeAim);
  input.addEventListener('pointerdown', event => input.setPointerCapture(event.pointerId));
}
document.querySelectorAll<HTMLButtonElement>('.step-button').forEach(button => {
  button.addEventListener('click', () => {
    if (paused || computerOwnsTurn()) return;
    const control = button.dataset.control as 'angle' | 'power';
    setAim(game, game.active, { [control]: game.robots[game.active][control] + Number(button.dataset.step) });
    updateUI();
  });
});
fireButton.addEventListener('click', shoot);
// Handle Space on keydown and cancel native button activation to prevent held-key shots.
fireButton.addEventListener('keydown', event => {
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    if (!event.repeat) shoot();
  }
});
canvas.addEventListener('keydown', event => {
  if (paused || computerOwnsTurn()) return;
  if (event.code === 'Space') {
    event.preventDefault();
    if (!event.repeat) shoot();
    return;
  }
  const change = { ArrowLeft: ['angle', -1], ArrowRight: ['angle', 1], ArrowUp: ['power', 1], ArrowDown: ['power', -1] } as const;
  const adjustment = change[event.key as keyof typeof change];
  if (adjustment) {
    event.preventDefault();
    const [key, value] = adjustment;
    setAim(game, game.active, { [key]: game.robots[game.active][key] + value });
    updateUI();
  }
});

function pause(help = false): void {
  paused = true; clock.reset(); previousTime = 0;
  if (mapDialog.open) { updateUI(); return; }
  el('dialog-title').textContent = help ? 'A little aim. A little luck.' : 'Take a breather.';
  el('dialog-copy').innerHTML = help
    ? '<p>In Solo, you are Moss and the computer is Ember. In Two players, take turns sharing this device. Choose your opponent and map with Play.</p><ol><li><strong>Set your angle and power.</strong> Higher angles arc up; more power travels farther.</li><li><strong>Read the wind.</strong> The arrow shows where it pushes. Both players share the same wind each round.</li><li><strong>Reshape the hill.</strong> Explosions carve craters. Robots drop onto the remaining ground before the next turn. Falling is harmless unless all ground below you disappears.</li><li><strong>Fire, watch, adjust.</strong> Bring the other robot to zero health. Nearby blasts hurt too — even your own!</li></ol><p class="help-note">The dotted guide shows direction, not the whole shot. The LAST SHOT label points to your previous impact; it is not a prediction. Damage badges show health lost. Rematch restores the hill.</p>'
    : '<p>Your match is right where you left it. Resume when both players are ready.</p>';
  if (help && game.mapId === 'rooftops') el('dialog-copy').innerHTML = '<p>You found Rooftop Rivals! Two apes, one skyline, and some very questionable bananas.</p><ol><li>Set angle and power, then throw. Aim high to clear the towers.</li><li>Watch the wind and your LAST SHOT marker. Nearby blasts can hurt either ape.</li><li>Bring the other ape to zero health. Buildings stay solid in this first version.</li></ol><p>Solo and Two players both work here. Use Play to return to the tank maps.</p>';
  if (!dialog.open) dialog.showModal();
  updateUI();
}
function resume(): void {
  if (document.hidden || mapDialog.open || dialog.open) return;
  paused = false; clock.reset(); previousTime = 0;
  updateUI(); canvas.focus({ preventScroll: true });
}
el('help').addEventListener('click', () => pause(true));
el('pause').addEventListener('click', () => pause());
dialog.addEventListener('close', resume);
mapDialog.addEventListener('close', resume);
mapDialog.addEventListener('cancel', event => { if (document.hidden) event.preventDefault(); });
function openMatchSetup(): void {
  el('map-title').textContent = 'Set up a match.';
  paused = true; clock.reset(); previousTime = 0;
  mapDialog.querySelectorAll<HTMLInputElement>('input[name=map]').forEach(input => { input.checked = input.value === game.mapId; });
  mapDialog.querySelectorAll<HTMLInputElement>('input[name=mode]').forEach(input => { input.checked = input.value === mode; });
  mapDialog.showModal();
  el('map-title').focus();
  mapDialog.scrollTop = 0;
  updateUI();
}
el('maps').addEventListener('click', openMatchSetup);
el('rooftop-secret').addEventListener('click', () => {
  el('rooftop-option').hidden = false;
  openMatchSetup();
  mapDialog.querySelector<HTMLInputElement>('input[value=rooftops]')!.checked = true;
  el('map-title').textContent = 'You found Rooftop Rivals!';
});
el('start-map').addEventListener('click', () => {
  const selected = mapDialog.querySelector<HTMLInputElement>('input[name=map]:checked')!;
  mode = mapDialog.querySelector<HTMLInputElement>('input[name=mode]:checked')!.value as Mode;
  startMatch(selected.value as MapId);
  mapDialog.close();
});
dialog.addEventListener('cancel', event => {
  if (document.hidden) event.preventDefault();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', () => pause());
window.addEventListener('pageshow', () => { if (paused && !dialog.open) pause(); });
function startMatch(mapId: MapId): void {
  computer = null;
  game = createGame(crypto.getRandomValues(new Uint32Array(1))[0], mapId);
  lastUiKey = ''; lastAnnouncement = ''; clock.reset(); previousTime = 0;
  updateUI();
}
el('rematch').addEventListener('click', () => {
  startMatch(game.mapId);
  canvas.focus({ preventScroll: true });
});

function resize(): void {
  const bounds = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * dpr);
  canvas.height = Math.round(bounds.height * dpr);
  render(ctx, canvas.width, canvas.height, game, reducedMotion.matches, mode === 'solo');
}
new ResizeObserver(resize).observe(canvas);
function frame(time: number): void {
  const seconds = previousTime ? (time - previousTime) / 1000 : 0;
  if (!paused) {
    clock.advance(game, seconds);
    if (computerOwnsTurn() && game.phase === 'aiming') {
      if (!computer || computer.game !== game || computer.turn !== game.turn) computer = new ComputerTurn(game);
      const aim = computer.advance(seconds);
      if (aim) { setAim(game, game.active, aim); fire(game); clock.reset(); computer = null; }
    } else computer = null;
  }
  previousTime = time;
  updateUI();
  if (needsRender || (!paused && game.phase !== 'aiming' && game.phase !== 'gameover')) {
    render(ctx, canvas.width, canvas.height, game, reducedMotion.matches, mode === 'solo');
    needsRender = false;
  }
  requestAnimationFrame(frame);
}

// Development-only, inspectable reproduction helpers. Omitted from production builds.
declare global {
  interface Window {
    skygun?: {
      snapshot: () => Game;
      replayData: () => { seed: number; shots: ShotCommand[]; mapId: MapId };
      loadReplay: (seed: number, shots: ShotCommand[], mapId?: MapId) => void;
    };
  }
}
if (import.meta.env.DEV) {
  window.skygun = {
    snapshot: () => structuredClone(game),
    replayData: () => ({ mapId: game.mapId, seed: game.seed, shots: structuredClone(game.shots) }),
    loadReplay: (seed, shots, mapId) => {
      const restored = replay(seed, shots, mapId);
      computer = null; game = restored; lastUiKey = ''; clock.reset(); previousTime = 0;
      updateUI();
    },
  };
}
updateUI();
resize();
requestAnimationFrame(frame);
