import {
  buyEmitter,
  buyUpgrade,
  emitClick,
  markSaved,
  prestigeState,
  tickState
} from "./mechanics.js";

export function gameReducer(state, action) {
  switch (action.type) {
    case "emit":
      return emitClick(state);
    case "buy-emitter":
      return buyEmitter(state, action.id);
    case "buy-upgrade":
      return buyUpgrade(state, action.id);
    case "tick":
      return tickState(state, action.elapsed);
    case "prestige":
      return prestigeState(state);
    case "saved":
      return markSaved(state);
    default:
      return state;
  }
}
