"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassButtonVariants = cva(
  "liquid-glass-button inline-flex items-center justify-center whitespace-nowrap font-medium text-[color:var(--theme-control-text-strong)] transition-[transform,box-shadow,border-color,background-color,color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:select-none",
  {
    variants: {
      variant: {
        primary: "liquid-glass-primary",
        secondary: "liquid-glass-secondary",
      },
      size: {
        sm: "h-10 px-4 text-sm [--glass-radius:1rem] [--glass-blur:14px]",
        md: "h-11 px-5 text-sm [--glass-radius:1.08rem] [--glass-blur:16px]",
        lg: "h-12 px-6 text-base [--glass-radius:1.18rem] [--glass-blur:18px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

function composeEventHandlers<E>(
  theirHandler?: (event: E) => void,
  ourHandler?: (event: E) => void
) {
  return (event: E) => {
    theirHandler?.(event);
    ourHandler?.(event);
  };
}

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (!ref) {
        return;
      }

      if (typeof ref === "function") {
        ref(value);
        return;
      }

      (ref as React.MutableRefObject<T | null>).current = value;
    });
  };
}

function withIconMarker(icon: React.ReactNode, position: "inline-start" | "inline-end") {
  if (!icon) {
    return null;
  }

  if (React.isValidElement(icon)) {
    const iconElement = icon as React.ReactElement<any>;

    return React.cloneElement(iconElement, {
      "data-icon": position,
      "aria-hidden": true,
      className: cn(iconElement.props.className),
    });
  }

  return (
    <span aria-hidden data-icon={position}>
      {icon}
    </span>
  );
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      disabled,
      children,
      style,
      onClick,
      onPointerEnter,
      onPointerLeave,
      onPointerMove,
      ...props
    },
    ref
  ) => {
    const localRef = React.useRef<HTMLElement | null>(null);
    const prefersReducedMotionRef = React.useRef(false);

    React.useEffect(() => {
      if (typeof window === "undefined") {
        return;
      }

      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      const update = () => {
        prefersReducedMotionRef.current = media.matches;
      };

      update();
      media.addEventListener?.("change", update);

      return () => {
        media.removeEventListener?.("change", update);
      };
    }, []);

    const updatePointerHighlight = (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || prefersReducedMotionRef.current || !localRef.current) {
        return;
      }

      const rect = localRef.current.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));

      localRef.current.style.setProperty("--glass-x", `${x}%`);
      localRef.current.style.setProperty("--glass-y", `${y}%`);
    };

    const resetPointerHighlight = () => {
      if (!localRef.current) {
        return;
      }

      localRef.current.style.removeProperty("--glass-x");
      localRef.current.style.removeProperty("--glass-y");
    };

    const renderContent = (content: React.ReactNode) => (
      <>
        <span aria-hidden className="liquid-glass-orbit" />
        <span className="liquid-glass-label">
          {withIconMarker(iconLeft, "inline-start")}
          <span>{content}</span>
          {withIconMarker(iconRight, "inline-end")}
        </span>
      </>
    );

    const sharedClassName = cn(
      glassButtonVariants({ variant, size }),
      fullWidth && "w-full",
      className
    );

    const sharedHandlers = {
      onPointerEnter: composeEventHandlers(onPointerEnter, updatePointerHighlight),
      onPointerMove: composeEventHandlers(onPointerMove, updatePointerHighlight),
      onPointerLeave: composeEventHandlers(onPointerLeave, resetPointerHighlight),
    };

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      const childProps = child.props ?? {};
      const isDisabledLink = disabled
        ? {
            "aria-disabled": true,
            tabIndex: -1,
          }
        : {};

      return React.cloneElement(child, {
        ...props,
        ...isDisabledLink,
        ref: mergeRefs(localRef, ref as React.Ref<HTMLElement>),
        style: { ...style, ...childProps.style },
        className: cn(sharedClassName, childProps.className),
        onClick: composeEventHandlers(childProps.onClick, (event: React.MouseEvent<HTMLElement>) => {
          if (disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }

          onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>);
        }),
        onPointerEnter: composeEventHandlers(childProps.onPointerEnter, sharedHandlers.onPointerEnter),
        onPointerMove: composeEventHandlers(childProps.onPointerMove, sharedHandlers.onPointerMove),
        onPointerLeave: composeEventHandlers(childProps.onPointerLeave, sharedHandlers.onPointerLeave),
        "data-disabled": disabled ? "true" : undefined,
        children: renderContent(childProps.children),
      });
    }

    return (
      <button
        ref={mergeRefs(localRef, ref as React.Ref<HTMLElement>)}
        style={style}
        className={sharedClassName}
        disabled={disabled}
        data-disabled={disabled ? "true" : undefined}
        onClick={onClick}
        onPointerEnter={sharedHandlers.onPointerEnter}
        onPointerMove={sharedHandlers.onPointerMove}
        onPointerLeave={sharedHandlers.onPointerLeave}
        {...props}
      >
        {renderContent(children)}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };
