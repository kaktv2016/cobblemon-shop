"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type AnimatedTextProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
};

/**
 * Text that clips up from behind a mask on first appearance.
 * Gives headings a cinematic reveal feel.
 */
export function AnimatedText({
  children,
  className = "",
  delay = 0,
  duration = 900,
  as: Tag = "div",
}: AnimatedTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const wrapperStyle: CSSProperties = {
    overflow: "hidden",
    display: "block",
  };

  const innerStyle: CSSProperties = {
    display: "block",
    transform: isVisible ? "translateY(0)" : "translateY(105%)",
    opacity: isVisible ? 1 : 0,
    transition: `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, opacity ${duration * 0.6}ms ease ${delay}ms`,
    willChange: isVisible ? "auto" : "transform, opacity",
  };

  return (
    <Tag ref={ref as any} className={className} style={wrapperStyle}>
      <span style={innerStyle}>{children}</span>
    </Tag>
  );
}
