import { createContext, useContext } from 'react';

/** Defaults to read-only (fail closed) when no provider is mounted. */
export const CanWriteContext = createContext<boolean>(false);

export function useCanWrite(): boolean {
  return useContext(CanWriteContext);
}
