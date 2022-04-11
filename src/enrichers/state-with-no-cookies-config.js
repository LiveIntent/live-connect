export function enrich (state) {
  if (state && state.gdprApplies != null) {
    const gdprApplies = !!state.gdprApplies
    return {
      ...state,
      n3pc: gdprApplies,
      n3pc_ttl: gdprApplies,
      nbakers: gdprApplies
    }
  } else return state
}
