import { Check, ChevronDown, Languages, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { GitHubIcon } from '@/components/GitHubIcon';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { useI18n } from '@/i18n';
import type { Locale } from '@/i18n/types';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const REPO_URL = 'https://github.com/mrbillionaire77/One-Click-Key';

const LANGUAGE_OPTIONS: ReadonlyArray<{ code: Locale; nativeLabel: string; dir: 'ltr' | 'rtl' }> = [
  { code: 'en', nativeLabel: 'English', dir: 'ltr' },
  { code: 'ar', nativeLabel: 'العربية', dir: 'rtl' },
];

export function AppHeader({ theme, onToggleTheme }: AppHeaderProps) {
  const { t, locale, changeLocale, isSwitchingLocale } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const currentLangLabel = locale === 'ar' ? 'العربية' : 'English';

  const handleSelectLanguage = (next: Locale) => {
    setMenuOpen(false);
    if (next !== locale) {
      changeLocale(next);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <BrandLogo size={30} className="shrink-0" />
          <span
            dir="ltr"
            className="text-base font-bold tracking-tight text-[var(--foreground)] whitespace-nowrap shrink-0"
          >
            {t.meta.brandName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PWAInstallButton />

          {/* Explicit Language Dropdown Menu */}
          <div ref={menuContainerRef} className="relative">
            <button
              type="button"
              disabled={isSwitchingLocale}
              aria-label={t.header.selectLanguage}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[var(--border)] bg-transparent px-3 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Languages className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
              <span>{currentLangLabel}</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-[var(--muted-foreground)] transition-transform duration-150',
                  menuOpen && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label={t.header.selectLanguage}
                className="absolute end-0 mt-1.5 w-40 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-1 shadow-lg z-40"
              >
                {LANGUAGE_OPTIONS.map((option) => {
                  const isActive = option.code === locale;
                  return (
                    <button
                      key={option.code}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      onClick={() => handleSelectLanguage(option.code)}
                      className={cn(
                        'flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                        isActive
                          ? 'bg-[var(--accent-subtle)] text-[var(--foreground)] font-semibold'
                          : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]',
                      )}
                    >
                      <span dir={option.dir}>{option.nativeLabel}</span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? t.header.toggleThemeLight : t.header.toggleThemeDark}
            title={theme === 'dark' ? t.header.toggleThemeLight : t.header.toggleThemeDark}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.header.githubRepo}
            title={t.header.githubRepo}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] shrink-0"
          >
            <GitHubIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
