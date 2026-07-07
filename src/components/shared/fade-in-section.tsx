"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type FadeInSectionProps = {
  children: ReactNode;
  className?: string;
  /** Delay before animation starts (ms). Useful for staggering. */
  delay?: number;
  /** Animation direction */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Distance to travel in px */
  distance?: number;
  /** Duration in ms */
  duration?: number;
  /** How much of the element must be visible before triggering (0-1) */
  threshold?: number;
  /** HTML tag to render */
  as?: "div" | "section" | "article" | "li" | "span";
};

export function FadeInSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 32,
  duration = 700,
  threshold = 0.15,
  as: Tag = "div",
}: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
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
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const translateMap: Record<string, string> = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    none: "none",
  };

  const style: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "none" : translateMap[direction],
    transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
    willChange: isVisible ? "auto" : "opacity, transform",
  };

  return (
    <Tag ref={ref as any} className={className} style={style}>
      {children}
    </Tag>
  );
}

/**
 * Helper to stagger multiple FadeInSection children.
 * Usage: <StaggerGroup stagger={120}> ... </StaggerGroup>
 */
type StaggerGroupProps = {
  children: ReactNode[];
  stagger?: number;
  className?: string;
  direction?: FadeInSectionProps["direction"];
  as?: FadeInSectionProps["as"];
};

export function StaggerGroup({
  children,
  stagger = 100,
  className,
  direction = "up",
  as,
}: StaggerGroupProps) {
  return (
    <>
      {children.map((child, i) => (
        <FadeInSection
          key={i}
          delay={i * stagger}
          direction={direction}
          className={className}
          as={as}
        >
          {child}
        </FadeInSection>
      ))}
    </>
  );
}
