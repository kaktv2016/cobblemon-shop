"use client";

import { useEffect } from "react";

export function AmbientCursor() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const supportsHover = window.matchMedia("(hover: hover)");

    if (prefersReducedMotion.matches || !supportsHover.matches) {
      return;
    }

    let frame = 0;
    let activeSpotlight: HTMLElement | null = null;

    const setCursor = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--cursor-x", `${(x / window.innerWidth) * 100}%`);
        document.documentElement.style.setProperty("--cursor-y", `${(y / window.innerHeight) * 100}%`);
      });
    };

    const clearSpotlight = (element?: HTMLElement | null) => {
      if (!element) {
        return;
      }

      element.style.setProperty("--spotlight-active", "0");
    };

    const handlePointerMove = (event: PointerEvent) => {
      setCursor(event.clientX, event.clientY);

      const target = event.target as HTMLElement | null;
      const spotlightTarget = target?.closest<HTMLElement>("[data-spotlight]") ?? null;

      if (activeSpotlight !== spotlightTarget) {
        clearSpotlight(activeSpotlight);
        activeSpotlight = spotlightTarget;
      }

      if (!spotlightTarget) {
        return;
      }

      const rect = spotlightTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      spotlightTarget.style.setProperty("--spotlight-active", "1");
      spotlightTarget.style.setProperty("--spotlight-x", `${x}%`);
      spotlightTarget.style.setProperty("--spotlight-y", `${y}%`);
    };

    const handlePointerExit = () => {
      clearSpotlight(activeSpotlight);
      activeSpotlight = null;
    };

    setCursor(window.innerWidth * 0.72, window.innerHeight * 0.18);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", handlePointerExit);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handlePointerExit);
      clearSpotlight(activeSpotlight);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="cursor-ambient absolute inset-0 opacity-70" />
    </div>
  );
}
