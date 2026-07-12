import type { SellingUnit } from "@/lib/types";

const labels: Record<SellingUnit, string> = {
  UNIT: "unit",
  METRE: "metre",
  ROLL: "roll",
  CARTON: "carton",
  BOX: "box",
  PACK: "pack",
  PAIR: "pair",
  SET: "set",
  LITRE: "litre",
  KILOGRAM: "kilogram"
};

export function sellingUnitLabel(unit: SellingUnit) {
  return labels[unit];
}
