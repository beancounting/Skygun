import { MAPS } from './maps';
import { barrelDirection, groundAt, RULES, type Game, type PlayerId, type Point } from './simulation';

const INK = '#203f37';
export const PLAYER_COLOURS = ['#3b8c79', '#d97856'] as const;
export const PLAYER_NAMES = ['Moss', 'Ember'] as const;
const screenY = (y: number) => RULES.height - y;
const terrainPaths = new WeakMap<number[], { revision: number; fill: Path2D; edge: Path2D }>();

function pathsFor(game: Game): { fill: Path2D; edge: Path2D } {
  const cached = terrainPaths.get(game.terrain);
  if (cached?.revision === game.terrainRevision) return cached;
  const fill = new Path2D();
  const edge = new Path2D();
  fill.moveTo(0, RULES.height);
  for (let x = 0; x <= RULES.width; x++) {
    const y = screenY(game.terrain[x]);
    fill.lineTo(x, y);
    if (x === 0) edge.moveTo(x, y); else edge.lineTo(x, y);
  }
  fill.lineTo(RULES.width, RULES.height); fill.closePath();
  terrainPaths.set(game.terrain, { revision: game.terrainRevision, fill, edge });
  return { fill, edge };
}

function path(ctx: CanvasRenderingContext2D, points: Point[], fill: string, close = true): void {
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  if (close) ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath();
  ctx.ellipse(0, 0, 49, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(-17, -11, 21, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(11, -17, 25, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRobot(ctx: CanvasRenderingContext2D, game: Game, player: PlayerId, reducedMotion: boolean): void {
  const robot = game.robots[player];
  const x = robot.x;
  const y = screenY(robot.y);
  const active = game.active === player && game.phase === 'aiming';
  const direction = barrelDirection(robot, player);
  const winding = game.active === player && game.phase === 'windup';
  // Pull back slowly, then release over the final 20% of the wind-up.
  const progress = winding ? Math.min(1, game.phaseTime / RULES.windupDuration) : 0;
  const pull = progress < 0.8 ? Math.sin(progress / 0.8 * Math.PI / 2) : (1 - progress) / 0.2;
  const travel = reducedMotion ? 0 : pull;
  const damaged = game.phase === 'impact' && (game.impact?.damage[player] ?? 0) > 0;
  ctx.save();
  ctx.translate(x, y);
  if (damaged && !reducedMotion) ctx.translate(Math.sin(game.phaseTime * 55) * (1 - game.phaseTime / RULES.impactDuration) * 3, 0);
  ctx.globalAlpha = robot.health === 0 ? 0.55 : 1;
  ctx.lineWidth = 3;

  // Treads, spring legs, little armoured body, and an expressive face.
  roundRect(ctx, -30, 10, 60, 18, 9, INK);
  for (const wheel of [-19, 0, 19]) {
    ctx.beginPath(); ctx.arc(wheel, 19, 5, 0, Math.PI * 2); ctx.fillStyle = '#c6d5a3'; ctx.fill();
  }
  roundRect(ctx, -19, 2, 38, 13, 4, '#f8d876', INK);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  const barrelLength = 34 - travel * 11;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(direction.x * barrelLength, -direction.y * barrelLength); ctx.stroke();
  ctx.strokeStyle = '#f4df9c'; ctx.lineWidth = 8; ctx.stroke();
  ctx.lineWidth = 3;
  roundRect(ctx, -24, -23, 48, 36, 12, PLAYER_COLOURS[player], INK);
  roundRect(ctx, -16, -15, 32, 18, 6, '#f5f1d5', INK);
  ctx.fillStyle = INK;
  if (robot.health === 0) {
    ctx.font = 'bold 19px sans-serif'; ctx.fillText('× ×', -14, 1);
  } else {
    for (const eye of [-7, 7]) {
      roundRect(ctx, eye - 2 + (player === 0 ? 2 : -2), -10, 4, damaged ? 3 : 8, 2, INK);
    }
  }
  ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.moveTo(-9, -23); ctx.lineTo(-12, -34); ctx.stroke();
  ctx.beginPath(); ctx.arc(-12, -36, 4, 0, Math.PI * 2); ctx.fillStyle = '#f8d876'; ctx.fill(); ctx.stroke();

  // A visible cocking lever mirrors with the robot's firing direction.
  const facing = player === 0 ? 1 : -1;
  const leverX = -facing * (24 + travel * 17);
  const leverY = -39 + travel * 10;
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-facing * 18, -12); ctx.lineTo(leverX, leverY); ctx.stroke();
  ctx.fillStyle = winding ? '#ffdc75' : '#f4df9c';
  ctx.beginPath(); ctx.arc(leverX, leverY, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  if (active) {
    ctx.setLineDash([4, 7]); ctx.lineWidth = 2; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.moveTo(direction.x * 48, -direction.y * 48); ctx.lineTo(direction.x * 90, -direction.y * 90); ctx.stroke();
    ctx.setLineDash([]);
    path(ctx, [{ x: -7, y: -64 }, { x: 7, y: -64 }, { x: 0, y: -56 }], INK);
  }
  ctx.textAlign = 'center'; ctx.font = 'bold 12px ui-monospace, monospace'; ctx.fillStyle = '#e3eac0';
  ctx.fillText(`P${player + 1} / ${PLAYER_NAMES[player].toUpperCase()}`, 0, 49);
  ctx.restore();
}

export function render(ctx: CanvasRenderingContext2D, width: number, height: number, game: Game, reducedMotion = false, solo = false): void {
  const scale = Math.min(width / RULES.width, height / RULES.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#e6eddb'; ctx.fillRect(0, 0, width, height);
  ctx.translate((width - RULES.width * scale) / 2, (height - RULES.height * scale) / 2);
  ctx.scale(scale, scale);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, RULES.width, RULES.height); ctx.clip();

  const sky = ctx.createLinearGradient(0, 0, 0, RULES.height);
  sky.addColorStop(0, '#dcebdc'); sky.addColorStop(0.8, '#faf0cd');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, RULES.width, RULES.height);
  ctx.fillStyle = '#f7ce70'; ctx.beginPath(); ctx.arc(925, 128, 49, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f7ce7070'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(925, 128, 63, 0, Math.PI * 2); ctx.stroke();
  cloud(ctx, 230, 100, 0.85); cloud(ctx, 710, 161, 0.6); cloud(ctx, 1060, 221, 0.72);

  // Distant hills are decorative only. The dark, grass-topped foreground is solid.
  path(ctx, [{ x: 0, y: 385 }, { x: 130, y: 278 }, { x: 228, y: 381 }, { x: 425, y: 234 },
    { x: 625, y: 425 }, { x: 836, y: 303 }, { x: 1030, y: 395 }, { x: 1160, y: 277 },
    { x: 1200, y: 313 }, { x: 1200, y: 675 }, { x: 0, y: 675 }], '#c3d8c3');
  path(ctx, [{ x: 0, y: 468 }, { x: 120, y: 387 }, { x: 293, y: 471 }, { x: 580, y: 346 },
    { x: 744, y: 452 }, { x: 1005, y: 362 }, { x: 1200, y: 454 }, { x: 1200, y: 675 }, { x: 0, y: 675 }], '#a5c3a8');

  const land = pathsFor(game);
  ctx.fillStyle = '#3c6550'; ctx.fill(land.fill);
  ctx.save(); ctx.clip(land.fill);
  ctx.strokeStyle = '#53785a'; ctx.lineWidth = 2;
  for (let row = 0; row < 4; row++) {
    ctx.beginPath();
    for (let x = 0; x <= 1200; x += 4) {
      const y = screenY(groundAt(game.terrain, x)) + 48 + row * 39 + Math.sin(x / 75 + row) * 10;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#6a855e';
  for (let i = 0; i < 64; i++) {
    const x = (i * 173 + 42) % 1200; const y = 520 + (i * 59 % 165);
    ctx.beginPath(); ctx.ellipse(x, y, i % 3 + 1.5, 1.3, 0.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.lineWidth = 7; ctx.strokeStyle = '#d6d886'; ctx.stroke(land.edge);

  for (const x of [68, 320, 450, 785, 880, 1130]) {
    const y = screenY(groundAt(game.terrain, x));
    ctx.lineWidth = 2; ctx.strokeStyle = '#618563';
    ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x - 4, y - 14); ctx.moveTo(x, y - 3); ctx.lineTo(x + 6, y - 19); ctx.stroke();
    ctx.fillStyle = '#fbdea0'; ctx.beginPath(); ctx.arc(x + 6, y - 20, 3, 0, Math.PI * 2); ctx.fill();
  }

  const previous = game.lastShots[game.active];
  if (previous && previous.kind !== 'miss' && game.phase === 'aiming') {
    ctx.strokeStyle = '#fff1bf'; ctx.lineWidth = 2;
    const x = previous.x; const y = screenY(previous.y);
    ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
  }
  drawRobot(ctx, game, 0, reducedMotion); drawRobot(ctx, game, 1, reducedMotion);

  game.trail.forEach((point, index) => {
    ctx.globalAlpha = 0.15 + index / Math.max(1, game.trail.length) * 0.65;
    ctx.fillStyle = '#fff9dc'; ctx.beginPath(); ctx.arc(point.x, screenY(point.y), 2.8, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  if (game.projectile) {
    const p = game.projectile;
    if (p.y > RULES.height - 15) {
      const x = Math.max(20, Math.min(1180, p.x));
      path(ctx, [{ x: x - 7, y: 24 }, { x, y: 15 }, { x: x + 7, y: 24 }], INK);
      ctx.fillStyle = INK; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      ctx.fillText('SHOT ABOVE', x, 41);
    } else {
      ctx.shadowColor = '#fbd98c'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#fff5c5'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, screenY(p.y), RULES.shellRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  if (game.impact && game.phase === 'impact') {
    const impact = game.impact; const progress = game.phaseTime / RULES.impactDuration;
    if (impact.kind !== 'miss') {
      ctx.globalAlpha = 1 - progress;
      const radius = reducedMotion ? 28 : 15 + Math.sin(progress * Math.PI / 2) * 49;
      ctx.fillStyle = '#ffe4a0'; ctx.strokeStyle = '#fff6da'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(impact.x, screenY(impact.y), radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    impact.damage.forEach((damage, player) => {
      if (!damage) return;
      ctx.font = 'bold 25px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = INK;
      ctx.fillText(`−${damage}`, game.robots[player].x, screenY(game.robots[player].y) - 74 - (reducedMotion ? 0 : progress * 20));
    });
  }
  ctx.textAlign = 'left'; ctx.fillStyle = '#dce4b9'; ctx.font = 'bold 12px ui-monospace, monospace';
  const map = MAPS.find(map => map.id === game.mapId)!;
  ctx.fillText(`${map.number}  /  ${map.name.toUpperCase()}`, 28, 640);
  ctx.fillStyle = '#a7bd96'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`${solo ? 'SOLO / FRIENDLY' : 'LOCAL TWO-PLAYER'}  ·  DESTRUCTIBLE TERRAIN`, 28, 660);
  ctx.restore();
}
