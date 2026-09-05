"use client";

import { useEffect, useRef } from "react";

export function AnimatedWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "·∘○◯◌●◉";
    let time = 0;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cellSize = isMobile ? 32 : 20;
    const frameInterval = isMobile ? 1000 / 30 : 1000 / 60;

    let visible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    let lastFrame = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cols = Math.floor(rect.width / cellSize);
      const rows = Math.floor(rect.height / cellSize);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = (x + 0.5) * (rect.width / cols);
          const py = (y + 0.5) * (rect.height / rows);

          // Multiple wave interference
          const wave1 = Math.sin(x * 0.2 + time * 2) * Math.cos(y * 0.15 + time);
          const wave2 = Math.sin((x + y) * 0.1 + time * 1.5);
          const wave3 = Math.cos(x * 0.1 - y * 0.1 + time * 0.8);
          
          const combined = (wave1 + wave2 + wave3) / 3;
          const normalized = (combined + 1) / 2;
          
          const charIndex = Math.floor(normalized * (chars.length - 1));
          const alpha = 0.15 + normalized * 0.5;

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fillText(chars[charIndex], px, py);
        }
      }

      time += 0.03;
    };

    draw();

    if (!reduceMotion) {
      const render = (now: number) => {
        frameRef.current = requestAnimationFrame(render);
        if (!visible || now - lastFrame < frameInterval) return;
        lastFrame = now;
        draw();
      };
      frameRef.current = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
