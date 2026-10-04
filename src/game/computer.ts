import { clamp, fire, RULES, setAim, stepGame, type Aim, type Game } from './simulation';

/** Cooperative search: every yield costs at most 64 simulation ticks. Never mutates the match. */
export function* planShot(source: Game): Generator<void, Aim> {
  const player = source.active;
  let best = { angle: 55, power: 45 }, bestScore = -Infinity;
  for (const angle of [40, 50, 60, 70]) for (let power = 24; power <= 80; power += 2) {
    const candidate = structuredClone(source);
    setAim(candidate, player, { angle, power });
    fire(candidate);
    for (let tick = 0; tick < 2000 && !['aiming', 'gameover'].includes(candidate.phase); tick++) {
      stepGame(candidate);
      if (tick % 64 === 63) yield;
    }
    const enemy = candidate.robots[1 - player];
    const damage = source.robots[1 - player].health - enemy.health;
    const selfDamage = source.robots[player].health - candidate.robots[player].health;
    const impact = candidate.lastShots[player];
    const distance = impact ? Math.hypot(impact.x - enemy.x, impact.y - enemy.y) : 2000;
    const score = damage * 10 - selfDamage * 15 - distance / 100;
    if (score > bestScore) { bestScore = score; best = { angle, power }; }
    yield;
  }
  // Reproducible, modest aim error: a friendly opponent, not a perfect-shot solver.
  let random = (source.seed ^ Math.imul(source.turn, 2654435761)) >>> 0;
  const next = () => { random = (Math.imul(random, 1664525) + 1013904223) >>> 0; return random / 0x100000000; };
  return {
    angle: clamp(best.angle + Math.round(next() * 4 - 2), RULES.minAngle, RULES.maxAngle),
    power: clamp(best.power + Math.round(next() * 6 - 3), RULES.minPower, RULES.maxPower),
  };
}

/** UI calls only while unpaused. Work and thinking time both stop on pause. */
export class ComputerTurn {
  private search: Generator<void, Aim>;
  private aim: Aim | null = null;
  private elapsed = 0;
  constructor(readonly game: Game, readonly turn = game.turn) { this.search = planShot(game); }
  advance(seconds: number): Aim | null {
    this.elapsed += Math.max(0, Math.min(seconds, 0.1));
    const deadline = performance.now() + 3;
    for (let i = 0; i < 16 && !this.aim; i++) {
      const result = this.search.next();
      if (result.done) this.aim = result.value;
      if (performance.now() >= deadline) break;
    }
    return this.elapsed >= 1 ? this.aim : null;
  }
}
