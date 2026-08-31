import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { Shell } from "@/components/layout";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
