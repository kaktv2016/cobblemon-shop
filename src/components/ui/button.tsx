import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-[0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border border-cyan-300/18 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 text-slate-950 shadow-[0_14px_38px_rgba(56,189,248,0.18)] hover:-translate-y-px hover:shadow-[0_18px_46px_rgba(56,189,248,0.24)]',
        secondary:
          'theme-surface-control text-[color:var(--theme-control-text-strong)] hover:-translate-y-px',
        outline:
          'border border-[color:var(--theme-control-border)] bg-transparent text-[color:var(--theme-control-text)] hover:-translate-y-px hover:border-[color:var(--theme-control-border-strong)] hover:bg-[color:var(--theme-control-bg)] hover:text-[color:var(--theme-control-text-strong)]',
        ghost:
          'text-[color:var(--theme-control-text)] hover:text-[color:var(--theme-control-text-strong)] hover:bg-[color:var(--theme-control-bg-hover)]',
        destructive:
          'border border-red-400/18 bg-red-500/80 text-white shadow-[0_14px_34px_rgba(239,68,68,0.16)] hover:-translate-y-px hover:bg-red-500',
        accent:
          'border border-amber-300/18 bg-gradient-to-r from-amber-300 to-orange-300 text-gray-950 shadow-[0_14px_38px_rgba(251,191,36,0.18)] hover:-translate-y-px hover:shadow-[0_18px_42px_rgba(251,191,36,0.22)] font-semibold',
      },
      size: {
        default: 'h-10 rounded-full px-4 py-2',
        sm: 'h-9 rounded-full px-4 text-xs',
        lg: 'h-12 rounded-full px-8 text-sm',
        icon: 'h-10 w-10 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const shouldSpotlight = variant !== 'ghost' && size !== 'icon';
    const buttonClassName = cn(
      buttonVariants({ variant, size, className }),
      shouldSpotlight ? 'spotlight-button overflow-hidden' : null
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;

      return React.cloneElement(child, {
        ...props,
        ref,
        'data-spotlight': shouldSpotlight ? '' : undefined,
        className: cn(buttonClassName, child.props.className),
      });
    }

    return (
      <button
        ref={ref}
        data-spotlight={shouldSpotlight ? '' : undefined}
        className={buttonClassName}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
