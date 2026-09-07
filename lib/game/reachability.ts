import {
  GRAVITY,
  JUMP_VELOCITY,
  MOVE_SPEED,
  PLAYER_H,
  PLAYER_W,
  SPARK_R,
} from "./constants";
import { LEVEL, PLATFORMS } from "./level";
import type { Platform } from "./types";

const DT = 1 / 60;
const STEP = 8;

type Node = { plat: number; x: number };

function standsOn(p: Platform, x: number) {
  return x >= p.x && x + PLAYER_W <= p.x + p.w;
}

function landOn(prevBottom: number, y: number, vy: number, plat: Platform, x: number) {
  if (vy < 0) return false;
  if (!standsOn(plat, x)) return false;
  const bottom = y + PLAYER_H;
  return prevBottom <= plat.y + 6 && bottom >= plat.y;
}

function simulateJump(startX: number, startTop: number, dir: number) {
  const landings: { plat: number; x: number }[] = [];
  let x = startX;
  let y = startTop - PLAYER_H;
  let vy = JUMP_VELOCITY;
  const vx = dir * MOVE_SPEED;
  for (let i = 0; i < 140; i++) {
    const prevY = y;
    vy += GRAVITY * DT;
    x += vx * DT;
    y += vy * DT;
    for (let pi = 0; pi < PLATFORMS.length; pi++) {
      if (landOn(prevY + PLAYER_H, y, vy, PLATFORMS[pi], x)) {
        landings.push({ plat: pi, x: clampOn(PLATFORMS[pi], x) });
      }
    }
    if (y > 640) break;
  }
  return landings;
}

function clampOn(p: Platform, x: number) {
  return Math.max(p.x, Math.min(p.x + p.w - PLAYER_W, x));
}

function keyOf(n: Node) {
  return `${n.plat}:${Math.round(n.x / STEP)}`;
}

export function analyzeLevel() {
  const spawnPlat = PLATFORMS.findIndex(
    (p) =>
      LEVEL.spawn.x >= p.x &&
      LEVEL.spawn.x <= p.x + p.w &&
      Math.abs(LEVEL.spawn.y + PLAYER_H - p.y) < 4,
  );
  if (spawnPlat < 0) {
    return { ok: false, reason: "spawn is not on a platform", unreachableSparks: [] as number[], unreachablePlatforms: [] as number[] };
  }

  const visited = new Set<string>();
  const queue: Node[] = [{ plat: spawnPlat, x: LEVEL.spawn.x }];
  visited.add(keyOf(queue[0]));
  const reachedPlat = new Set<number>([spawnPlat]);

  while (queue.length) {
    const node = queue.shift()!;
    const plat = PLATFORMS[node.plat];
    for (const x of [plat.x, plat.x + plat.w - PLAYER_W, node.x - STEP, node.x + STEP]) {
      const nx = clampOn(plat, x);
      const next = { plat: node.plat, x: nx };
      const k = keyOf(next);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push(next);
      }
    }
    for (const dir of [-1, 1, 0]) {
      for (const land of simulateJump(node.x, plat.y, dir)) {
        reachedPlat.add(land.plat);
        const k = keyOf(land);
        if (!visited.has(k)) {
          visited.add(k);
          queue.push(land);
        }
      }
    }
  }

  const unreachablePlatforms = PLATFORMS.map((_, i) => i).filter((i) => !reachedPlat.has(i));
  const reachableStanding = [...visited].map((k) => {
    const [plat, xb] = k.split(":").map(Number);
    return { plat, x: xb * STEP };
  });

  const unreachableSparks: number[] = [];
  LEVEL.sparks.forEach((spark, i) => {
    const ok = reachableStanding.some((s) => {
      const plat = PLATFORMS[s.plat];
      const px = s.x + PLAYER_W / 2;
      const py = plat.y - PLAYER_H / 2;
      const dx = px - spark.x;
      const dy = py - spark.y;
      return dx * dx + dy * dy < (SPARK_R + 48) * (SPARK_R + 48);
    });
    if (!ok) unreachableSparks.push(i);
  });

  const lanternOk = reachableStanding.some((s) => {
    const plat = PLATFORMS[s.plat];
    const px = s.x + PLAYER_W / 2;
    return Math.abs(px - LEVEL.lantern.x) < 60 && Math.abs(plat.y - LEVEL.lantern.y) < 12;
  });

  return {
    ok: unreachableSparks.length === 0 && unreachablePlatforms.length === 0 && lanternOk,
    unreachableSparks,
    unreachablePlatforms,
    lanternOk,
    jumpHeight: (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY),
  };
}
