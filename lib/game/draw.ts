import { SPARK_R, VIEW_H, VIEW_W, WORLD_W } from "./constants";
import { PLATFORMS } from "./level";
import type { GameState, Platform, Player, Snake } from "./types";

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  fonts: { title: string; body: string },
) {
  const shakeX = state.shake ? (hash(state.time * 40) - 0.5) * state.shake * 2 : 0;
  const shakeY = state.shake ? (hash(state.time * 40 + 9) - 0.5) * state.shake * 2 : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);

  const cam = state.cameraX;
  drawSky(ctx);
  drawSun(ctx, cam);
  drawFarHills(ctx, cam);
  drawTreeLayer(ctx, cam, 0.18, 0.55, 26, 1);
  drawTreeLayer(ctx, cam, 0.38, 0.78, 18, 2);
  drawGroundWash(ctx, cam);
  drawPlatforms(ctx, cam);
  drawDecor(ctx, cam, state.time);
  drawSparks(ctx, state, cam);
  drawSnakes(ctx, state, cam);
  drawLantern(ctx, state, cam);
  drawFox(ctx, state.player, cam, state.time, state.phase === "hurt");
  drawParticles(ctx, state, cam);
  drawTreeLayer(ctx, cam, 1.05, 1, 10, 3);
  drawVignette(ctx);
  ctx.restore();
  drawHud(ctx, state, fonts);
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: number,
) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - cam, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSky(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, "#1a102c");
  g.addColorStop(0.28, "#4a2150");
  g.addColorStop(0.52, "#c24e3c");
  g.addColorStop(0.74, "#ee8b45");
  g.addColorStop(1, "#f6d39a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawSun(ctx: CanvasRenderingContext2D, cam: number) {
  const x = VIEW_W * 0.74 - cam * 0.03;
  const y = VIEW_H * 0.4;
  const glow = ctx.createRadialGradient(x, y, 10, x, y, 160);
  glow.addColorStop(0, "rgba(255, 220, 140, 0.95)");
  glow.addColorStop(0.18, "rgba(255, 170, 80, 0.55)");
  glow.addColorStop(1, "rgba(255, 120, 60, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - 160, y - 160, 320, 320);
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.fill();
}

function drawFarHills(ctx: CanvasRenderingContext2D, cam: number) {
  ctx.fillStyle = "#3a2048";
  ctx.beginPath();
  ctx.moveTo(-40, VIEW_H);
  for (let i = 0; i <= 12; i++) {
    const x = i * 110 - (cam * 0.08) % 110;
    const y = 290 + Math.sin(i * 0.9) * 28 + (i % 3) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W + 40, VIEW_H);
  ctx.fill();

  ctx.fillStyle = "#4a2a3a";
  ctx.beginPath();
  ctx.moveTo(-40, VIEW_H);
  for (let i = 0; i <= 14; i++) {
    const x = i * 96 - (cam * 0.14) % 96;
    const y = 340 + Math.cos(i * 1.1) * 22;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W + 40, VIEW_H);
  ctx.fill();
}

function pine(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  color: string,
) {
  ctx.fillStyle = "#2a1a18";
  ctx.fillRect(x - 3 * scale, baseY - 18 * scale, 6 * scale, 18 * scale);
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const top = baseY - (70 - i * 16) * scale;
    const w = (22 + i * 10) * scale;
    const y = baseY - (22 - i * 8) * scale;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x - w, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawTreeLayer(
  ctx: CanvasRenderingContext2D,
  cam: number,
  parallax: number,
  alpha: number,
  count: number,
  layer: number,
) {
  ctx.globalAlpha = alpha;
  const span = WORLD_W + VIEW_W;
  for (let i = 0; i < count * 8; i++) {
    const seed = hash(i * 17 + layer * 91);
    const worldX = seed * span - 80;
    const x = worldX - cam * parallax;
    if (x < -80 || x > VIEW_W + 80) continue;
    const scale = 0.7 + hash(i + layer * 3) * (layer === 3 ? 1.1 : 0.7);
    const base = layer === 3 ? VIEW_H - 8 : VIEW_H * (0.72 + layer * 0.04);
    const color =
      layer === 1 ? "#2b1830" : layer === 2 ? "#241c22" : "#1a1410";
    pine(ctx, x, base, scale, color);
  }
  ctx.globalAlpha = 1;
}

function drawGroundWash(ctx: CanvasRenderingContext2D, cam: number) {
  const g = ctx.createLinearGradient(0, 430, 0, VIEW_H);
  g.addColorStop(0, "rgba(80, 40, 28, 0)");
  g.addColorStop(1, "rgba(40, 18, 14, 0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 420, VIEW_W, VIEW_H - 420);
  void cam;
}

function roundPlat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawPlatforms(ctx: CanvasRenderingContext2D, cam: number) {
  for (const p of PLATFORMS) {
    const x = p.x - cam;
    if (x + p.w < -20 || x > VIEW_W + 20) continue;
    if (p.kind === "ground" || p.kind === "hill") {
      drawSolidGround(ctx, p, x);
    } else {
      drawFloating(ctx, p, x);
    }
  }
}

function drawSolidGround(ctx: CanvasRenderingContext2D, p: Platform, x: number) {
  const dirt = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
  dirt.addColorStop(0, "#5a3a22");
  dirt.addColorStop(0.18, "#3d2718");
  dirt.addColorStop(1, "#24160f");
  ctx.fillStyle = dirt;
  ctx.fillRect(x, p.y, p.w, p.h + 40);
  ctx.fillStyle = "#3f6a32";
  ctx.fillRect(x, p.y - 6, p.w, 10);
  ctx.fillStyle = "#6a9a44";
  ctx.fillRect(x, p.y - 8, p.w, 5);
  for (let gx = 0; gx < p.w; gx += 18) {
    const n = hash(p.x + gx);
    ctx.fillStyle = n > 0.55 ? "#8bb85a" : "#4d7a38";
    ctx.beginPath();
    ctx.ellipse(x + gx + 6, p.y - 6, 5 + n * 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFloating(ctx: CanvasRenderingContext2D, p: Platform, x: number) {
  ctx.fillStyle = p.kind === "log" ? "#6b4228" : "#6a5a52";
  roundPlat(ctx, x, p.y, p.w, p.h + 4, 6);
  ctx.fill();
  ctx.fillStyle = p.kind === "log" ? "#8a5a34" : "#8a7a70";
  ctx.fillRect(x + 4, p.y + 3, p.w - 8, 4);
  ctx.fillStyle = "#5d8a3e";
  ctx.fillRect(x + 2, p.y - 5, p.w - 4, 7);
  ctx.fillStyle = "#8fbf5c";
  ctx.fillRect(x + 4, p.y - 7, p.w - 8, 4);
}

function drawDecor(ctx: CanvasRenderingContext2D, cam: number, time: number) {
  for (let i = 0; i < 40; i++) {
    const wx = 40 + hash(i * 13) * (WORLD_W - 80);
    const x = wx - cam;
    if (x < -10 || x > VIEW_W + 10) continue;
    const plat = PLATFORMS.find(
      (p) => wx >= p.x + 8 && wx <= p.x + p.w - 8 && (p.kind === "ground" || p.kind === "hill"),
    );
    if (!plat) continue;
    ctx.fillStyle = i % 3 === 0 ? "#c45c4a" : "#d8d0c4";
    ctx.beginPath();
    ctx.ellipse(x, plat.y - 5, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a6a32";
    ctx.fillRect(x - 1, plat.y - 14, 2, 10);
  }

  for (let i = 0; i < 28; i++) {
    const wx = hash(i * 21 + 4) * WORLD_W;
    const x = wx - cam;
    const y = 70 + hash(i * 8) * 220 + Math.sin(time * 0.8 + i) * 8;
    if (x < 0 || x > VIEW_W) continue;
    ctx.globalAlpha = 0.25 + Math.sin(time * 2 + i) * 0.15;
    ctx.fillStyle = "#ffe9a0";
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSparks(ctx: CanvasRenderingContext2D, state: GameState, cam: number) {
  for (const s of state.sparks) {
    if (s.taken) continue;
    const x = s.x - cam;
    const y = s.y + Math.sin(s.bob) * 5;
    if (x < -20 || x > VIEW_W + 20) continue;
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 22);
    glow.addColorStop(0, "rgba(255, 236, 170, 0.95)");
    glow.addColorStop(0.4, "rgba(255, 180, 70, 0.45)");
    glow.addColorStop(1, "rgba(255, 140, 40, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff6c8";
    ctx.beginPath();
    ctx.arc(x, y, SPARK_R * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 230, 140, 0.9)";
    ctx.lineWidth = 1.4;
    const arm = 11 + Math.sin(s.bob * 2) * 2;
    ctx.beginPath();
    ctx.moveTo(x - arm, y);
    ctx.lineTo(x + arm, y);
    ctx.moveTo(x, y - arm);
    ctx.lineTo(x, y + arm);
    ctx.stroke();
  }
}

function drawSnakes(ctx: CanvasRenderingContext2D, state: GameState, cam: number) {
  for (const snake of state.snakes) {
    if (!snake.alive) continue;
    const x = snake.x - cam;
    if (x < -40 || x > VIEW_W + 40) continue;
    drawSnake(ctx, snake, x, state.time);
  }
}

function drawSnake(ctx: CanvasRenderingContext2D, snake: Snake, x: number, time: number) {
  ctx.save();
  ctx.translate(x + snake.w / 2, snake.y + snake.h);
  ctx.scale(snake.dir, 1);
  const wave = Math.sin(snake.anim) * 2;
  ctx.fillStyle = "#2f4a28";
  ctx.beginPath();
  ctx.ellipse(0, -7 + wave * 0.2, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c9b45a";
  ctx.beginPath();
  ctx.ellipse(2, -5, 12, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3d6234";
  ctx.beginPath();
  ctx.ellipse(14, -10, 8, 6.5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0e38a";
  ctx.beginPath();
  ctx.arc(17, -12, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a120c";
  ctx.beginPath();
  ctx.arc(17.4, -12, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d45c5c";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(21, -9);
  ctx.lineTo(26, -11 - Math.sin(time * 10) * 1.5);
  ctx.lineTo(21, -8);
  ctx.stroke();
  ctx.restore();
}

function drawLantern(ctx: CanvasRenderingContext2D, state: GameState, cam: number) {
  const L = state.lantern;
  const x = L.x - cam;
  const y = L.y;
  if (x < -40 || x > VIEW_W + 40) return;

  if (L.glow > 0.05) {
    const g = ctx.createRadialGradient(x + 8, y - 48, 4, x + 8, y - 48, 90 + L.glow * 80);
    g.addColorStop(0, `rgba(255, 210, 120, ${0.55 * L.glow})`);
    g.addColorStop(0.4, `rgba(255, 150, 60, ${0.18 * L.glow})`);
    g.addColorStop(1, "rgba(255, 120, 40, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + 8, y - 48, 90 + L.glow * 80, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#4a2e1c";
  ctx.fillRect(x + 5, y - 38, 6, 38);
  ctx.fillStyle = "#6b4228";
  ctx.fillRect(x - 4, y - 64, 24, 28);
  ctx.fillStyle = L.lit ? "#ffe08a" : "#6a7a88";
  ctx.globalAlpha = L.lit ? 0.85 : 0.35;
  ctx.fillRect(x - 1, y - 60, 18, 20);
  ctx.globalAlpha = 1;
  if (L.lit) {
    ctx.fillStyle = "#ff9f3c";
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 42);
    ctx.quadraticCurveTo(x + 2, y - 54, x + 8, y - 58);
    ctx.quadraticCurveTo(x + 14, y - 54, x + 8, y - 42);
    ctx.fill();
  }
  ctx.fillStyle = "#3a2416";
  ctx.fillRect(x - 6, y - 66, 28, 5);
  ctx.fillRect(x - 6, y - 40, 28, 4);
}

function drawFox(
  ctx: CanvasRenderingContext2D,
  p: Player,
  cam: number,
  time: number,
  hurt: boolean,
) {
  const x = p.x - cam + p.w / 2;
  const y = p.y + p.h;
  if (x < -40 || x > VIEW_W + 40) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.facing, 1);
  if (hurt && Math.floor(time * 20) % 2 === 0) ctx.globalAlpha = 0.45;

  const run = p.grounded && Math.abs(p.vx) > 30;
  const hop = !p.grounded;
  const phase = run ? p.anim : time * 3;
  const leg = Math.sin(phase) * (run ? 5 : 0);
  const bob = run ? Math.abs(Math.sin(phase)) * 1.5 : Math.sin(time * 2) * 0.6;
  const tail = Math.sin(phase * 0.9) * (run ? 8 : 4);

  ctx.fillStyle = "#d86b32";
  ctx.beginPath();
  ctx.ellipse(-16, -18 + bob + tail * 0.05, 13, 7, -0.6 + tail * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f3d7a4";
  ctx.beginPath();
  ctx.ellipse(-26, -16 + bob + tail * 0.05, 5, 3.4, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e07a3d";
  ctx.beginPath();
  ctx.ellipse(-1, -15 + bob, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7e2c0";
  ctx.beginPath();
  ctx.ellipse(2, -12 + bob, 7, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3a2218";
  ctx.fillRect(-8 + leg * 0.3, -8, 4, hop ? 5 : 8 + leg * 0.15);
  ctx.fillRect(2 - leg * 0.3, -8, 4, hop ? 5 : 8 - leg * 0.15);

  ctx.fillStyle = "#e07a3d";
  ctx.beginPath();
  ctx.ellipse(10, -24 + bob, 9, 8, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7e2c0";
  ctx.beginPath();
  ctx.ellipse(13, -21 + bob, 5, 4, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e07a3d";
  ctx.beginPath();
  ctx.moveTo(6, -30 + bob);
  ctx.lineTo(4, -40 + bob);
  ctx.lineTo(11, -31 + bob);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, -30 + bob);
  ctx.lineTo(16, -40 + bob);
  ctx.lineTo(18, -29 + bob);
  ctx.fill();
  ctx.fillStyle = "#2a1810";
  ctx.beginPath();
  ctx.moveTo(5, -36 + bob);
  ctx.lineTo(4, -40 + bob);
  ctx.lineTo(8, -35 + bob);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(15, -36 + bob);
  ctx.lineTo(16, -40 + bob);
  ctx.lineTo(18, -34 + bob);
  ctx.fill();

  ctx.fillStyle = "#2a1810";
  ctx.beginPath();
  ctx.arc(13, -26 + bob, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(13.5, -26.5 + bob, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a1810";
  ctx.beginPath();
  ctx.ellipse(19, -21 + bob, 1.4, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(
    VIEW_W / 2,
    VIEW_H / 2,
    VIEW_H * 0.2,
    VIEW_W / 2,
    VIEW_H / 2,
    VIEW_W * 0.72,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(20, 8, 12, 0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  fonts: { title: string; body: string },
) {
  ctx.fillStyle = "rgba(20, 10, 14, 0.42)";
  roundRect(ctx, 16, 14, 228, 64, 14);
  ctx.fill();
  ctx.fillStyle = "#f7e2c0";
  ctx.font = `700 16px ${fonts.body}`;
  ctx.fillText(`Искры  ${state.collected} / ${state.totalSparks}`, 28, 40);
  for (let i = 0; i < 3; i++) {
    drawLife(ctx, 36 + i * 28, 58, i < state.lives);
  }

  if (state.hintTimer > 0 && state.hintText) {
    ctx.globalAlpha = Math.min(1, state.hintTimer * 2);
    ctx.fillStyle = "rgba(20, 10, 14, 0.55)";
    const w = 420;
    roundRect(ctx, (VIEW_W - w) / 2, 92, w, 40, 12);
    ctx.fill();
    ctx.fillStyle = "#ffe9c4";
    ctx.font = `600 16px ${fonts.body}`;
    ctx.textAlign = "center";
    ctx.fillText(state.hintText, VIEW_W / 2, 118);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  if (state.phase === "title") drawTitle(ctx, fonts, state);
  if (state.phase === "paused") drawCenterCard(ctx, fonts, "Пауза", "P или Esc — продолжить · R — заново");
  if (state.phase === "dead") {
    drawCenterCard(
      ctx,
      fonts,
      "Жизни кончились",
      "Нажмите R, чтобы начать заново",
    );
  }
  if (state.phase === "win") {
    drawCenterCard(
      ctx,
      fonts,
      "Фонарь зажжён",
      "Лес снова светится. R — ещё один закат",
    );
  }
}

function drawLife(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = on ? "#e07a3d" : "rgba(240, 210, 170, 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4, -5);
  ctx.lineTo(-6, -11);
  ctx.lineTo(0, -6);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, -5);
  ctx.lineTo(6, -11);
  ctx.lineTo(6, -4);
  ctx.fill();
  ctx.restore();
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  fonts: { title: string; body: string },
  state: GameState,
) {
  ctx.fillStyle = "rgba(12, 6, 10, 0.28)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe7c2";
  ctx.font = `700 44px ${fonts.title}`;
  ctx.fillText("Лисёнок в лесу", VIEW_W / 2, 150);
  ctx.font = `500 18px ${fonts.body}`;
  ctx.fillStyle = "#f4c78a";
  ctx.fillText("Собери искры, притопчи змей и зажги фонарь на холме", VIEW_W / 2, 186);
  const pulse = 0.7 + Math.sin(state.time * 3) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#fff4d6";
  ctx.font = `700 20px ${fonts.body}`;
  ctx.fillText("Нажмите, чтобы начать", VIEW_W / 2, 430);
  ctx.globalAlpha = 1;
  ctx.font = `500 14px ${fonts.body}`;
  ctx.fillStyle = "#e8c8a0";
  ctx.fillText("A/D или ←/→ — бег   ·   W / Пробел / ↑ — прыжок   ·   R — заново", VIEW_W / 2, 462);
  ctx.textAlign = "left";
}

function drawCenterCard(
  ctx: CanvasRenderingContext2D,
  fonts: { title: string; body: string },
  title: string,
  sub: string,
) {
  ctx.fillStyle = "rgba(12, 6, 10, 0.45)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = "rgba(28, 14, 16, 0.86)";
  roundRect(ctx, VIEW_W / 2 - 280, VIEW_H / 2 - 78, 560, 156, 22);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe7c2";
  ctx.font = `700 34px ${fonts.title}`;
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 12);
  ctx.fillStyle = "#f0c898";
  ctx.font = `500 16px ${fonts.body}`;
  ctx.fillText(sub, VIEW_W / 2, VIEW_H / 2 + 28);
  ctx.textAlign = "left";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
