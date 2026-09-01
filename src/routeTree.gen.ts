import { Route as rootRoute } from "./routes/__root";
import { Route as IndexRoute } from "./routes/index";
import { Route as TareasRoute } from "./routes/tareas";
import { Route as EmpresaRoute } from "./routes/empresa";
import { Route as FinanzasRoute } from "./routes/finanzas";
import { Route as YoutubeRoute } from "./routes/youtube";
import { Route as OsRoute } from "./routes/os";
import { Route as CeoRoute } from "./routes/ceo";
import { Route as TrackerRoute } from "./routes/tracker";

const indexRoute = IndexRoute.update({ id: "/", path: "/", getParentRoute: () => rootRoute });
const tareasRoute = TareasRoute.update({ id: "/tareas", path: "/tareas", getParentRoute: () => rootRoute });
const empresaRoute = EmpresaRoute.update({ id: "/empresa", path: "/empresa", getParentRoute: () => rootRoute });
const finanzasRoute = FinanzasRoute.update({ id: "/finanzas", path: "/finanzas", getParentRoute: () => rootRoute });
const youtubeRoute = YoutubeRoute.update({ id: "/youtube", path: "/youtube", getParentRoute: () => rootRoute });
const osRoute = OsRoute.update({ id: "/os", path: "/os", getParentRoute: () => rootRoute });
const ceoRoute = CeoRoute.update({ id: "/ceo", path: "/ceo", getParentRoute: () => rootRoute });
const trackerRoute = TrackerRoute.update({ id: "/tracker", path: "/tracker", getParentRoute: () => rootRoute });

export const routeTree = rootRoute.addChildren([
  indexRoute,
  tareasRoute,
  empresaRoute,
  finanzasRoute,
  youtubeRoute,
  osRoute,
  ceoRoute,
  trackerRoute,
]);
