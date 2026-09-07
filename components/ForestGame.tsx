"use client";

import { useEffect, useRef } from "react";
import { VIEW_H, VIEW_W } from "@/lib/game/constants";
import { createInitialState } from "@/lib/game/level";
import {
  applyKey,
  consumePulse,
  createInput,
  isGameKey,
} from "@/lib/game/input";
import { updateGame } from "@/lib/game/sim";
import { drawFrame } from "@/lib/game/draw";
import { unlockAudio } from "@/lib/game/audio";
import { analyzeLevel } from "@/lib/game/reachability";

export default function ForestGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const report = analyzeLevel();
      if (!report.ok) console.error("Level reachability failed", report);
    }

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = createInitialState();
    const input = createInput();
    const styles = getComputedStyle(document.body);
    const fonts = {
      title: `${styles.getPropertyValue("--font-title").trim() || "system-ui"}, system-ui, sans-serif`,
      body: `${styles.getPropertyValue("--font-body").trim() || "system-ui"}, system-ui, sans-serif`,
    };

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = VIEW_W * dpr;
      canvas.height = VIEW_H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    };
    fit();

    const startRun = () => {
      if (state.phase === "title") state.phase = "playing";
      state.focused = true;
      unlockAudio();
      wrap.focus();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isGameKey(e)) return;
      e.preventDefault();
      applyKey(input, e, true);
      if (
        state.phase === "title" &&
        e.code !== "KeyP" &&
        e.code !== "Escape"
      ) {
        startRun();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!isGameKey(e)) return;
      e.preventDefault();
      applyKey(input, e, false);
    };
    const onPointer = () => startRun();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    wrap.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", fit);
    wrap.focus();

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      updateGame(state, input, dt);
      consumePulse(input);
      ctx.setTransform(
        canvas.width / VIEW_W,
        0,
        0,
        canvas.height / VIEW_H,
        0,
        0,
      );
      drawFrame(ctx, state, fonts);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      wrap.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div className="stage">
      <div
        ref={wrapRef}
        className="frame"
        tabIndex={0}
        autoFocus
        role="application"
        aria-label="Лисёнок в лесу"
      >
        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} />
      </div>
    </div>
  );
}
