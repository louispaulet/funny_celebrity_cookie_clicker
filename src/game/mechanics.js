export const MOLECULE_KG = 0.0440095 / 6.02214076e23;
export const CELEBRITY_BENCHMARK_KG = 8_300_000;
export const PRIVATE_FLIGHT_AVG_KG = 3_600;
export const SAVE_KEY = "jetlag-billionaire-save-v2";

export const kgToMolecules = (kg) => kg / MOLECULE_KG;
export const moleculesToKg = (molecules) => molecules * MOLECULE_KG;

export const buyableEmitters = [
  {
    id: "kettle",
    name: "Boil Water Twice",
    description: "A tiny domestic plume for the guilt portfolio.",
    baseCost: 12,
    cps: 0.8,
    unlockAt: 0
  },
  {
    id: "delivery",
    name: "Delivery App Spiral",
    description: "One forgotten fork at a time.",
    baseCost: kgToMolecules(0.001),
    cps: kgToMolecules(0.00008),
    unlockAt: kgToMolecules(0.0002)
  },
  {
    id: "suv",
    name: "SUV School Run",
    description: "Three blocks of leather-seated inevitability.",
    baseCost: kgToMolecules(0.02),
    cps: kgToMolecules(0.003),
    unlockAt: kgToMolecules(0.004)
  },
  {
    id: "toaster",
    name: "Crypto-Mining Toaster",
    description: "Burns hash rates and breakfast.",
    baseCost: kgToMolecules(0.6),
    cps: kgToMolecules(0.08),
    unlockAt: kgToMolecules(0.08)
  },
  {
    id: "jet-hop",
    name: "Empty Jet Reposition",
    description: "The cabin arrives before the excuse.",
    baseCost: kgToMolecules(25),
    cps: kgToMolecules(4),
    unlockAt: kgToMolecules(4)
  },
  {
    id: "stadium",
    name: "Stadium Detour",
    description: "A rounding error wearing sunglasses.",
    baseCost: kgToMolecules(2_000),
    cps: kgToMolecules(360),
    unlockAt: kgToMolecules(450)
  },
  {
    id: "tour",
    name: "World Tour Logistics",
    description: "A convoy of spreadsheets, merch, and plausible deniability.",
    baseCost: kgToMolecules(150_000),
    cps: kgToMolecules(25_000),
    unlockAt: kgToMolecules(35_000)
  },
  {
    id: "orbit",
    name: "Orbital Encore",
    description: "The encore has re-entry burn.",
    baseCost: kgToMolecules(4_000_000),
    cps: kgToMolecules(700_000),
    unlockAt: kgToMolecules(900_000)
  }
];

export const buyableUpgrades = [
  {
    id: "lid",
    name: "Forget the Lid",
    description: "Tap emissions jump from one molecule to 0.05 g CO2e.",
    cost: 26,
    unlockAt: 0,
    apply(state) {
      state.clickPower = Math.max(state.clickPower, kgToMolecules(0.00005));
    }
  },
  {
    id: "delivery-logic",
    name: "Convenience Logic",
    description: "Tap emissions are multiplied by 4,000.",
    cost: kgToMolecules(0.005),
    unlockAt: kgToMolecules(0.001),
    apply(state) {
      state.clickPower *= 4_000;
    }
  },
  {
    id: "entourage",
    name: "Blame the Entourage",
    description: "All emitters work 2.5x harder.",
    cost: kgToMolecules(0.25),
    unlockAt: kgToMolecules(0.05),
    apply(state) {
      state.productionMultiplier *= 2.5;
    }
  },
  {
    id: "privacy",
    name: "Jet Privacy Mode",
    description: "Visible shame drops. Emissions double.",
    cost: kgToMolecules(18),
    unlockAt: kgToMolecules(4),
    apply(state) {
      state.productionMultiplier *= 2;
      state.privacyMode = true;
    }
  },
  {
    id: "press-release",
    name: "Carbon Offset Press Release",
    description: "Tap emissions are multiplied by 13.",
    cost: kgToMolecules(2_000),
    unlockAt: kgToMolecules(800),
    apply(state) {
      state.clickPower *= 13;
    }
  }
];

export const achievements = [
  {
    id: "first-click",
    name: "First Molecule",
    detail: "The atmosphere notices the paperwork.",
    earned: (state) => state.totalMolecules >= 1
  },
  {
    id: "one-gram",
    name: "Pocket-Sized Plume",
    detail: "Emit your first gram.",
    earned: (state) => moleculesToKg(state.totalMolecules) >= 0.001
  },
  {
    id: "blank-space",
    name: "Blank Space in the Ozone Layer",
    detail: "Emit your first kilogram.",
    earned: (state) => moleculesToKg(state.totalMolecules) >= 1
  },
  {
    id: "shake-offsets",
    name: "Shake It Offsets",
    detail: "Buy moral licensing with a reset.",
    earned: (state) => state.moralCredits > 0
  },
  {
    id: "private-flight",
    name: "One Public-Estimate Private Flight",
    detail: "Match a clearly labeled private-flight benchmark.",
    earned: (state) => moleculesToKg(state.totalMolecules) >= PRIVATE_FLIGHT_AVG_KG
  },
  {
    id: "anti-hero",
    name: "Anti-Hero Emissions",
    detail: "Reach 1,000 tCO2e.",
    earned: (state) => moleculesToKg(state.totalMolecules) >= 1_000_000
  },
  {
    id: "fictional-benchmark",
    name: "Fictional Benchmark Royalty",
    detail: "Reach one fictional celebrity benchmark.",
    earned: (state) => moleculesToKg(state.totalMolecules) >= CELEBRITY_BENCHMARK_KG
  }
];

export function freshState() {
  return {
    molecules: 0,
    totalMolecules: 0,
    clickPower: 1,
    productionMultiplier: 1,
    moralCredits: 0,
    lifetimeHiddenKg: 0,
    privacyMode: false,
    emitters: Object.fromEntries(buyableEmitters.map((item) => [item.id, 0])),
    upgrades: {},
    achievements: {},
    log: ["A single molecule enters the chat."],
    lastSavedAt: Date.now()
  };
}

export function normalizeState(saved) {
  const base = freshState();
  if (!saved || typeof saved !== "object") {
    return base;
  }

  return {
    ...base,
    ...saved,
    emitters: { ...base.emitters, ...(saved.emitters || {}) },
    upgrades: { ...base.upgrades, ...(saved.upgrades || {}) },
    achievements: { ...base.achievements, ...(saved.achievements || {}) },
    log: Array.isArray(saved.log) ? saved.log.slice(0, 8) : base.log
  };
}

export function cloneState(state) {
  return {
    ...state,
    emitters: { ...state.emitters },
    upgrades: { ...state.upgrades },
    achievements: { ...state.achievements },
    log: [...state.log]
  };
}

export function addLog(state, message) {
  state.log = [message, ...state.log].slice(0, 8);
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "too much";
  }
  if (value === 0) {
    return "0";
  }
  const abs = Math.abs(value);
  if (abs < 0.001) {
    return value.toExponential(2);
  }
  if (abs < 1_000) {
    return trim(value.toFixed(abs < 10 ? 2 : abs < 100 ? 1 : 0));
  }

  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
  const tier = Math.min(Math.floor(Math.log10(abs) / 3), units.length - 1);
  if (tier >= units.length - 1 && abs >= 1e33) {
    return value.toExponential(2);
  }
  return `${trim((value / 1000 ** tier).toFixed(2))}${units[tier]}`;
}

export function trim(text) {
  return text.replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
}

export function formatMass(molecules, options = {}) {
  const kg = moleculesToKg(molecules);
  if (molecules > 0 && molecules < 1_000_000 && !options.forceMass) {
    const label = Math.floor(molecules) === 1 ? "molecule" : "molecules";
    return `${formatNumber(Math.floor(molecules))} ${label}`;
  }
  if (kg < 1e-9 && !options.forceMass) {
    return `${formatNumber(molecules)} molecules`;
  }
  if (kg < 1e-6) {
    return `${formatNumber(kg * 1e9)} ug CO2e`;
  }
  if (kg < 1e-3) {
    return `${formatNumber(kg * 1e6)} mg CO2e`;
  }
  if (kg < 1) {
    return `${formatNumber(kg * 1000)} g CO2e`;
  }
  if (kg < 1000) {
    return `${formatNumber(kg)} kg CO2e`;
  }
  if (kg < 1_000_000) {
    return `${formatNumber(kg / 1000)} tCO2e`;
  }
  return `${formatNumber(kg / 1_000_000)} MtCO2e`;
}

export function emitterCost(item, state) {
  return item.baseCost * 1.18 ** state.emitters[item.id];
}

export function getMoralMultiplier(state) {
  return 1 + state.moralCredits * 0.25;
}

export function getClickAmount(state) {
  return state.clickPower * getMoralMultiplier(state);
}

export function getProductionPerSecond(state) {
  const base = buyableEmitters.reduce((sum, item) => sum + item.cps * state.emitters[item.id], 0);
  return base * state.productionMultiplier * getMoralMultiplier(state);
}

export function canSee(item, state) {
  return state.totalMolecules >= item.unlockAt || state.molecules >= item.unlockAt;
}

export function emitClick(state) {
  const next = cloneState(state);
  const amount = getClickAmount(next);
  next.molecules += amount;
  next.totalMolecules += amount;
  return withAchievementChecks(next);
}

export function buyEmitter(state, id) {
  const item = buyableEmitters.find((entry) => entry.id === id);
  if (!item) {
    return state;
  }
  const cost = emitterCost(item, state);
  if (state.molecules < cost) {
    return state;
  }

  const next = cloneState(state);
  next.molecules -= cost;
  next.emitters[id] += 1;
  addLog(next, `${item.name} added ${formatMass(item.cps)} / sec.`);
  return withAchievementChecks(next);
}

export function buyUpgrade(state, id) {
  const item = buyableUpgrades.find((entry) => entry.id === id);
  if (!item || state.upgrades[id] || state.molecules < item.cost) {
    return state;
  }

  const next = cloneState(state);
  next.molecules -= item.cost;
  next.upgrades[id] = true;
  item.apply(next);
  addLog(next, `${item.name} approved by legal.`);
  return withAchievementChecks(next);
}

export function tickState(state, elapsedSeconds) {
  const elapsed = Math.max(0, Math.min(0.5, elapsedSeconds));
  const produced = getProductionPerSecond(state) * elapsed;
  if (produced <= 0) {
    return state;
  }

  const next = cloneState(state);
  next.molecules += produced;
  next.totalMolecules += produced;
  return withAchievementChecks(next);
}

export function prestigeState(state) {
  const totalKg = moleculesToKg(state.totalMolecules);
  if (totalKg < 1000) {
    return state;
  }

  const gained = Math.max(1, Math.floor(Math.sqrt(totalKg / 1000)));
  const previousCredits = state.moralCredits;
  const previousAchievements = { ...state.achievements };
  const hiddenKg = state.lifetimeHiddenKg + moleculesToKg(state.molecules);
  const next = freshState();
  next.moralCredits = previousCredits + gained;
  next.lifetimeHiddenKg = hiddenKg;
  next.achievements = previousAchievements;
  next.log = [
    `Offset reset complete. Moral licensing +${gained}.`,
    "Visible emissions are clean. The spreadsheet is not."
  ];
  return withAchievementChecks(next);
}

export function markSaved(state) {
  const next = cloneState(state);
  next.lastSavedAt = Date.now();
  addLog(next, "Saved the paper trail.");
  return next;
}

export function withAchievementChecks(state) {
  const next = cloneState(state);
  achievements.forEach((achievement) => {
    if (!next.achievements[achievement.id] && achievement.earned(next)) {
      next.achievements[achievement.id] = true;
      addLog(next, `Achievement: ${achievement.name}`);
    }
  });
  return next;
}

export function guiltLabel(totalKg) {
  if (totalKg >= CELEBRITY_BENCHMARK_KG) {
    return "Benchmark-level denial";
  }
  if (totalKg >= 1_000_000) {
    return "Stadium haze";
  }
  if (totalKg >= PRIVATE_FLIGHT_AVG_KG) {
    return "Private-flight spicy";
  }
  if (totalKg >= 1_000) {
    return "Offset brochure hot";
  }
  if (totalKg >= 1) {
    return "Guilty household";
  }
  return "Barely carbonated";
}

export function progressSnapshot(state) {
  const totalKg = moleculesToKg(state.totalMolecules);
  const ratio = totalKg / CELEBRITY_BENCHMARK_KG;
  return {
    totalKg,
    ratio,
    progress: Math.min(100, ratio * 100),
    guilt: Math.min(100, Math.max(3, Math.log10(totalKg + 1) * 12)),
    guiltLabel: guiltLabel(totalKg)
  };
}
