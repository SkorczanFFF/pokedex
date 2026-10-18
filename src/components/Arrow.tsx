/**
 * An arrow, pointed by turning it with `className`. Always the down arrow: the
 * pixel font has none, and the fallback font's → is a hairline beside its ↓.
 */
export const Arrow = ({ className = "" }: { className?: string }) => (
  <span aria-hidden="true" className={`inline-block ${className}`}>
    ↓
  </span>
);
