import { Route as rootRoute } from "./routes/__root";
import { Route as IndexRoute } from "./routes/index";
import { Route as TareasRoute } from "./routes/tareas";
import { Route as EmpresaRoute } from "./routes/empresa";
import { Route as FinanzasRoute } from "./routes/finanzas";
import { Route as YoutubeRoute } from "./routes/youtube";
import { Route as MailRoute } from "./routes/mail";
import { Route as EquipoRoute } from "./routes/equipo";
import { Route as OsRoute } from "./routes/os";
import { Route as CeoRoute } from "./routes/ceo";
import { Route as TrackerRoute } from "./routes/tracker";
import { Route as RegistrosRoute } from "./routes/registros";
import { Route as PipelineRoute } from "./routes/pipeline";
import { Route as TiempoRoute } from "./routes/tiempo";
import { Route as CvRoute } from "./routes/cv";
import { Route as CreadorRoute } from "./routes/creador";

const indexRoute = IndexRoute.update({ id: "/", path: "/", getParentRoute: () => rootRoute });
const tareasRoute = TareasRoute.update({ id: "/tareas", path: "/tareas", getParentRoute: () => rootRoute });
const empresaRoute = EmpresaRoute.update({ id: "/empresa", path: "/empresa", getParentRoute: () => rootRoute });
const finanzasRoute = FinanzasRoute.update({ id: "/finanzas", path: "/finanzas", getParentRoute: () => rootRoute });
const youtubeRoute = YoutubeRoute.update({ id: "/youtube", path: "/youtube", getParentRoute: () => rootRoute });
const mailRoute = MailRoute.update({ id: "/mail", path: "/mail", getParentRoute: () => rootRoute });
const equipoRoute = EquipoRoute.update({ id: "/equipo", path: "/equipo", getParentRoute: () => rootRoute });
const osRoute = OsRoute.update({ id: "/os", path: "/os", getParentRoute: () => rootRoute });
const ceoRoute = CeoRoute.update({ id: "/ceo", path: "/ceo", getParentRoute: () => rootRoute });
const trackerRoute = TrackerRoute.update({ id: "/tracker", path: "/tracker", getParentRoute: () => rootRoute });
const registrosRoute = RegistrosRoute.update({ id: "/registros", path: "/registros", getParentRoute: () => rootRoute });
const pipelineRoute = PipelineRoute.update({ id: "/pipeline", path: "/pipeline", getParentRoute: () => rootRoute });
const tiempoRoute = TiempoRoute.update({ id: "/tiempo", path: "/tiempo", getParentRoute: () => rootRoute });
const cvRoute = CvRoute.update({ id: "/cv", path: "/cv", getParentRoute: () => rootRoute });
const creadorRoute = CreadorRoute.update({ id: "/creador", path: "/creador", getParentRoute: () => rootRoute });

export const routeTree = rootRoute.addChildren([
  indexRoute,
  tareasRoute,
  empresaRoute,
  finanzasRoute,
  youtubeRoute,
  mailRoute,
  equipoRoute,
  osRoute,
  ceoRoute,
  trackerRoute,
  registrosRoute,
  pipelineRoute,
  tiempoRoute,
  cvRoute,
  creadorRoute,
]);
