import { FisicaDelDia } from "./fisica-del-dia";
import { ContractsPanel } from "./contracts-panel";
import { KillList } from "./kill-list";

export function HqElonBlock() {
  return (
    <div className="space-y-4">
      <FisicaDelDia />
      <div className="grid gap-4 lg:grid-cols-2">
        <ContractsPanel />
        <KillList />
      </div>
    </div>
  );
}
