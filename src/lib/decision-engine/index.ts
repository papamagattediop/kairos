export type BalanceInputs = {
  demandKt: number | null;
  productionKt: number | null;
  importsKt: number | null;
  stockReleaseKt: number | null;
};

export type BalanceResult =
  | {
      state: "insufficient_data";
      missingInputs: string[];
      reasons: string[];
    }
  | {
      state: "scenario";
      gapKt: number;
      inputs: {
        demandKt: number;
        productionKt: number;
        importsKt: number;
        stockReleaseKt: number;
      };
      formula: "demand - production - imports - stock release";
    };

const REQUIRED_FIELDS: Array<keyof BalanceInputs> = [
  "demandKt",
  "productionKt",
  "importsKt",
  "stockReleaseKt",
];

const FIELD_LABELS: Record<keyof BalanceInputs, string> = {
  demandKt: "Utilisation intérieure",
  productionKt: "Production disponible",
  importsKt: "Importations nettes",
  stockReleaseKt: "Contribution nette des stocks",
};

export function calculateBalance(inputs: BalanceInputs): BalanceResult {
  const missingInputs = REQUIRED_FIELDS.filter((field) => {
    const value = inputs[field];
    return value === null || !Number.isFinite(value);
  });

  if (missingInputs.length > 0) {
    return {
      state: "insufficient_data",
      missingInputs: missingInputs.map((field) => FIELD_LABELS[field]),
      reasons: [
        "Le calcul de scénario exige une valeur numérique pour chaque terme du bilan.",
        "Une donnée absente ne peut pas être remplacée silencieusement par zéro.",
      ],
    };
  }

  const { demandKt, productionKt, importsKt, stockReleaseKt } = inputs;

  if (
    demandKt === null ||
    productionKt === null ||
    importsKt === null ||
    stockReleaseKt === null
  ) {
    return {
      state: "insufficient_data",
      missingInputs: ["Valeur de bilan invalide"],
      reasons: ["Une ou plusieurs entrées ne sont pas numériques."],
    };
  }

  if (demandKt < 0 || productionKt < 0 || importsKt < 0) {
    return {
      state: "insufficient_data",
      missingInputs: ["Valeurs négatives non autorisées"],
      reasons: [
        "L'utilisation, la production et les importations doivent être nulles ou positives.",
      ],
    };
  }

  return {
    state: "scenario",
    gapKt: demandKt - productionKt - importsKt - stockReleaseKt,
    inputs: { demandKt, productionKt, importsKt, stockReleaseKt },
    formula: "demand - production - imports - stock release",
  };
}
