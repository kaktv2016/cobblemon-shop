'use client';

import * as React from 'react';

interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  const menuRef = React.useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setUncontrolledOpen(newOpen);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    <DropdownMenuContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div ref={menuRef} className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ asChild, children, ...props }: any) {
  const { onOpenChange, open } = useDropdownMenu();

  if (asChild) {
    return React.cloneElement(children, {
      onClick: (e: any) => {
        children.props.onClick?.(e);
        onOpenChange(!open);
      },
      'aria-expanded': open,
      ...props,
    });
  }

  return (
    <button onClick={() => onOpenChange(!open)} aria-expanded={open} {...props}>
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
  ...props
}: DropdownMenuContentProps) {
  const { open } = useDropdownMenu();

  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  const sideClasses = {
    top: 'bottom-full mb-2',
    right: 'left-full ml-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
  };

  return (
    <div
      className={`theme-surface-menu absolute ${sideClasses[side]} ${alignClasses[align]} z-50 min-w-[200px] rounded-lg animate-in fade-in-0 zoom-in-95 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
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
  const itemClassName = `w-full text-left px-4 py-2 text-sm text-[color:var(--theme-control-text)] hover:bg-[color:var(--theme-control-bg-hover)] hover:text-[color:var(--theme-control-text-strong)] focus-visible:outline-none focus-visible:bg-[color:var(--theme-control-bg-hover)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`;

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
