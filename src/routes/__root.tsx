import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Shell } from "@/components/layout";
import { Onboarding } from "@/components/onboarding";
import { PrintReport } from "@/components/print-report";
import { AuthGate } from "@/components/auth-gate";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isWidget = pathname === "/widget";

  // Widget flotante: sin shell, auth ni onboarding (lee el mismo store local)
  if (isWidget) {
    return <Outlet />;
  }

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
