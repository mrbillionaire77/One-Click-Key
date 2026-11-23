import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={hasError || undefined}
        className={cn(
          'flex min-h-[44px] w-full rounded-lg border bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50',
          hasError
            ? 'border-[var(--destructive)] focus-visible:ring-[var(--destructive)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
