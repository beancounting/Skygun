import { describe, expect, it } from 'vitest';
import { planShot, ComputerTurn } from '../src/game/computer';
import { MAPS } from '../src/game/maps';
import { createGame, fire, setAim, stepGame, type Game } from '../src/game/simulation';

function choose(game: Game) {
  const search = planShot(game);
  for (let i = 0; i < 5000; i++) {
    const result = search.next();
    if (result.done) return result.value;
  }
  throw new Error('Computer search exceeded its work bound');
}
function shoot(game: Game) {
  setAim(game, game.active, choose(game)); fire(game);
  for (let i = 0; i < 2000 && !['aiming', 'gameover'].includes(game.phase); i++) stepGame(game);
  expect(['aiming', 'gameover']).toContain(game.phase);
}

describe('friendly computer', () => {
  it('is deterministic and never changes the source match or wind generator', () => {
    const game = createGame(2026), before = structuredClone(game);
    expect(choose(game)).toEqual(choose(game));
    expect(game).toEqual(before);
  });
  it('waits before releasing a shot, even when the search is finished', () => {
    const turn = new ComputerTurn(createGame(2026));
    for (let i = 0; i < 400; i++) expect(turn.advance(0)).toBeNull();
    let aim = null;
    for (let i = 0; i < 1000 && !aim; i++) aim = turn.advance(0.1);
    expect(aim).not.toBeNull();
  });
  for (const map of MAPS) for (const seed of [2026, 7, 99]) {
    it(`finishes a bounded match on ${map.name}, seed ${seed}, as terrain changes`, () => {
      const game = createGame(seed, map.id);
      for (let turn = 0; turn < 40 && game.phase !== 'gameover'; turn++) shoot(game);
      expect(game.phase).toBe('gameover');
      expect(game.terrainRevision).toBeGreaterThan(0);
      expect(game.shots.every(s => s.angle >= 5 && s.angle <= 85 && s.power >= 10 && s.power <= 100)).toBe(true);
    });
  }
  for (const map of MAPS) for (const wind of [-22, 22]) {
    it(`makes useful opening shots on ${map.name} in wind ${wind}`, () => {
      let damage = 0;
      for (const seed of [7, 99, 2026]) {
        const game = createGame(seed, map.id); game.active = 1; game.wind = wind;
        shoot(game); damage += 100 - game.robots[0].health;
        expect(game.robots[1].health).toBe(100);
      }
      expect(damage).toBeGreaterThan(25);
    });
  }
});
