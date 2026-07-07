import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-[color:var(--theme-field-border)] bg-[color:var(--theme-field-bg)] px-4 py-2 text-sm text-[color:var(--theme-field-text)] placeholder:text-[color:var(--theme-field-placeholder)] transition-all duration-200 focus-visible:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
