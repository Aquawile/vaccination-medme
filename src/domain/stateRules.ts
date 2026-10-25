import type { StateRule } from "./types"

/** Return the researched rule for a state, or an honest empty one. Never guesses. */
export function getStateRule(code: string, rules: StateRule[]): StateRule {
  return (
    rules.find((r) => r.state === code) ?? {
      state: code,
      status: "not-researched",
      sourceUrl: "",
      lastReviewed: "",
      minAgeNoRx: null,
      minAgeWithRx: null,
      vaccinesNoRx: "unknown",
      requiresAgreement: false,
      writtenConsentUnderAge: null,
      notes: "",
    }
  )
}

export const NO_RULES_MESSAGE =
  "No rules on file, check with the state health department."
