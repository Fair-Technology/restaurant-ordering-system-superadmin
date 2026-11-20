import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Wraps a <table> in a glass card that scrolls horizontally instead of
 * overflowing the card. Shows a right-edge fade while more content remains
 * to the right.
 */
export function ScrollableTableCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
  }, []);

  useEffect(() => {
    check();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [check]);

  return (
    <div className="glass-card relative mb-4">
      <div ref={ref} onScroll={check} className="overflow-x-auto" data-testid="scroll-container">
        {children}
      </div>
      {canScrollRight && (
        <div
          aria-hidden="true"
          data-testid="scroll-affordance"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-[inherit] bg-gradient-to-l from-white/90 to-transparent"
        />
      )}
    </div>
  );
}
