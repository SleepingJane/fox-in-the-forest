export type InputState = {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
  restart: boolean;
  pause: boolean;
};

const CODES_LEFT = new Set(["ArrowLeft", "KeyA"]);
const CODES_RIGHT = new Set(["ArrowRight", "KeyD"]);
const CODES_JUMP = new Set(["Space", "KeyW", "ArrowUp"]);
const KEYS_LEFT = new Set(["a", "ф", "arrowleft"]);
const KEYS_RIGHT = new Set(["d", "в", "arrowright"]);
const KEYS_JUMP = new Set(["w", "ц", " ", "arrowup"]);
const KEYS_RESTART = new Set(["r", "к"]);
const KEYS_PAUSE = new Set(["p", "з", "escape"]);

export function createInput(): InputState {
  return {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    restart: false,
    pause: false,
  };
}

export function isGameKey(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  return (
    CODES_LEFT.has(e.code) ||
    CODES_RIGHT.has(e.code) ||
    CODES_JUMP.has(e.code) ||
    e.code === "KeyR" ||
    e.code === "KeyP" ||
    e.code === "Escape" ||
    KEYS_LEFT.has(key) ||
    KEYS_RIGHT.has(key) ||
    KEYS_JUMP.has(key) ||
    KEYS_RESTART.has(key) ||
    KEYS_PAUSE.has(key)
  );
}

export function applyKey(input: InputState, e: KeyboardEvent, down: boolean) {
  const key = e.key.toLowerCase();
  if (CODES_LEFT.has(e.code) || KEYS_LEFT.has(key)) input.left = down;
  if (CODES_RIGHT.has(e.code) || KEYS_RIGHT.has(key)) input.right = down;
  if (CODES_JUMP.has(e.code) || KEYS_JUMP.has(key)) {
    if (down && !input.jump) input.jumpPressed = true;
    input.jump = down;
  }
  if (e.repeat) return;
  if (e.code === "KeyR" || KEYS_RESTART.has(key)) {
    if (down) input.restart = true;
  }
  if (e.code === "KeyP" || e.code === "Escape" || KEYS_PAUSE.has(key)) {
    if (down) input.pause = true;
  }
}

export function consumePulse(input: InputState) {
  input.jumpPressed = false;
  input.restart = false;
  input.pause = false;
}
