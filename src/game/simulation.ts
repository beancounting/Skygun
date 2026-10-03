/** World coordinates use metres-like logical units, with y increasing upwards. */
export const RULES = {
  width: 1200,
  height: 675,
  step: 1 / 120,
  gravity: 300,
  shellRadius: 5,
  robotRadius: 24,
  blastRadius: 100,
  maxDamage: 42,
  maxFlight: 12,
  windupDuration: 0.45,
  impactDuration: 0.8,
  handoffDuration: 0.65,
  minAngle: 5,
  maxAngle: 85,
  minPower: 10,
  maxPower: 100,
} as const;

export type PlayerId = 0 | 1;
export type Phase = 'aiming' | 'windup' | 'flight' | 'impact' | 'handoff' | 'gameover';
export type Result = PlayerId | 'draw' | null;
export type Point = { x: number; y: number };
export type Aim = { angle: number; power: number };
export type Robot = Point & Aim & { health: number };
export type Projectile = Point & { vx: number; vy: number; age: number };
export type Impact = Point & { kind: 'robot' | 'ground' | 'miss'; damage: [number, number] };
export type ShotCommand = Aim & { player: PlayerId };
export type Game = {
  seed: number;
  randomState: number;
  terrain: number[];
  robots: [Robot, Robot];
  active: PlayerId;
  turn: number;
  wind: number;
  phase: Phase;
  phaseTime: number;
  projectile: Projectile | null;
  trail: Point[];
  impact: Impact | null;
  lastShots: [Impact | null, Impact | null];
  result: Result;
  shots: ShotCommand[];
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function nextWind(game: Game): number {
  game.randomState = (Math.imul(game.randomState, 1664525) + 1013904223) >>> 0;
  return Math.round((game.randomState / 0x100000000 * 2 - 1) * 22);
}

export function makeTerrain(): number[] {
  return Array.from({ length: RULES.width + 1 }, (_, x) =>
    158 + 29 * Math.sin(x / 176 + 0.5) + 70 * Math.exp(-(((x - 620) / 180) ** 2))
      + 13 * Math.sin(x / 68),
  );
}

export function groundAt(terrain: number[], x: number): number {
  const position = clamp(x, 0, terrain.length - 1);
  const left = Math.floor(position);
  return terrain[left] + ((terrain[left + 1] ?? terrain[left]) - terrain[left]) * (position - left);
}

export function createGame(seed = 2026): Game {
  const terrain = makeTerrain();
  const robot = (x: number): Robot => ({
    x, y: groundAt(terrain, x) + 26, health: 100, angle: 55, power: 52,
  });
  const game: Game = {
    seed: seed >>> 0, randomState: seed >>> 0, terrain,
    robots: [robot(205), robot(995)],
    active: 0, turn: 1, wind: 0, phase: 'aiming', phaseTime: 0,
    projectile: null, trail: [], impact: null, lastShots: [null, null], result: null, shots: [],
  };
  game.wind = nextWind(game);
  return game;
}

export function setAim(game: Game, player: PlayerId, aim: Partial<Aim>): boolean {
  if (game.phase !== 'aiming' || game.active !== player) return false;
  const robot = game.robots[player];
  if (aim.angle !== undefined && Number.isFinite(aim.angle)) {
    robot.angle = clamp(Math.round(aim.angle), RULES.minAngle, RULES.maxAngle);
  }
  if (aim.power !== undefined && Number.isFinite(aim.power)) {
    robot.power = clamp(Math.round(aim.power), RULES.minPower, RULES.maxPower);
  }
  return true;
}

export function barrelDirection(robot: Robot, player: PlayerId): Point {
  const radians = robot.angle * Math.PI / 180;
  return { x: Math.cos(radians) * (player === 0 ? 1 : -1), y: Math.sin(radians) };
}

export function fire(game: Game): boolean {
  if (game.phase !== 'aiming') return false;
  const robot = game.robots[game.active];
  game.phase = 'windup';
  game.phaseTime = 0;
  game.projectile = null;
  game.impact = null;
  game.trail = [];
  game.shots.push({ player: game.active, angle: robot.angle, power: robot.power });
  return true;
}

function launch(game: Game): void {
  const robot = game.robots[game.active];
  const direction = barrelDirection(robot, game.active);
  const speed = 240 + robot.power * 5.6;
  game.projectile = {
    x: robot.x + direction.x * 40,
    y: robot.y + direction.y * 40,
    vx: direction.x * speed, vy: direction.y * speed, age: 0,
  };
  game.phase = 'flight';
  game.phaseTime = 0;
}

export function advanceProjectile(p: Projectile, wind: number, dt: number): Projectile {
  return {
    x: p.x + p.vx * dt + wind * dt * dt / 2,
    y: p.y + p.vy * dt - RULES.gravity * dt * dt / 2,
    vx: p.vx + wind * dt,
    vy: p.vy - RULES.gravity * dt,
    age: p.age + dt,
  };
}

function circleIntersection(from: Point, to: Point, centre: Point, radius: number): number | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const ox = from.x - centre.x;
  const oy = from.y - centre.y;
  const c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (ox * dx + oy * dy);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

/** Sweep a segment at <= 1 logical unit spacing; refine the first ground hit. */
export function findCollision(game: Game, from: Point, to: Point): (Point & { kind: 'robot' | 'ground' }) | null {
  let firstT = Infinity;
  let kind: 'robot' | 'ground' = 'ground';
  for (const robot of game.robots) {
    const t = circleIntersection(from, to, robot, RULES.robotRadius + RULES.shellRadius);
    if (t !== null && t < firstT) { firstT = t; kind = 'robot'; }
  }
  const pointAt = (t: number): Point => ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
  const insideGround = (t: number): boolean => {
    const p = pointAt(t);
    // Sample across the shell's circular footprint, not just its centre.
    for (const dx of [-RULES.shellRadius, -3, 0, 3, RULES.shellRadius]) {
      const x = p.x + dx;
      const lower = p.y - Math.sqrt(RULES.shellRadius ** 2 - dx ** 2);
      if (x >= 0 && x <= RULES.width && lower <= groundAt(game.terrain, x)) return true;
    }
    return false;
  };
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (t > firstT) break;
    if (!insideGround(t)) continue;
    let low = Math.max(0, (i - 1) / steps);
    let high = t;
    for (let j = 0; j < 8; j++) {
      const mid = (low + high) / 2;
      if (insideGround(mid)) high = mid; else low = mid;
    }
    firstT = high;
    kind = 'ground';
    break;
  }
  return Number.isFinite(firstT) ? { ...pointAt(firstT), kind } : null;
}

export function blastDamage(distanceFromHull: number): number {
  return Math.round(RULES.maxDamage * Math.max(0, 1 - Math.max(0, distanceFromHull) / RULES.blastRadius));
}

export function resultFor(robots: [Robot, Robot]): Result {
  if (robots[0].health <= 0 && robots[1].health <= 0) return 'draw';
  if (robots[0].health <= 0) return 1;
  if (robots[1].health <= 0) return 0;
  return null;
}

export function resolveImpact(game: Game, point: Point, kind: Impact['kind']): void {
  const damage: [number, number] = [0, 0];
  if (kind !== 'miss') {
    game.robots.forEach((robot, index) => {
      damage[index] = Math.min(robot.health, blastDamage(Math.hypot(robot.x - point.x, robot.y - point.y) - RULES.robotRadius));
      robot.health = Math.max(0, robot.health - damage[index]);
    });
  }
  game.impact = { ...point, kind, damage };
  game.lastShots[game.active] = game.impact;
  game.result = resultFor(game.robots);
  game.projectile = null;
  game.phase = 'impact';
  game.phaseTime = 0;
}

export function stepGame(game: Game): void {
  if (game.phase === 'aiming' || game.phase === 'gameover') return;
  game.phaseTime += RULES.step;
  if (game.phase === 'windup') {
    if (game.phaseTime + 1e-10 >= RULES.windupDuration) launch(game);
  } else if (game.phase === 'flight' && game.projectile) {
    const previous = game.projectile;
    const next = advanceProjectile(previous, game.wind, RULES.step);
    const hit = findCollision(game, previous, next);
    if (hit) { resolveImpact(game, hit, hit.kind); return; }
    game.projectile = next;
    if (Math.floor(next.age / RULES.step) % 3 === 0) {
      game.trail.push({ x: next.x, y: next.y });
      if (game.trail.length > 80) game.trail.shift();
    }
    if (next.age >= RULES.maxFlight || next.x < -150 || next.x > RULES.width + 150 || next.y < -50 || next.y > 1500) {
      resolveImpact(game, { x: clamp(next.x, 0, RULES.width), y: clamp(next.y, 0, RULES.height) }, 'miss');
    }
  } else if (game.phase === 'impact' && game.phaseTime >= RULES.impactDuration) {
    game.phase = game.result !== null ? 'gameover' : 'handoff';
    game.phaseTime = 0;
  } else if (game.phase === 'handoff' && game.phaseTime >= RULES.handoffDuration) {
    game.active = game.active === 0 ? 1 : 0;
    game.turn++;
    if (game.active === 0) game.wind = nextWind(game);
    game.phase = 'aiming';
    game.phaseTime = 0;
    game.trail = [];
  }
}

/** Wall-clock adapter: no large jumps after slow/backgrounded frames. */
export class FixedClock {
  private accumulated = 0;
  advance(game: Game, seconds: number): void {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    this.accumulated += Math.min(seconds, 0.1);
    while (this.accumulated + 1e-10 >= RULES.step) {
      stepGame(game);
      this.accumulated -= RULES.step;
    }
  }
  reset(): void { this.accumulated = 0; }
}

/** Test/debug replay: no rendering, wall clock, DOM, or external services. */
export function replay(seed: number, shots: ShotCommand[]): Game {
  const game = createGame(seed);
  for (const shot of shots) {
    if (!setAim(game, shot.player, shot) || !fire(game)) throw new Error('Invalid replay turn');
    for (let tick = 0; tick < 2000 && game.phase !== 'aiming' && game.phase !== 'gameover'; tick++) stepGame(game);
    if (game.phase !== 'aiming' && game.phase !== 'gameover') throw new Error('Replay shot failed to finish');
  }
  return game;
}
