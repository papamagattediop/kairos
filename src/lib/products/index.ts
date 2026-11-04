// Niveau de maturité par produit (voir docs/ARCHITECTURE.md, section 5).
// 0 envisagé, 1 données secondaires identifiées, 2 méthode testée sur échantillon,
// 3 validée sur une zone et une saison, 4 opérationnel.
export type MaturityLevel = 0 | 1 | 2 | 3 | 4;

export type Display = "refusal" | "observed_balance" | "labelled_estimate" | "estimate_with_interval";

export type Product = {
  id: string;
  label: string;
  level: MaturityLevel;
  note: string;
};

// L'ordre n'est pas un classement de consommation : il n'est pas établi ici.
export const PRODUCTS: Product[] = [
  {
    id: "rice",
    label: "Riz",
    level: 1,
    note: "Séries FAOSTAT et USDA PSD identifiées; extraction et harmonisation à faire.",
  },
  { id: "millet", label: "Mil", level: 0, note: "Données non examinées." },
  { id: "maize", label: "Maïs", level: 0, note: "Données non examinées." },
  { id: "groundnut", label: "Arachide", level: 0, note: "Données non examinées." },
  { id: "onion", label: "Oignon", level: 0, note: "Prix ANSD et WFP signalés; bilan non examiné." },
  { id: "cowpea", label: "Niébé", level: 0, note: "Données non examinées." },
];

export function displayFor(level: MaturityLevel): Display {
  if (level <= 0) return "refusal";
  if (level === 1) return "observed_balance";
  if (level === 2) return "labelled_estimate";
  return "estimate_with_interval";
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
