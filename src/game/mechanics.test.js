import { describe, expect, it } from "vitest";
import {
  buyEmitter,
  buyUpgrade,
  buyableEmitters,
  emitClick,
  emitterCost,
  formatMass,
  freshState,
  getClickAmount,
  getProductionPerSecond,
  kgToMolecules,
  moleculesToKg,
  prestigeState,
  tickState
} from "./mechanics.js";

describe("game mechanics", () => {
  it("starts with a one-molecule tap", () => {
    const state = freshState();

    expect(getClickAmount(state)).toBe(1);
    expect(formatMass(getClickAmount(state))).toBe("1 molecule");
  });

  it("emits click power into visible and lifetime totals", () => {
    const next = emitClick(freshState());

    expect(next.molecules).toBe(1);
    expect(next.totalMolecules).toBe(1);
    expect(next.achievements["first-click"]).toBe(true);
  });

  it("buys emitters and produces idle emissions", () => {
    const state = freshState();
    const kettle = buyableEmitters.find((item) => item.id === "kettle");
    state.molecules = emitterCost(kettle, state);

    const bought = buyEmitter(state, "kettle");
    const ticked = tickState(bought, 0.5);

    expect(bought.emitters.kettle).toBe(1);
    expect(getProductionPerSecond(bought)).toBeCloseTo(kettle.cps);
    expect(ticked.totalMolecules).toBeCloseTo(kettle.cps * 0.5);
  });

  it("applies upgrades once", () => {
    const state = freshState();
    state.molecules = 30;

    const upgraded = buyUpgrade(state, "lid");
    const secondAttempt = buyUpgrade(upgraded, "lid");

    expect(upgraded.upgrades.lid).toBe(true);
    expect(getClickAmount(upgraded)).toBeCloseTo(kgToMolecules(0.00005));
    expect(secondAttempt.clickPower).toBe(upgraded.clickPower);
  });

  it("prestiges after 1 tCO2e and preserves achievements", () => {
    const state = freshState();
    state.molecules = kgToMolecules(1000);
    state.totalMolecules = kgToMolecules(1000);
    state.achievements["first-click"] = true;

    const reset = prestigeState(state);

    expect(reset.molecules).toBe(0);
    expect(reset.moralCredits).toBe(1);
    expect(reset.achievements["first-click"]).toBe(true);
    expect(moleculesToKg(reset.totalMolecules)).toBe(0);
  });
});
