import { FisicaDelDia } from "@/components/fisica-del-dia";
import { KillList } from "@/components/kill-list";
import { ContractsPanel } from "@/components/contracts-panel";

/** Bloque HQ: física + contracts + kill list */
export function HqElonBlock() {
  return (
    <>
      <FisicaDelDia />
      <div className="grid gap-8 lg:grid-cols-2">
        <ContractsPanel />
        <KillList />
      </div>
    </>
  );
}
