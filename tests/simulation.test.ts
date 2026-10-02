import { describe, expect, it } from 'vitest';
import {
  advanceProjectile, blastDamage, createGame, findCollision, fire, FixedClock, groundAt,
  replay, resolveImpact, resultFor, RULES, setAim, stepGame, type Game,
} from '../src/game/simulation';

function finishShot(game: Game): void {
  for (let i = 0; i < 2000 && game.phase !== 'aiming' && game.phase !== 'gameover'; i++) stepGame(game);
  expect(['aiming', 'gameover']).toContain(game.phase);
}

describe('projectile physics', () => {
  it('matches the analytic gravity/wind solution', () => {
    const start = { x: 20, y: 300, vx: 100, vy: 200, age: 0 };
    const next = advanceProjectile(start, -10, 0.5);
    expect(next.x).toBeCloseTo(68.75);
    expect(next.y).toBeCloseTo(362.5);
    expect(next.vx).toBe(95);
    expect(next.vy).toBe(50);
    expect(start.age).toBe(0);
  });

  it('produces the same fixed-step result at 30, 60 and 144 rendering fps', () => {
    const snapshots = [30, 60, 144].map(fps => {
      const game = createGame(123);
      fire(game);
      const clock = new FixedClock();
      for (let i = 0; i < fps * 2; i++) clock.advance(game, 1 / fps);
      return game;
    });
    expect(snapshots[0]).toEqual(snapshots[1]);
    expect(snapshots[1]).toEqual(snapshots[2]);
  });

  it('caps catch-up after a long interruption', () => {
    const game = createGame(); fire(game);
    const clock = new FixedClock(); clock.advance(game, 120);
    expect(game.projectile!.age).toBeCloseTo(0.1);
    clock.reset(); clock.advance(game, Number.NaN);
    expect(game.projectile!.age).toBeCloseTo(0.1);
  });

  it('uses seeded wind and identical winds for both turns of each round', () => {
    const game = createGame(3);
    expect(createGame(3).wind).toBe(game.wind);
    const firstWind = game.wind;
    fire(game); finishShot(game);
    expect(game.active).toBe(1); expect(game.wind).toBe(firstWind);
    fire(game); finishShot(game);
    expect(game.turn).toBe(3); expect(game.active).toBe(0);
    expect(game.randomState).not.toBe(createGame(3).randomState);
    expect(Math.abs(game.wind)).toBeLessThanOrEqual(22);
  });
});

describe('swept collision', () => {
  it('detects a robot even when neither segment endpoint touches it', () => {
    const game = createGame(); game.terrain.fill(0);
    const robot = game.robots[1];
    const hit = findCollision(game, { x: robot.x - 100, y: robot.y }, { x: robot.x + 100, y: robot.y });
    expect(hit?.kind).toBe('robot');
    expect(hit?.x).toBeCloseTo(robot.x - RULES.robotRadius - RULES.shellRadius);
  });

  it('detects a one-sample ridge between high-speed endpoints', () => {
    const game = createGame(); game.terrain.fill(0); game.terrain[600] = 450;
    const hit = findCollision(game, { x: 500, y: 400 }, { x: 700, y: 400 });
    expect(hit?.kind).toBe('ground');
    expect(hit!.x).toBeLessThan(600);
  });

  it('selects the first hit, so ground blocks a robot behind it', () => {
    const game = createGame(); game.terrain.fill(0);
    game.terrain[600] = 500;
    game.robots[1] = { ...game.robots[1], x: 700, y: 300 };
    expect(findCollision(game, { x: 500, y: 300 }, { x: 800, y: 300 })?.kind).toBe('ground');
  });

  it('accounts for the projectile radius above a flat surface', () => {
    const game = createGame(); game.terrain.fill(100);
    expect(findCollision(game, { x: 500, y: 104 }, { x: 600, y: 104 })?.kind).toBe('ground');
    expect(findCollision(game, { x: 500, y: 106 }, { x: 600, y: 106 })).toBeNull();
  });

  it('does not treat off-map air as ground', () => {
    const game = createGame();
    expect(findCollision(game, { x: -100, y: 200 }, { x: -90, y: 100 })).toBeNull();
  });

  it('interpolates terrain samples consistently', () => {
    expect(groundAt([100, 120], 0.25)).toBe(105);
    expect(groundAt([100, 120], -10)).toBe(100);
    expect(groundAt([100, 120], 99)).toBe(120);
  });
});

describe('damage and results', () => {
  it('has bounded damage and falloff at the explosion boundary', () => {
    expect(blastDamage(-10)).toBe(42);
    expect(blastDamage(0)).toBe(42);
    expect(blastDamage(50)).toBe(21);
    expect(blastDamage(100)).toBe(0);
    expect(blastDamage(101)).toBe(0);
  });

  it('damages the shooter too, without negative health', () => {
    const game = createGame(); game.robots[0].health = 10;
    resolveImpact(game, game.robots[0], 'robot');
    expect(game.robots[0].health).toBe(0);
    expect(game.impact!.damage).toEqual([10, 0]);
    expect(game.result).toBe(1);
    finishShot(game); expect(game.phase).toBe('gameover');
  });

  it('resolves simultaneous defeat as a draw', () => {
    const game = createGame();
    game.robots[1].x = game.robots[0].x + 20;
    game.robots[1].y = game.robots[0].y;
    game.robots.forEach(robot => { robot.health = 5; });
    resolveImpact(game, game.robots[0], 'ground');
    expect(game.impact!.damage).toEqual([5, 5]);
    expect(game.result).toBe('draw');
    finishShot(game); expect(game.phase).toBe('gameover');
  });

  it('never damages robots on a miss', () => {
    const game = createGame();
    resolveImpact(game, game.robots[0], 'miss');
    expect(game.robots.map(r => r.health)).toEqual([100, 100]);
    expect(resultFor(game.robots)).toBeNull();
  });
});

describe('turn commands and completion', () => {
  it('gates aim by turn, clamps valid input and rejects nonfinite values', () => {
    const game = createGame();
    expect(setAim(game, 1, { power: 80 })).toBe(false);
    setAim(game, 0, { angle: 200, power: -5 });
    expect(game.robots[0].angle).toBe(85); expect(game.robots[0].power).toBe(10);
    setAim(game, 0, { angle: NaN, power: Infinity });
    expect(game.robots[0].angle).toBe(85); expect(game.robots[0].power).toBe(10);
  });

  it('rejects duplicate fire and aim adjustments throughout flight', () => {
    const game = createGame();
    expect(fire(game)).toBe(true); expect(fire(game)).toBe(false);
    expect(setAim(game, 0, { power: 100 })).toBe(false);
    expect(game.shots).toHaveLength(1);
    finishShot(game);
    expect(game.active).toBe(1); expect(game.turn).toBe(2);
  });

  it('retains individual aim settings after a full round', () => {
    const game = createGame();
    setAim(game, 0, { angle: 70, power: 20 }); fire(game); finishShot(game);
    setAim(game, 1, { angle: 60, power: 25 }); fire(game); finishShot(game);
    expect(game.robots[0].angle).toBe(70); expect(game.robots[0].power).toBe(20);
    expect(game.robots[1].angle).toBe(60); expect(game.robots[1].power).toBe(25);
  });

  it.each([
    { x: 1349, y: 600, vx: 1000, vy: 0, age: 0 },
    { x: -149, y: 600, vx: -1000, vy: 0, age: 0 },
    { x: 600, y: 600, vx: 0, vy: 0, age: 12 },
    { x: 600, y: 1499, vx: 0, vy: 1000, age: 0 },
  ])('finishes boundary/timeout shots %#', projectile => {
    const game = createGame(); fire(game); game.projectile = projectile;
    stepGame(game); expect(game.impact!.kind).toBe('miss');
    finishShot(game); expect(game.phase).toBe('aiming');
  });

  it('terminates extreme legal angle/power combinations from both sides', () => {
    for (const player of [0, 1] as const) {
      for (const angle of [5, 45, 85]) for (const power of [10, 100]) {
        const game = createGame(17); game.active = player;
        setAim(game, player, { angle, power }); fire(game); finishShot(game);
        expect(game.turn).toBe(2);
      }
    }
  });

  it('replays a seed and shot log exactly and rejects invalid ordering', () => {
    const game = createGame(42);
    setAim(game, 0, { angle: 60, power: 40 }); fire(game); finishShot(game);
    setAim(game, 1, { angle: 65, power: 30 }); fire(game); finishShot(game);
    expect(replay(game.seed, game.shots)).toEqual(game);
    expect(() => replay(42, [{ player: 1, angle: 45, power: 50 }])).toThrow('Invalid replay turn');
  });

  it('leaves fixed terrain untouched and creates an independent fresh match', () => {
    const game = createGame(); const terrain = [...game.terrain];
    fire(game); finishShot(game);
    expect(game.terrain).toEqual(terrain);
    const fresh = createGame();
    expect(fresh.robots.map(r => r.health)).toEqual([100, 100]);
    expect(fresh.shots).toEqual([]); expect(fresh.lastShots).toEqual([null, null]);
    expect(fresh.phase).toBe('aiming'); expect(fresh.turn).toBe(1);
    fresh.robots[0].health = 1;
    expect(game.robots[0].health).not.toBe(1);
  });
});
