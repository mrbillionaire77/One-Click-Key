import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDocsI18n } from '../i18n';

interface CodeExampleBlockProps {
  code: string;
  label?: string;
}

/**
 * Strictly read-only React JSX code preview block with BiDi LTR isolation
 * and one-click copy confirmation.
 */
export function CodeExampleBlock({ code, label }: CodeExampleBlockProps) {
  const { docs } = useDocsI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard permission denial
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label ? (
          <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void handleCopy();
          }}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />
              <span>{docs.common.copiedBtn}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{docs.common.copyBtn}</span>
            </>
          )}
        </Button>
      </div>

      <pre
        dir="ltr"
        className="max-w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 font-mono text-xs leading-relaxed text-[var(--foreground)] [unicode-bidi:isolate]"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
