"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
};

/**
 * Subtle floating light particles in the background.
 * Uses canvas for performance — zero layout cost.
 * Automatically pauses when off-screen or reduced-motion is set.
 */
export function FloatingParticles({ count = 35 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }

    function createParticles() {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2 - 0.1,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.5 ? 200 : 260, // cyan or indigo
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around edges
        if (p.x < -10) p.x = canvas!.width + 10;
        if (p.x > canvas!.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas!.height + 10;
        if (p.y > canvas!.height + 10) p.y = -10;

        // Pulsing opacity
        const pulse = Math.sin(Date.now() * 0.001 + p.x * 0.01) * 0.15;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.opacity + pulse})`;
        ctx!.fill();

        // Soft glow
        if (p.size > 1) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          const grad = ctx!.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            p.size * 4
          );
          grad.addColorStop(
            0,
            `hsla(${p.hue}, 80%, 75%, ${(p.opacity + pulse) * 0.2})`
          );
          grad.addColorStop(1, "hsla(0, 0%, 0%, 0)");
          ctx!.fillStyle = grad;
          ctx!.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    // Pause when tab is hidden
    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        draw();
      }
    }

    resize();
    createParticles();
    draw();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
      aria-hidden="true"
    />
  );
}
