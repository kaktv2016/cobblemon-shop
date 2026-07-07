"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

type TransitionLinkProps = ComponentPropsWithoutRef<typeof Link>;

/**
 * A drop-in replacement for next/link that uses the View Transitions API
 * to create a smooth cross-fade when navigating between layout groups
 * (e.g. store <-> auth).
 *
 * Wrapped in try/catch so navigation always works even if the
 * View Transitions API fails for any reason.
 */
export function TransitionLink({ href, onClick, children, ...rest }: TransitionLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchedRef = useRef(false);

  const hrefString = typeof href === "string" ? href : href.pathname ?? "/";

  const prefetchRoute = useCallback(() => {
    if (prefetchedRef.current || pathname === hrefString) return;
    prefetchedRef.current = true;
    router.prefetch(hrefString);
  }, [hrefString, pathname, router]);

  useEffect(() => {
    const win = globalThis as typeof window & {
      requestIdleCallback?: (cb: IdleRequestCallback) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof window === "undefined") return;

    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(() => prefetchRoute());
      return () => win.cancelIdleCallback?.(id);
    }

    const id = setTimeout(() => prefetchRoute(), 200);
    return () => clearTimeout(id);
  }, [prefetchRoute]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);

    if (
      e.defaultPrevented ||
      pathname === hrefString ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    e.preventDefault();
    prefetchRoute();

    const doc = document as ViewTransitionDocument;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Try View Transitions API — if anything goes wrong, fall through to
    // plain router.push so navigation is never blocked.
    if (!prefersReducedMotion && typeof doc.startViewTransition === "function") {
      try {
        doc.startViewTransition(() => {
          router.push(hrefString);
        });
        return;
      } catch {
        // View Transitions failed — fall through to normal navigation
      }
    }

    router.push(hrefString);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      onMouseEnter={prefetchRoute}
      onFocus={prefetchRoute}
      {...rest}
    >
      {children}
    </Link>
  );
}
