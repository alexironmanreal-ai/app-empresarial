import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/layout";
import { Onboarding } from "@/components/onboarding";
import { PrintReport } from "@/components/print-report";
import { AuthGate } from "@/components/auth-gate";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <AuthGate>
      {(session) => (
        <>
          <Onboarding />
          <Shell session={session}>
            <Outlet />
          </Shell>
          <PrintReport />
        </>
      )}
    </AuthGate>
  );
}
