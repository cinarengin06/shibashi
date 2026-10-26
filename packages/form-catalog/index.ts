import { BODY_GATE_ORDER, gates, movementGateWeights, type GateId } from "../eight-gates";
import { getMovementOrganVisuals, getMovementEnergyTag, meridianMovements } from "../meridian-knowledge";

// Rounded from the 18 bundled teacher MP4 files with ffprobe. This is video
// length, not the suggested duration of a full practice session.
const videoSeconds = [10, 15, 15, 12, 16, 11, 18, 16, 22, 12, 15, 14, 10, 16, 10, 19, 11, 11] as const;

export type CatalogEnergy = "all" | "Yin" | "Yang";
export type CatalogStatus = "all" | "completed" | "remaining";
export type FormCatalogFilters = { energy: CatalogEnergy; status: CatalogStatus; organ: string; gate: GateId | "all" };
export const emptyFormCatalogFilters: FormCatalogFilters = { energy:"all", status:"all", organ:"all", gate:"all" };

export const formCatalog = meridianMovements.map(movement => ({
  order:movement.order,
  title:movement.sourceTitle,
  energy:getMovementEnergyTag(movement.order).quality,
  action:getMovementEnergyTag(movement.order).action,
  seconds:videoSeconds[movement.order-1] ?? 0,
  organs:getMovementOrganVisuals(movement.primaryMeridians,movement.secondaryMeridians).map(organ=>organ.label),
  gates:BODY_GATE_ORDER.filter(id=>Boolean(movementGateWeights[movement.order]?.[id])),
  gateNames:BODY_GATE_ORDER.filter(id=>Boolean(movementGateWeights[movement.order]?.[id])).map(id=>gates[id].name),
}));

export const catalogOrgans=[...new Set(formCatalog.flatMap(form=>form.organs))].sort((a,b)=>a.localeCompare(b,"tr"));
export const catalogGates=BODY_GATE_ORDER.map(id=>({id,name:gates[id].name}));

export function filterFormCatalog(filters:FormCatalogFilters,completedOrders:Iterable<number>) {
  const completed=new Set(completedOrders);
  return formCatalog.filter(form=>
    (filters.energy==="all"||form.energy===filters.energy) &&
    (filters.status==="all"||(filters.status==="completed"?completed.has(form.order):!completed.has(form.order))) &&
    (filters.organ==="all"||form.organs.includes(filters.organ)) &&
    (filters.gate==="all"||form.gates.includes(filters.gate))
  );
}

export function readFormCatalogFilters(values:{energy?:string|null;status?:string|null;organ?:string|null;gate?:string|null}):FormCatalogFilters {
  return {
    energy:values.energy==="Yin"||values.energy==="Yang"?values.energy:"all",
    status:values.status==="completed"||values.status==="remaining"?values.status:"all",
    organ:values.organ&&catalogOrgans.includes(values.organ)?values.organ:"all",
    gate:values.gate&&catalogGates.some(gate=>gate.id===values.gate)?values.gate as GateId:"all",
  };
}
