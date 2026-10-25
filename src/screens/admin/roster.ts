import { useMemo } from "react"
import { summarize } from "../../domain/cohorts"
import { generateRoster } from "../../domain/roster"
import { allIntervals, allRequirements } from "../../domain/rules.data"
import { defaults } from "../../demo/config"

// DEMO-FAKE: the roster is generated in memory each load (same seed, same students).
export const ROSTER_SEED = 2026
export const ROSTER_SIZE = 300

export function useRoster() {
  return useMemo(
    () =>
      summarize(
        generateRoster(ROSTER_SEED, ROSTER_SIZE, defaults.referenceDate),
        allRequirements,
        allIntervals,
        defaults.referenceDate,
      ),
    [],
  )
}
