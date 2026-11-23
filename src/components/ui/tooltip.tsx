import * as PopoverPrimitive from '@radix-ui/react-popover';
import { HelpCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

interface FieldTooltipProps {
  text: string;
  label: string;
}

/**
 * Touch-friendly hybrid click-and-hover help popover:
 * - Mobile / Touch: Tap toggles open/closed; tapping outside or pressing Escape dismisses.
 * - Desktop: Mouse hover previews smoothly; clicking pins open until clicked again, outside click, or Escape.
 * - Collision-aware positioning prevents clipping on narrow mobile screens in both RTL and LTR.
 */
export function FieldTooltip({ text, label }: FieldTooltipProps) {
  const { dir } = useI18n();
  const [open, setOpen] = useState(false);
  const [pinnedByClick, setPinnedByClick] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    clearCloseTimer();
    setOpen(nextOpen);
    if (!nextOpen) {
      setPinnedByClick(false);
    }
  };

  const handlePointerEnter = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    clearCloseTimer();
    setOpen(true);
  };

  const handlePointerLeave = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse' || pinnedByClick) return;
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 140);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent Radix default toggle so hover-opened desktop popovers pin cleanly on first click
    event.preventDefault();
    clearCloseTimer();

    if (open && pinnedByClick) {
      setOpen(false);
      setPinnedByClick(false);
      return;
    }

    if (open && !pinnedByClick) {
      setPinnedByClick(true);
      return;
    }

    setOpen(true);
    setPinnedByClick(true);
  };

  const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
    if (event.currentTarget.matches(':focus-visible')) {
      clearCloseTimer();
      setOpen(true);
    }
  };

  const handleBlur = () => {
    if (pinnedByClick) return;
    clearCloseTimer();
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={handleClick}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          className={cn(
            '-my-1.5 inline-flex h-9 w-9 sm:my-0 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer select-none',
            open
              ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]',
          )}
        >
          <HelpCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          dir={dir}
          side="top"
          align="center"
          sideOffset={8}
          collisionPadding={12}
          avoidCollisions
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={cn(
            'z-50 w-auto max-w-[min(20rem,calc(100vw-24px))] rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-start text-xs leading-relaxed text-[var(--foreground)] shadow-lg outline-none',
          )}
        >
          {text}
          <PopoverPrimitive.Arrow
            width={10}
            height={5}
            className="fill-[var(--border-strong)]"
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
