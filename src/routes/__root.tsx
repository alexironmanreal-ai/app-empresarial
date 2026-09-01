import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/layout";
import { Onboarding } from "@/components/onboarding";
import { PrintReport } from "@/components/print-report";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <>
      <Onboarding />
      <Shell>
        <Outlet />
      </Shell>
      <PrintReport />
    </>
  );
}
