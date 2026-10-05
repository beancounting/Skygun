import { expect, it } from 'vitest';
import { planShot } from '../src/game/computer';
import { createGame, findCollision, fire, replay, resolveImpact, setAim, stepGame, supportAt } from '../src/game/simulation';

it('supports rooftop spawns and collides with building walls', () => {
 const game = createGame(2026, 'rooftops');
 expect(game.robots.map(r => r.x)).toEqual([250, 950]);
 for(const r of game.robots) expect(r.y).toBe(supportAt(game.terrain, r.x) + 28);
 expect(findCollision(game, {x:285,y:300}, {x:320,y:300})?.kind).toBe('ground');
 const terrain = [...game.terrain];
 resolveImpact(game, {x:250,y:260}, 'robot');
 expect(game.robots[0].health).toBeLessThan(100);
 expect(game.terrain).toEqual(terrain); expect(game.terrainRevision).toBe(0);
});
for(const seed of [7,99,2026]) it(`finishes a reproducible rooftop duel, seed ${seed}`, () => {
 const game = createGame(seed, 'rooftops');
 for(let shot=0;shot<40 && game.phase!=='gameover';shot++) {
  const search=planShot(game);let found=false;
  for(let work=0;work<5000;work++) {
   const next=search.next();if(next.done){setAim(game,game.active,next.value);found=true;break;}
  }
  expect(found).toBe(true);fire(game);
  for(let tick=0;tick<2000&&!['aiming','gameover'].includes(game.phase);tick++)stepGame(game);
 }
 expect(game.phase).toBe('gameover');expect(game.terrainRevision).toBe(0);
 expect(replay(seed,game.shots,'rooftops')).toEqual(game);
});
