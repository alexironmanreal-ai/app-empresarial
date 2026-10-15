import { FisicaDelDia } from "@/components/fisica-del-dia";
import { KillList } from "@/components/kill-list";
import { ContractsPanel } from "@/components/contracts-panel";
import { BrandPanel } from "@/components/brand-panel";

/** Bloque HQ: física + brand/logo + contracts + kill list */
export function HqElonBlock() {
  return (
    <>
      <FisicaDelDia />
      <div className="grid gap-6 lg:grid-cols-3">
        <BrandPanel />
        <ContractsPanel />
        <KillList />
      </div>
    </>
  );
}
