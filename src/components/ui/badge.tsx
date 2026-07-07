import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-medium tracking-[0.08em] transition-colors backdrop-blur-md',
  {
    variants: {
      variant: {
        default: 'border-indigo-400/18 bg-indigo-400/10 text-indigo-100',
        secondary: 'theme-surface-control text-[color:var(--theme-control-text-strong)] shadow-none',
        success: 'border-emerald-400/18 bg-emerald-400/10 text-emerald-100',
        warning: 'border-amber-300/18 bg-amber-300/10 text-amber-100',
        danger: 'border-red-400/18 bg-red-400/10 text-rose-100',
        outline: 'border-[color:var(--theme-control-border)] bg-transparent text-[color:var(--theme-control-text)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}

export { Badge, badgeVariants };
