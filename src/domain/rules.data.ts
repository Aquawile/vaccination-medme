import intervals from "../data/intervals.json"
import requirements from "../data/schoolRequirements.json"
import stateRules from "../data/stateRules.json"
import type { Interval, Requirement, StateRule } from "./types"

// Typed views over the JSON data files. Change the JSON, not the code.
export const allIntervals = intervals as Interval[]
export const allRequirements = requirements as Requirement[]
export const allStateRules = stateRules as StateRule[]
