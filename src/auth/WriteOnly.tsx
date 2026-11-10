import type { ReactNode } from 'react';
import { useCanWrite } from './platformAccess';

/** Renders children only for operators with write access; read-only operators see nothing. */
export function WriteOnly({ children }: { children: ReactNode }) {
  return useCanWrite() ? <>{children}</> : null;
}

/**
 * Wraps a form so that, for read-only operators, every input and button inside is natively disabled
 * (a disabled fieldset disables its descendants). Pair with <WriteOnly> around save buttons.
 */
export function WriteFieldset({ children, className }: { children: ReactNode; className?: string }) {
  const canWrite = useCanWrite();
  return (
    <fieldset disabled={!canWrite} className={`min-w-0 border-0 p-0 m-0 ${className ?? ''}`}>
      {children}
    </fieldset>
  );
}
