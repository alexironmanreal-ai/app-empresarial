/**
 * Ingresos y gastos vivos — pipeline + lista de referencia + estado pagado.
 */
import { EXPENSES, INCOME } from "./data";
import { getCachedArsPerUsd } from "./fx";
import type { ExpenseItem, IncomeStream } from "./types";
import type { WealthLead } from "./wealth-engine";
import { facturadoCobrado, pipelineOpen, velocityCobradoArs } from "./wealth-engine";

export type LiveIncomeBucket = {
  key: string;
  cobradoArs: number;
  pipelineArs: number;
  leadsCobrado: number;
  leadsPipeline: number;
};

export type LiveIncomeStream = IncomeStream & {
  earnedArs: number;
  pipelineArs: number;
  active: boolean;
  y1Ars: number;
  y5Ars: number;
  y10Ars: number;
};

export type LiveExpense = ExpenseItem & {
  paid: boolean;
  costArs: number;
  monthlyBurnArs: number;
  pendingArs: number;
};

export type IncomeLiveSummary = {
  cobradoArs: number;
  pipelineArs: number;
  velocity30dArs: number;
  byOffer: LiveIncomeBucket[];
  streams: LiveIncomeStream[];
};

export type ExpenseLiveSummary = {
  items: LiveExpense[];
  totalListArs: number;
  pendingArs: number;
  paidArs: number;
  monthlyFromListArs: number;
  oncePendingArs: number;
};

function rateOr(rate?: number) {
  return Number(rate) > 0 ? Number(rate) : getCachedArsPerUsd();
}

function offerMatchesStream(streamId: string, offer: string): boolean {
  const o = (offer || "").toLowerCase();
  switch (streamId) {
    case "retainer":
      return /retainer|consult|ceo|asesor|honor|dev |software|implement/.test(o) || o.length === 0;
    case "yt":
      return /youtube|yt|sponsor|adsense|canal/.test(o);
    case "product":
      return /product|curso|template|digital|saas/.test(o);
    case "os-lic":
      return /os|licen|kernel|sentinel/.test(o);
    default:
      return false;
  }
}

export function liveIncomeSummary(
  leads: WealthLead[] | null | undefined,
  arsPerUsd?: number,
): IncomeLiveSummary {
  const list = leads ?? [];
  const rate = rateOr(arsPerUsd);
  const cobradoArs = facturadoCobrado(list);
  const pipelineArs = pipelineOpen(list);
  const velocity30dArs = velocityCobradoArs(list, 30);

  const byOfferMap = new Map<string, LiveIncomeBucket>();
  for (const l of list) {
    const key = (l.offer || "Sin oferta").trim() || "Sin oferta";
    let b = byOfferMap.get(key);
    if (!b) {
      b = { key, cobradoArs: 0, pipelineArs: 0, leadsCobrado: 0, leadsPipeline: 0 };
      byOfferMap.set(key, b);
    }
    const amt = Number(l.amountArs) || 0;
    if (l.stage === "cobrado") {
      b.cobradoArs += amt;
      b.leadsCobrado += 1;
    } else if (l.stage !== "perdido") {
      b.pipelineArs += amt;
      b.leadsPipeline += 1;
    }
  }
  const byOffer = [...byOfferMap.values()].sort((a, b) => b.cobradoArs - a.cobradoArs);

  const streams: LiveIncomeStream[] = INCOME.map((s) => {
    let earnedArs = 0;
    let pipe = 0;
    for (const l of list) {
      if (!offerMatchesStream(s.id, l.offer || "")) continue;
      const amt = Number(l.amountArs) || 0;
      if (l.stage === "cobrado") earnedArs += amt;
      else if (l.stage !== "perdido") pipe += amt;
    }
    return {
      ...s,
      earnedArs,
      pipelineArs: pipe,
      active: earnedArs > 0 || pipe > 0,
      y1Ars: Math.round(s.y1 * rate),
      y5Ars: Math.round(s.y5 * rate),
      y10Ars: Math.round(s.y10 * rate),
    };
  });

  return { cobradoArs, pipelineArs, velocity30dArs, byOffer, streams };
}

export function liveExpenseSummary(
  paidExpenseIds: string[] | null | undefined,
  arsPerUsd?: number,
): ExpenseLiveSummary {
  const paid = new Set(paidExpenseIds ?? []);
  const rate = rateOr(arsPerUsd);

  const items: LiveExpense[] = EXPENSES.map((e) => {
    const costArs = Math.round(e.usd * rate);
    const isPaid = paid.has(e.id);
    let monthlyBurnArs = 0;
    if (e.kind === "month") monthlyBurnArs = costArs;
    else if (e.kind === "year") monthlyBurnArs = Math.round(costArs / 12);

    let pendingArs = 0;
    if (!isPaid) {
      if (e.kind === "once") pendingArs = costArs;
      else if (e.kind === "month") pendingArs = costArs;
      else pendingArs = costArs;
    }

    return {
      ...e,
      paid: isPaid,
      costArs,
      monthlyBurnArs,
      pendingArs,
    };
  });

  const totalListArs = items.reduce((a, e) => a + e.costArs, 0);
  const pendingArs = items.reduce((a, e) => a + e.pendingArs, 0);
  const paidArs = items.filter((e) => e.paid).reduce((a, e) => a + e.costArs, 0);
  const monthlyFromListArs = items.reduce((a, e) => a + e.monthlyBurnArs, 0);
  const oncePendingArs = items
    .filter((e) => e.kind === "once" && !e.paid)
    .reduce((a, e) => a + e.costArs, 0);

  return {
    items,
    totalListArs,
    pendingArs,
    paidArs,
    monthlyFromListArs,
    oncePendingArs,
  };
}
