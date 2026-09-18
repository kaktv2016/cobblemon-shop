'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  menuId: string;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within DropdownMenu');
  }
  return context;
}

interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function DropdownMenu({ open: controlledOpen, onOpenChange, children }: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const menuId = React.useId();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setUncontrolledOpen(newOpen);
    }
  }, [isControlled, onOpenChange]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !contentRef.current?.contains(target)) {
        handleOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        handleOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, handleOpenChange]);

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: handleOpenChange, triggerRef, contentRef, menuId }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ asChild, children, ...props }: any) {
  const { onOpenChange, open, triggerRef, menuId } = useDropdownMenu();

  if (asChild) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: (e: any) => {
        children.props.onClick?.(e);
        onOpenChange(!open);
      },
      'aria-expanded': open,
      'aria-haspopup': 'menu',
      'aria-controls': open ? menuId : undefined,
      ...props,
    });
  }

  return (
    <button ref={triggerRef as React.Ref<HTMLButtonElement>} onClick={() => onOpenChange(!open)} aria-expanded={open} aria-haspopup="menu" aria-controls={open ? menuId : undefined} {...props}>
      {children}
    </button>
  );
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

function DropdownMenuContent({
  align = 'start',
  side = 'bottom',
  children,
  className,
  style,
  ...props
}: DropdownMenuContentProps) {
  const { open, triggerRef, contentRef, menuId } = useDropdownMenu();
  const [mounted, setMounted] = React.useState(false);
  const [position, setPosition] = React.useState<React.CSSProperties>({ visibility: 'hidden' });
  const [adminTheme, setAdminTheme] = React.useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const margin = 8;
    const gap = 6;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let resolvedSide = side;
    let top = triggerRect.bottom + gap;
    let left = triggerRect.left;

    if (side === 'bottom' && top + contentRect.height > viewportHeight - margin && triggerRect.top - gap - contentRect.height >= margin) {
      resolvedSide = 'top';
    } else if (side === 'top' && triggerRect.top - gap - contentRect.height < margin && triggerRect.bottom + gap + contentRect.height <= viewportHeight - margin) {
      resolvedSide = 'bottom';
    } else if (side === 'right' && triggerRect.right + gap + contentRect.width > viewportWidth - margin && triggerRect.left - gap - contentRect.width >= margin) {
      resolvedSide = 'left';
    } else if (side === 'left' && triggerRect.left - gap - contentRect.width < margin && triggerRect.right + gap + contentRect.width <= viewportWidth - margin) {
      resolvedSide = 'right';
    }

    if (resolvedSide === 'top') top = triggerRect.top - contentRect.height - gap;
    if (resolvedSide === 'bottom') top = triggerRect.bottom + gap;
    if (resolvedSide === 'left') left = triggerRect.left - contentRect.width - gap;
    if (resolvedSide === 'right') left = triggerRect.right + gap;

    if (resolvedSide === 'top' || resolvedSide === 'bottom') {
      if (align === 'center') left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
      if (align === 'end') left = triggerRect.right - contentRect.width;
    } else {
      top = triggerRect.top;
      if (align === 'center') top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
      if (align === 'end') top = triggerRect.bottom - contentRect.height;
    }

    left = Math.max(margin, Math.min(left, viewportWidth - contentRect.width - margin));
    top = Math.max(margin, Math.min(top, viewportHeight - contentRect.height - margin));
    setPosition({ position: 'fixed', top, left, visibility: 'visible', maxHeight: viewportHeight - margin * 2 });
    content.dataset.side = resolvedSide;
    setAdminTheme(trigger.closest('.admin-theme')?.getAttribute('data-admin-theme') ?? null);
  }, [align, contentRef, side, triggerRef]);

  React.useLayoutEffect(() => {
    if (!open || !mounted) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [mounted, open, updatePosition]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={contentRef}
      id={menuId}
      role="menu"
      data-admin-theme={adminTheme ?? undefined}
      className={`${adminTheme ? 'admin-theme ' : ''}theme-surface-menu dropdown-menu-content z-[100] min-w-[200px] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl py-1 animate-in fade-in-0 zoom-in-95 ${className || ''}`}
      style={{ ...position, ...style }}
      {...props}
    >{children}</div>,
    triggerRef.current?.closest('.admin-theme') ?? document.body,
  );
}

function DropdownMenuGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  children: React.ReactNode;
}

function DropdownMenuItem({
  asChild,
  children,
  className,
  disabled,
  onSelect,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { onOpenChange } = useDropdownMenu();
  const itemClassName = `flex w-full items-center text-left px-4 py-2.5 text-sm text-[color:var(--theme-control-text)] hover:bg-[color:var(--theme-control-bg-hover)] hover:text-[color:var(--theme-control-text-strong)] focus-visible:outline-none focus-visible:bg-[color:var(--theme-control-bg-hover)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`;

  const handleItemClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onClick?.(event as React.MouseEvent<HTMLButtonElement>);
    onSelect?.();
    onOpenChange(false);
  };

  if (asChild) {
    if (!React.isValidElement(children)) {
      return null;
    }

    const child = children as React.ReactElement<any>;

    return React.cloneElement(child, {
      ...props,
      "aria-disabled": disabled,
      role: "menuitem",
      className: [itemClassName, child.props.className].filter(Boolean).join(" "),
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(event);
        handleItemClick(event);
      },
    });
  }

  return (
    <button
      type="button"
      role="menuitem"
      className={itemClassName}
      disabled={disabled}
      onClick={handleItemClick}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-4 py-2 text-xs font-semibold text-[color:var(--portal-kicker)] ${className || ''}`} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`my-1 h-px bg-[color:var(--theme-control-border)] ${className || ''}`} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
