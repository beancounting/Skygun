import { BUILDING_HEIGHTS } from './maps';
import { barrelDirection, RULES, type Game, type PlayerId } from './simulation';

const INK = '#28384e';
export function drawCity(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, 675);
  sky.addColorStop(0, '#b9c5dc'); sky.addColorStop(1, '#f6d6ad');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 1200, 675);
  ctx.fillStyle = '#fff0c5'; ctx.beginPath(); ctx.arc(945, 105, 43, 0, Math.PI * 2); ctx.fill();
  // Distant silhouettes are decorative; the outlined foreground towers are solid.
  for (let i = 0; i < 18; i++) {
    const height = 160 + (i * 79 % 190);
    ctx.fillStyle = '#929db4'; ctx.fillRect(i * 73, 675 - height, 65, height);
  }
  BUILDING_HEIGHTS.forEach((height, i) => {
    const x = i * 100, y = RULES.height - height;
    ctx.fillStyle = ['#566879', '#647789', '#495e72'][i % 3]; ctx.fillRect(x, y, 100, height);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, 98, height);
    ctx.fillStyle = '#f5d6ae'; ctx.fillRect(x, y, 100, 6);
    for (let row = 0; row < Math.floor((height - 35) / 30); row++) for (let col = 0; col < 3; col++) {
      ctx.fillStyle = (row + col + i) % 4 === 0 ? '#35485f' : '#e7c88f';
      ctx.fillRect(x + 15 + col * 27, y + 22 + row * 30, 13, 17);
    }
  });
}

export function drawBanana(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, size = 1): void {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(size, size);
  ctx.beginPath(); ctx.moveTo(-10, -7); ctx.quadraticCurveTo(1, 8, 13, -5);
  ctx.quadraticCurveTo(5, 20, -10, -7); ctx.fillStyle = '#ffe16b'; ctx.fill();
  ctx.strokeStyle = '#765326'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}

export function drawApe(ctx: CanvasRenderingContext2D, game: Game, player: PlayerId, reducedMotion: boolean): void {
  const ape = game.robots[player], facing = player === 0 ? 1 : -1;
  const direction = barrelDirection(ape, player);
  const winding = game.active === player && game.phase === 'windup';
  const progress = winding ? Math.min(1, game.phaseTime / RULES.windupDuration) : 0;
  const pull = reducedMotion ? 0 : Math.sin(progress * Math.PI);
  ctx.save(); ctx.translate(ape.x, RULES.height - ape.y);
  ctx.globalAlpha = ape.health <= 0 ? 0.55 : 1;
  const fur = player === 0 ? '#594b43' : '#785344';
  const oval = (x: number, y: number, rx: number, ry: number, fill: string) => {
    ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  };
  oval(-16, 20, 13, 8, fur); oval(16, 20, 13, 8, fur);
  oval(0, 0, 25, 25, fur); oval(0, 5, 15, 16, '#b89570');
  ctx.lineCap = 'round'; ctx.strokeStyle = fur; ctx.lineWidth = 15;
  ctx.beginPath(); ctx.moveTo(-facing * 20, -8); ctx.lineTo(-facing * 32, 15); ctx.stroke();
  const handX = facing * (31 - pull * 47), handY = -22 - pull * 30;
  ctx.beginPath(); ctx.moveTo(facing * 18, -12); ctx.lineTo(handX, handY); ctx.stroke();
  oval(handX, handY, 8, 8, '#b89570');
  if (game.active === player && ['aiming', 'windup'].includes(game.phase)) drawBanana(ctx, handX, handY - 10, -facing * 0.4, 0.8);
  oval(-18, -31, 7, 8, fur); oval(18, -31, 7, 8, fur);
  oval(0, -30, 20, 19, fur); oval(0, -27, 15, 12, '#d7b48a');
  ctx.fillStyle = INK;
  if (ape.health <= 0) { ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('× ×', 0, -27); }
  else for (const eye of [-6, 6]) { ctx.beginPath(); ctx.arc(eye, -32, 2.4, 0, Math.PI * 2); ctx.fill(); }
  ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-5, -22); ctx.lineTo(5, -22); ctx.stroke();
  ctx.fillStyle = player === 0 ? '#64bea3' : '#f19a72'; ctx.fillRect(-17, -13, 34, 6);
  if (game.active === player && game.phase === 'aiming') {
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.setLineDash([4, 7]);
    ctx.beginPath(); ctx.moveTo(direction.x * 48, -direction.y * 48); ctx.lineTo(direction.x * 90, -direction.y * 90); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.textAlign = 'center'; ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#fff0cf';
  ctx.fillText(player === 0 ? 'P1 / MOSS' : 'P2 / EMBER', 0, 48);
  ctx.restore();
}
