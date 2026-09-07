import levelData from "./level.json";
import {
  PLAYER_H,
  PLAYER_W,
  SNAKE_H,
  SNAKE_W,
  MAX_LIVES,
} from "./constants";
import type {
  GameState,
  Lantern,
  Platform,
  Player,
  Snake,
  Spark,
} from "./types";

export const LEVEL = levelData;

export const PLATFORMS = LEVEL.platforms as Platform[];

export function createPlayer(): Player {
  return {
    x: LEVEL.spawn.x,
    y: LEVEL.spawn.y,
    vx: 0,
    vy: 0,
    w: PLAYER_W,
    h: PLAYER_H,
    facing: 1,
    grounded: true,
    coyote: 0,
    jumpBuffer: 0,
    jumpHeld: false,
    cutJump: false,
    anim: 0,
  };
}

export function createSnakes(): Snake[] {
  return LEVEL.snakes.map((s) => {
    const platform = PLATFORMS.find(
      (p) =>
        s.originX >= p.x &&
        s.originX <= p.x + p.w &&
        Math.abs(p.y - s.platformTop) < 2,
    );
    const left = platform ? platform.x + 4 : s.originX - s.radius;
    const right = platform
      ? platform.x + platform.w - SNAKE_W - 4
      : s.originX + s.radius;
    const minX = Math.max(left, s.originX - s.radius);
    const maxX = Math.min(right, s.originX + s.radius);
    return {
      x: s.originX,
      y: s.platformTop - SNAKE_H,
      w: SNAKE_W,
      h: SNAKE_H,
      originX: s.originX,
      minX,
      maxX: Math.max(minX + 8, maxX),
      dir: 1,
      speed: s.speed,
      wait: 0,
      alive: true,
      anim: 0,
    };
  });
}

export function createSparks(): Spark[] {
  return LEVEL.sparks.map((s, i) => ({
    x: s.x,
    y: s.y,
    taken: false,
    bob: i * 0.7,
  }));
}

export function createLantern(): Lantern {
  return {
    x: LEVEL.lantern.x,
    y: LEVEL.lantern.y,
    lit: false,
    glow: 0,
  };
}

export function createInitialState(): GameState {
  const sparks = createSparks();
  return {
    phase: "title",
    lives: MAX_LIVES,
    time: 0,
    hurtTimer: 0,
    winTimer: 0,
    player: createPlayer(),
    snakes: createSnakes(),
    sparks,
    lantern: createLantern(),
    particles: [],
    cameraX: 0,
    collected: 0,
    totalSparks: sparks.length,
    hintTimer: 0,
    hintText: "",
    shake: 0,
    focused: false,
  };
}

export function resetLevel(state: GameState) {
  state.player = createPlayer();
  state.snakes = createSnakes();
  state.sparks = createSparks();
  state.lantern = createLantern();
  state.collected = 0;
  state.particles = [];
  state.hintTimer = 0;
  state.hintText = "";
  state.hurtTimer = 0;
  state.winTimer = 0;
  state.shake = 0;
}

export function fullRestart(state: GameState) {
  const focused = state.focused;
  Object.assign(state, createInitialState());
  state.phase = "playing";
  state.focused = focused;
}
