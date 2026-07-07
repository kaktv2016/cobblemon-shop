import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[120px] w-full resize-none rounded-lg border border-[color:var(--theme-field-border)] bg-[color:var(--theme-field-bg)] px-4 py-2 text-sm text-[color:var(--theme-field-text)] placeholder:text-[color:var(--theme-field-placeholder)] transition-all duration-200 focus-visible:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };
