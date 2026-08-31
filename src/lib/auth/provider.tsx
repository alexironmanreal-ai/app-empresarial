import type { ReactNode } from "react";

/**
 * App-wide client provider mounted once near the root.
 * Better Auth needs no context provider — this is a passthrough for future providers.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
