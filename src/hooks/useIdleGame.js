import { useCallback, useEffect, useReducer, useRef } from "react";
import { gameReducer } from "../game/reducer.js";
import {
  SAVE_KEY,
  formatMass,
  getClickAmount,
  normalizeState,
  withAchievementChecks
} from "../game/mechanics.js";

function loadInitialState() {
  if (typeof window === "undefined") {
    return withAchievementChecks(normalizeState(null));
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVE_KEY) || "null");
    return withAchievementChecks(normalizeState(saved));
  } catch {
    return withAchievementChecks(normalizeState(null));
  }
}

function persist(state) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }
}

export function useIdleGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadInitialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let lastTick = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const elapsed = (now - lastTick) / 1000;
      lastTick = now;
      dispatch({ type: "tick", elapsed });
    }, 100);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => persist(stateRef.current), 10_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onBeforeUnload = () => persist(stateRef.current);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const emit = useCallback(() => {
    const amount = getClickAmount(stateRef.current);
    dispatch({ type: "emit" });
    return {
      amount,
      label: formatMass(amount)
    };
  }, []);

  const save = useCallback(() => {
    persist(stateRef.current);
    dispatch({ type: "saved" });
  }, []);

  const actions = {
    emit,
    save,
    prestige: () => dispatch({ type: "prestige" }),
    buyEmitter: (id) => dispatch({ type: "buy-emitter", id }),
    buyUpgrade: (id) => dispatch({ type: "buy-upgrade", id })
  };

  return { state, actions, stateRef };
}
