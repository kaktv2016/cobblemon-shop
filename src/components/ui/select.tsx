import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <div className="relative inline-flex w-full">
      <select
        ref={ref}
        className={cn(
          'h-10 w-full appearance-none rounded-lg border border-[color:var(--theme-field-border)] bg-[color:var(--theme-field-bg)] px-4 py-2 pr-10 text-sm text-[color:var(--theme-field-text)] placeholder:text-[color:var(--theme-field-placeholder)] transition-all duration-200 focus-visible:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--theme-field-placeholder)]" />
    </div>
  ),
);
Select.displayName = 'Select';

export { Select };
