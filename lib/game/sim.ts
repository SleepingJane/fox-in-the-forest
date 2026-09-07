import {
  COYOTE_TIME,
  GRAVITY,
  HURT_FREEZE,
  JUMP_BUFFER,
  JUMP_CUT_MULTIPLIER,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  MOVE_SPEED,
  SPARK_R,
  STOMP_BOUNCE,
  VIEW_W,
  WORLD_H,
  WORLD_W,
} from "./constants";
import type { InputState } from "./input";
import { PLATFORMS, fullRestart, resetLevel } from "./level";
import { burst, dust, updateParticles } from "./particles";
import { sfx } from "./audio";
import type { GameState, Platform, Player } from "./types";

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function isOneWay(plat: Platform) {
  return plat.kind === "log" || plat.kind === "stone";
}

function resolveX(player: Player) {
  for (const plat of PLATFORMS) {
    if (isOneWay(plat)) continue;
    if (!aabb(player.x, player.y, player.w, player.h, plat.x, plat.y, plat.w, plat.h)) {
      continue;
    }
    if (player.y + player.h <= plat.y + 6) continue;
    if (player.x + player.w / 2 < plat.x + plat.w / 2) {
      player.x = plat.x - player.w;
    } else {
      player.x = plat.x + plat.w;
    }
    player.vx = 0;
  }
}

function resolveY(player: Player, prevY: number) {
  player.grounded = false;
  for (const plat of PLATFORMS) {
    if (!aabb(player.x, player.y, player.w, player.h, plat.x, plat.y, plat.w, plat.h)) {
      continue;
    }
    const prevBottom = prevY + player.h;
    if (player.vy >= 0 && prevBottom <= plat.y + 10) {
      player.y = plat.y - player.h;
      player.vy = 0;
      player.grounded = true;
      continue;
    }
    if (isOneWay(plat)) continue;
    if (player.vy < 0 && prevY >= plat.y + plat.h - 10) {
      player.y = plat.y + plat.h;
      player.vy = 0;
    }
  }
}

export function updateGame(state: GameState, input: InputState, dt: number) {
  const clampedDt = Math.min(dt, 1 / 30);
  state.time += clampedDt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - clampedDt * 8);
  if (state.hintTimer > 0) state.hintTimer = Math.max(0, state.hintTimer - clampedDt);

  if (input.restart) {
    fullRestart(state);
    return;
  }

  if (input.pause && (state.phase === "playing" || state.phase === "paused")) {
    state.phase = state.phase === "paused" ? "playing" : "paused";
  }

  const simulateWorld =
    state.phase === "playing" ||
    state.phase === "title" ||
    state.phase === "hurt" ||
    state.phase === "win";

  if (simulateWorld) {
    updateSnakes(state, clampedDt);
    updateSparksVisual(state, clampedDt);
    if (state.lantern.lit) {
      state.lantern.glow = Math.min(1, state.lantern.glow + clampedDt * 0.8);
    } else if (state.collected === state.totalSparks) {
      state.lantern.glow = 0.18 + Math.sin(state.time * 3) * 0.06;
    } else {
      state.lantern.glow = 0.04;
    }
  }

  if (state.phase === "paused" || state.phase === "title" || state.phase === "dead") {
    updateParticles(state.particles, clampedDt);
    updateCamera(state, clampedDt);
    return;
  }

  if (state.phase === "hurt") {
    state.hurtTimer -= clampedDt;
    state.player.anim += clampedDt;
    updateParticles(state.particles, clampedDt);
    updateCamera(state, clampedDt);
    if (state.hurtTimer <= 0) {
      if (state.lives <= 0) {
        state.phase = "dead";
      } else {
        resetLevel(state);
        state.phase = "playing";
      }
    }
    return;
  }

  if (state.phase === "win") {
    state.winTimer += clampedDt;
    idlePlayer(state, clampedDt);
    updateParticles(state.particles, clampedDt);
    updateCamera(state, clampedDt);
    return;
  }

  const player = state.player;
  const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  player.vx = move * MOVE_SPEED;
  if (move !== 0) player.facing = move > 0 ? 1 : -1;

  if (player.grounded) player.coyote = COYOTE_TIME;
  else player.coyote = Math.max(0, player.coyote - clampedDt);

  if (input.jumpPressed) player.jumpBuffer = JUMP_BUFFER;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - clampedDt);

  player.jumpHeld = input.jump;
  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.vy = JUMP_VELOCITY;
    player.grounded = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.cutJump = false;
    sfx.jump();
  }
  if (!player.jumpHeld && player.vy < 0 && !player.cutJump) {
    player.vy *= JUMP_CUT_MULTIPLIER;
    player.cutJump = true;
  }

  player.vy = Math.min(MAX_FALL_SPEED, player.vy + GRAVITY * clampedDt);

  const wasGrounded = player.grounded;
  player.x += player.vx * clampedDt;
  player.x = Math.max(8, Math.min(WORLD_W - player.w - 8, player.x));
  resolveX(player);
  const prevY = player.y;
  player.y += player.vy * clampedDt;
  resolveY(player, prevY);

  if (player.y > WORLD_H + 40) {
    hurt(state);
    return;
  }

  if (player.grounded && !wasGrounded) {
    dust(state.particles, player.x + player.w / 2, player.y + player.h);
  }

  player.anim += clampedDt * (player.grounded && Math.abs(player.vx) > 20 ? 10 : 3);

  collectSparks(state);
  stompOrHurt(state);
  tryLantern(state);
  updateParticles(state.particles, clampedDt);
  updateCamera(state, clampedDt);
}

function idlePlayer(state: GameState, dt: number) {
  const player = state.player;
  player.vx = 0;
  player.vy = Math.min(MAX_FALL_SPEED, player.vy + GRAVITY * dt);
  const prevY = player.y;
  player.y += player.vy * dt;
  resolveY(player, prevY);
  player.anim += dt * 2;
}

function updateSnakes(state: GameState, dt: number) {
  for (const snake of state.snakes) {
    if (!snake.alive) continue;
    snake.anim += dt * 6;
    if (snake.wait > 0) {
      snake.wait -= dt;
      continue;
    }
    snake.x += snake.dir * snake.speed * dt;
    if (snake.x >= snake.maxX) {
      snake.x = snake.maxX;
      snake.dir = -1;
      snake.wait = 0.45;
    } else if (snake.x <= snake.minX) {
      snake.x = snake.minX;
      snake.dir = 1;
      snake.wait = 0.45;
    }
  }
}

function updateSparksVisual(state: GameState, dt: number) {
  for (const spark of state.sparks) {
    if (spark.taken) continue;
    spark.bob += dt * 3.2;
  }
}

function collectSparks(state: GameState) {
  const p = state.player;
  for (const spark of state.sparks) {
    if (spark.taken) continue;
    const sy = spark.y + Math.sin(spark.bob) * 5;
    const dx = p.x + p.w / 2 - spark.x;
    const dy = p.y + p.h / 2 - sy;
    if (dx * dx + dy * dy < (SPARK_R + 16) * (SPARK_R + 16)) {
      spark.taken = true;
      state.collected += 1;
      burst(state.particles, spark.x, sy, "#ffe08a", 14, 140);
      sfx.collect();
    }
  }
}

function stompOrHurt(state: GameState) {
  const p = state.player;
  for (const snake of state.snakes) {
    if (!snake.alive) continue;
    if (!aabb(p.x, p.y, p.w, p.h, snake.x, snake.y, snake.w, snake.h)) continue;
    const feet = p.y + p.h;
    const stomp = p.vy > 40 && feet <= snake.y + snake.h * 0.65;
    if (stomp) {
      snake.alive = false;
      p.vy = STOMP_BOUNCE;
      p.grounded = false;
      burst(state.particles, snake.x + snake.w / 2, snake.y, "#8fbf6a", 12, 110);
      sfx.stomp();
    } else {
      hurt(state);
      return;
    }
  }
}

function tryLantern(state: GameState) {
  const p = state.player;
  const L = state.lantern;
  const near =
    p.x + p.w > L.x - 18 &&
    p.x < L.x + 34 &&
    p.y + p.h > L.y - 70 &&
    p.y < L.y + 8;
  if (!near) return;
  if (state.collected < state.totalSparks) {
    state.hintText = "Собери все искры, чтобы зажечь фонарь";
    state.hintTimer = 1.6;
    return;
  }
  if (!L.lit) {
    L.lit = true;
    L.glow = 0.3;
    burst(state.particles, L.x + 8, L.y - 48, "#ffb347", 18, 90);
    burst(state.particles, L.x + 8, L.y - 48, "#ffe08a", 10, 70);
    sfx.lantern();
    sfx.win();
    state.phase = "win";
    state.winTimer = 0;
  }
}

function hurt(state: GameState) {
  if (state.phase !== "playing") return;
  state.lives -= 1;
  state.phase = "hurt";
  state.hurtTimer = HURT_FREEZE;
  state.shake = 7;
  burst(
    state.particles,
    state.player.x + state.player.w / 2,
    state.player.y + state.player.h / 2,
    "#e07a3d",
    10,
    90,
  );
  sfx.hurt();
}

function updateCamera(state: GameState, dt: number) {
  const target = state.player.x + state.player.w / 2 - VIEW_W * 0.38;
  const maxX = WORLD_W - VIEW_W;
  const clamped = Math.max(0, Math.min(maxX, target));
  const follow = state.phase === "title" ? 2.5 : 8;
  state.cameraX += (clamped - state.cameraX) * Math.min(1, follow * dt);
}
