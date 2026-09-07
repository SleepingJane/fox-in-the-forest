export type Rect = { x: number; y: number; w: number; h: number };

export type Platform = Rect & { kind: "ground" | "log" | "stone" | "hill" };

export type SparkTemplate = { x: number; y: number };
export type SnakeTemplate = {
  originX: number;
  platformTop: number;
  radius: number;
  speed: number;
};

export type Phase = "title" | "playing" | "paused" | "hurt" | "win" | "dead";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
};

export type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  grounded: boolean;
  coyote: number;
  jumpBuffer: number;
  jumpHeld: boolean;
  cutJump: boolean;
  anim: number;
};

export type Snake = {
  x: number;
  y: number;
  w: number;
  h: number;
  originX: number;
  minX: number;
  maxX: number;
  dir: 1 | -1;
  speed: number;
  wait: number;
  alive: boolean;
  anim: number;
};

export type Spark = {
  x: number;
  y: number;
  taken: boolean;
  bob: number;
};

export type Lantern = {
  x: number;
  y: number;
  lit: boolean;
  glow: number;
};

export type GameState = {
  phase: Phase;
  lives: number;
  time: number;
  hurtTimer: number;
  winTimer: number;
  player: Player;
  snakes: Snake[];
  sparks: Spark[];
  lantern: Lantern;
  particles: Particle[];
  cameraX: number;
  collected: number;
  totalSparks: number;
  hintTimer: number;
  hintText: string;
  shake: number;
  focused: boolean;
};
