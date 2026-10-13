/**
 * The one close button [rozhodnuto 13. 10. 2026]: a thin black cross, the same
 * in the project detail, in Information and over a full-screen photo. There
 * were three — the "✕" character in two sizes and a white cross in a grey
 * circle — and a glyph looks different in every font and on every system.
 *
 * Drawn, so it is identical everywhere: two 1.5px strokes across a 16px box,
 * in the text colour. The button around it is 28px so it is comfortable to hit
 * without shifting the layout it sits in.
 */
export interface CloseButtonProps {
  onClick: () => void;
  /** What a screen reader announces; "Close" unless there are two on screen. */
  label?: string;
  className?: string;
}

export function CloseButton({ onClick, label = 'Close', className = '' }: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex size-[28px] shrink-0 cursor-pointer items-center justify-center text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M1.5 1.5L14.5 14.5M14.5 1.5L1.5 14.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
}
