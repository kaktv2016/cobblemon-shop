"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useRef } from "react";

type AuthRouteLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => unknown;
};

export function AuthRouteLink({
  href,
  className,
  children,
}: AuthRouteLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const prefetchedRef = useRef(false);

  const prefetchRoute = () => {
    if (prefetchedRef.current || pathname === href) {
      return;
    }

    prefetchedRef.current = true;
    router.prefetch(href);
  };

  useEffect(() => {
    prefetchRoute();
  }, [href, pathname, router]);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={prefetchRoute}
      onFocus={prefetchRoute}
      onClick={(event) => {
        if (
          pathname === href ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        prefetchRoute();

        const doc = document as ViewTransitionDocument;
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        const navigate = () => {
          startTransition(() => {
            router.push(href);
          });
        };

        if (!prefersReducedMotion && typeof doc.startViewTransition === "function") {
          doc.startViewTransition(() => {
            navigate();
          });
          return;
        }

        navigate();
      }}
    >
      {children}
    </Link>
  );
}
