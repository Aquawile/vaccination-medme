import { useMemo } from "react"
import { summarize } from "../../domain/cohorts"
import { generateRoster } from "../../domain/roster"
import { allIntervals, allRequirements } from "../../domain/rules.data"
import { defaults } from "../../demo/config"
import { useDemo } from "../../state"

// DEMO-FAKE: the roster is generated in memory each load (same seed, same students).
export const ROSTER_SEED = 2026
export const ROSTER_SIZE = 300

/** Every student attends a school in the school's state, so one state's rules apply to the whole roster. */
export function useRoster() {
  const { data } = useDemo()
  return useMemo(
    () =>
      summarize(
        generateRoster(ROSTER_SEED, ROSTER_SIZE, defaults.referenceDate).map((s) => ({ ...s, state: data.schoolState })),
        allRequirements,
        allIntervals,
        defaults.referenceDate,
      ),
    [data.schoolState],
  )
}
