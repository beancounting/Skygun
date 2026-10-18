import { expect, it } from 'vitest';
import { barrelDirection, carveCrater, createGame, groundAt, groundPose, poseAtTilt, resolveImpact, RULES, stepGame } from '../src/game/simulation';

function clearances(terrain: number[], x: number, y: number, tilt: number) {
  const footX = x + RULES.robotGroundOffset * Math.sin(tilt);
  const half = RULES.robotHalfWidth * Math.cos(tilt);
  const left = Math.max(0, footX - half), right = Math.min(1200, footX + half);
  const samples = [left, right];
  for (let px = Math.ceil(left); px <= Math.floor(right); px++) samples.push(px);
  return samples.map(px => y + Math.tan(tilt) * (px - x) - RULES.robotGroundOffset / Math.cos(tilt) - groundAt(terrain, px));
}

it.each([-0.4, 0, 0.4])('fits a slope %s without track penetration', slope => {
  const terrain = Array.from({length:1201}, (_,x) => 500 + slope * (x - 600));
  const pose = groundPose(terrain, 600);
  expect(pose.tilt).toBeCloseTo(Math.atan(slope), 1);
  const gaps = clearances(terrain, pose.x, pose.y, pose.tilt);
  expect(Math.min(...gaps)).toBeGreaterThan(-1e-8);
  expect(Math.min(...gaps)).toBeLessThan(1e-8);
  expect(Math.max(...gaps)).toBeLessThan(1);
});

it('leans into an asymmetric crater instead of perching upright above it', () => {
  const terrain = Array(1201).fill(160);
  carveCrater(terrain, {x:635,y:160});
  const pose = groundPose(terrain,600);
  expect(pose.tilt).toBeLessThan(-0.1);
  expect(pose.y).toBeLessThan(poseAtTilt(terrain,600,0).y - 3);
  expect(Math.abs(pose.tilt)).toBeLessThanOrEqual(35*Math.PI/180);
  expect(Math.min(...clearances(terrain,pose.x,pose.y,pose.tilt))).toBeCloseTo(0,7);
});

it('rotates while settling, keeps tracks above terrain and leaves world aiming unchanged', () => {
  const game=createGame(2026), robot=game.robots[0];
  const before=barrelDirection(robot,0), originalTilt=robot.tilt;
  resolveImpact(game,{x:robot.x+40,y:groundAt(game.terrain,robot.x+40)},'ground');
  const health=robot.health;
  while(game.phase==='impact')stepGame(game);
  let changed=false;
  for(let i=0;i<300&&game.phase==='settling';i++){
    stepGame(game);
    changed ||= Math.abs(robot.tilt-originalTilt)>0.01;
    expect(Math.min(...clearances(game.terrain,robot.x,robot.y,robot.tilt))).toBeGreaterThan(-1e-7);
  }
  expect(changed).toBe(true);expect(game.phase).toBe('handoff');
  expect(robot.health).toBe(health);
  expect(barrelDirection(robot,0)).toEqual(before);
  expect(Math.min(...clearances(game.terrain,robot.x,robot.y,robot.tilt))).toBeCloseTo(0,6);
});

it('keeps rooftop characters upright on flat buildings', () => {
  expect(createGame(2026,'rooftops').robots.map(r=>r.tilt)).toEqual([0,0]);
});
