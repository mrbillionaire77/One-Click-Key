import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-45 cursor-pointer select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] active:scale-[0.99]',
        secondary:
          'bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]',
        outline:
          'bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)]',
        ghost:
          'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]',
        destructive:
          'bg-[var(--destructive-subtle)] text-[var(--destructive)] border border-[var(--destructive)]/30 hover:bg-[var(--destructive)] hover:text-white',
      },
      size: {
        default: 'min-h-[44px] px-4 py-2.5',
        sm: 'min-h-[38px] px-3 py-1.5 text-xs',
        lg: 'min-h-[48px] px-6 py-3 text-sm font-semibold',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
