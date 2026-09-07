import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const level = JSON.parse(
  fs.readFileSync(path.join(root, "lib/game/level.json"), "utf8"),
);

const GRAVITY = 1950;
const JUMP_VELOCITY = -680;
const MOVE_SPEED = 250;
const PLAYER_W = 22;
const PLAYER_H = 32;
const SPARK_R = 9;
const DT = 1 / 60;
const STEP = 8;

const platforms = level.platforms;

function standsOn(p, x) {
  return x >= p.x && x + PLAYER_W <= p.x + p.w;
}

function clampOn(p, x) {
  return Math.max(p.x, Math.min(p.x + p.w - PLAYER_W, x));
}

function landOn(prevBottom, y, vy, plat, x) {
  if (vy < 0) return false;
  if (!standsOn(plat, x)) return false;
  const bottom = y + PLAYER_H;
  return prevBottom <= plat.y + 6 && bottom >= plat.y;
}

function simulateJump(startX, startTop, dir) {
  const landings = [];
  let x = startX;
  let y = startTop - PLAYER_H;
  let vy = JUMP_VELOCITY;
  const vx = dir * MOVE_SPEED;
  for (let i = 0; i < 140; i++) {
    const prevY = y;
    vy += GRAVITY * DT;
    x += vx * DT;
    y += vy * DT;
    for (let pi = 0; pi < platforms.length; pi++) {
      if (landOn(prevY + PLAYER_H, y, vy, platforms[pi], x)) {
        landings.push({ plat: pi, x: clampOn(platforms[pi], x) });
      }
    }
    if (y > 640) break;
  }
  return landings;
}

function keyOf(n) {
  return `${n.plat}:${Math.round(n.x / STEP)}`;
}

const spawnPlat = platforms.findIndex(
  (p) =>
    level.spawn.x >= p.x &&
    level.spawn.x <= p.x + p.w &&
    Math.abs(level.spawn.y + PLAYER_H - p.y) < 4,
);

if (spawnPlat < 0) {
  console.error("Spawn is not on a platform");
  process.exit(1);
}

const visited = new Set();
const queue = [{ plat: spawnPlat, x: level.spawn.x }];
visited.add(keyOf(queue[0]));
const reachedPlat = new Set([spawnPlat]);

while (queue.length) {
  const node = queue.shift();
  const plat = platforms[node.plat];
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

const unreachablePlatforms = platforms
  .map((_, i) => i)
  .filter((i) => !reachedPlat.has(i));

const reachableStanding = [...visited].map((k) => {
  const [plat, xb] = k.split(":").map(Number);
  return { plat, x: xb * STEP };
});

const unreachableSparks = [];
level.sparks.forEach((spark, i) => {
  const ok = reachableStanding.some((s) => {
    const plat = platforms[s.plat];
    const px = s.x + PLAYER_W / 2;
    const py = plat.y - PLAYER_H / 2;
    const dx = px - spark.x;
    const dy = py - spark.y;
    return dx * dx + dy * dy < (SPARK_R + 48) * (SPARK_R + 48);
  });
  if (!ok) unreachableSparks.push(i);
});

const lanternOk = reachableStanding.some((s) => {
  const plat = platforms[s.plat];
  const px = s.x + PLAYER_W / 2;
  return Math.abs(px - level.lantern.x) < 60 && Math.abs(plat.y - level.lantern.y) < 12;
});

const jumpHeight = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);
console.log(
  JSON.stringify(
    {
      jumpHeight: Math.round(jumpHeight * 10) / 10,
      unreachablePlatforms,
      unreachableSparks,
      lanternOk,
      reachedPlatforms: reachedPlat.size,
      totalPlatforms: platforms.length,
    },
    null,
    2,
  ),
);

if (unreachablePlatforms.length || unreachableSparks.length || !lanternOk) {
  process.exit(1);
}

console.log("Level OK: every platform, spark and the lantern are reachable.");
