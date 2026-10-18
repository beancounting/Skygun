import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/game/maps';
import { createGame, fire, makeTerrain, replay, RULES, setAim, stepGame, groundPose, type PlayerId } from '../src/game/simulation';

for (const map of MAPS) describe(map.name, () => {
  it('starts supported, restores cratered ground and replays deterministically', () => {
    const fresh = createGame(2026, map.id);
    expect(fresh.terrain).toHaveLength(RULES.width + 1);
    expect(fresh.terrain.every(h => Number.isFinite(h) && h > 0 && h < 400)).toBe(true);
    for (const robot of fresh.robots) expect(robot.y).toBe(groundPose(fresh.terrain, robot.x + RULES.robotGroundOffset * Math.sin(robot.tilt)).y);
    const commands = [{ player: 0 as const, angle: 60, power: 45 }];
    const played = replay(2026, commands, map.id);
    expect(played).toEqual(replay(2026, commands, map.id));
    expect(played.mapId).toBe(map.id);
    played.terrain.fill(0);
    expect(createGame(2026, map.id)).toEqual(fresh);
  });

  for (const player of [0, 1] as PlayerId[]) for (const wind of [-22, 22]) {
    it(`allows player ${player + 1} to hit across the map in wind ${wind}`, () => {
      let bestDamage = 0;
      search: for (const angle of [45, 55, 65, 75]) for (let power = 25; power <= 80; power++) {
        const game = createGame(2026, map.id);
        game.active = player; game.wind = wind;
        setAim(game, player, { angle, power }); fire(game);
        for (let tick = 0; tick < 2000 && game.phase !== 'aiming' && game.phase !== 'gameover'; tick++) stepGame(game);
        expect(['aiming', 'gameover']).toContain(game.phase);
        bestDamage = Math.max(bestDamage, 100 - game.robots[1 - player].health);
        if (bestDamage >= 30) break search;
      }
      expect(bestDamage).toBeGreaterThanOrEqual(30);
    });
  }
});

it('gives the new maps distinct, symmetric starting terrain', () => {
  const divide = makeTerrain('divide'), basin = makeTerrain('basin');
  expect(divide[600]).toBeGreaterThan(divide[205] + 150);
  expect(basin[600]).toBeLessThan(basin[205] - 100);
  for (const map of [divide, basin]) for (let x = 0; x <= RULES.width; x++) expect(map[x]).toBeCloseTo(map[RULES.width - x]);
});
