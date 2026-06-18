// =========================================================================
// CopyButton — Reusable Clause Text Clipboard Component
// =========================================================================
// Displays a small icon button that copies the provided `text` prop to the
// user's clipboard using the navigator.clipboard API.
//
// Interaction Flow:
//   1. Default state  → shows a "Copy" icon (subtle, visible on hover).
//   2. On click       → copies text, transitions to a "Check" icon + "Copied!"
//                       label for 2 seconds with a smooth fade/scale animation.
//   3. After 2s       → automatically resets back to the default Copy icon.
//
// Usage:
//   <div className="relative group">
//     <CopyButton text={clause.clauseText} />
//     <p>{clause.clauseText}</p>
//   </div>
//
// The button is positioned absolute (top-right) so it floats neatly over
// the text container without disrupting the layout flow.

import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * @param {string} text  - The string value to copy to the clipboard.
 * @param {string} [className] - Optional extra Tailwind classes for positioning overrides.
 */
const CopyButton = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e) => {
    // Prevent the click from bubbling up to the parent container (e.g. expandable panels)
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Reset the icon back to "Copy" after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Graceful fallback: if the Clipboard API is unavailable (e.g., non-HTTPS),
      // silently log and do nothing so the app never crashes.
      console.warn('[CopyButton] Clipboard API unavailable:', err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard!' : 'Copy clause text'}
      aria-label={copied ? 'Copied!' : 'Copy clause text'}
      className={`
        absolute top-2 right-2 z-10
        flex items-center gap-1
        px-2 py-1 rounded-md
        text-[9px] font-bold uppercase tracking-wider
        border transition-all duration-200 ease-out
        cursor-pointer select-none
        opacity-0 group-hover:opacity-100
        ${copied
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 scale-100'
          : 'bg-navy-900/80 border-navy-700/60 text-slate-400 hover:text-slate-200 hover:border-navy-600/80 hover:bg-navy-800/80 scale-95 hover:scale-100'
        }
        ${className}
      `}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 stroke-[2.5]" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 stroke-[2]" />
          Copy
        </>
      )}
    </button>
  );
};

export default CopyButton;
