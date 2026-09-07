import type { Particle } from "./types";

export function burst(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  n = 10,
  speed = 120,
) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const s = speed * (0.4 + Math.random() * 0.8);
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 40,
      life: 0.45 + Math.random() * 0.25,
      maxLife: 0.7,
      size: 2 + Math.random() * 3,
      color,
      gravity: 280,
    });
  }
}

export function dust(particles: Particle[], x: number, y: number) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 16,
      y,
      vx: (Math.random() - 0.5) * 60,
      vy: -20 - Math.random() * 30,
      life: 0.28,
      maxLife: 0.28,
      size: 2 + Math.random() * 2,
      color: "rgba(90, 60, 30, 0.45)",
      gravity: 120,
    });
  }
}

export function updateParticles(particles: Particle[], dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (particles.length > 120) particles.splice(0, particles.length - 120);
}
