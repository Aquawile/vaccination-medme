import { ageAt } from "./dates"
import { NO_RULES_MESSAGE } from "./stateRules"
import type { StateRule, VaccineId } from "./types"

export type Store = {
  id: string
  name: string
  state: string
  /** vaccines this store offers */
  vaccines: VaccineId[]
  /** youngest age the store itself accepts (its own policy) */
  minAge: number
  maxAge: number
  /** type of site: pharmacy follows state pharmacist rules, clinic does not */
  kind: "pharmacy" | "clinic"
}

export type EligibilityResult = {
  eligible: boolean
  /** blocking reasons, each already worded for the screen */
  reasons: string[]
  /** things the parent must know before booking; they do not block */
  notices: string[]
  rule: Pick<StateRule, "status" | "sourceUrl" | "lastReviewed">
}

/**
 * Can this child be booked at this store for these vaccines?
 * Pharmacies follow the state rule. A state with no researched rule blocks nothing silently:
 * the result is ineligible for pharmacies with the "No rules on file" reason so the UI can say so.
 * Clinics only follow their own age range.
 */
export function checkEligibility(args: {
  store: Store
  birthDate: string
  vaccineIds: VaccineId[]
  rule: StateRule
  hasPrescription: boolean
  today: string
}): EligibilityResult {
  const { store, birthDate, vaccineIds, rule, hasPrescription, today } = args
  const age = ageAt(birthDate, today)
  const reasons: string[] = []
  const notices: string[] = []

  if (age < store.minAge || age > store.maxAge)
    reasons.push(`${store.name} accepts ages ${store.minAge} to ${store.maxAge}; child is ${age}.`)
  if (vaccineIds.some((id) => !store.vaccines.includes(id)))
    reasons.push(`${store.name} does not offer every selected vaccine.`)

  if (store.kind === "pharmacy") {
    if (rule.status === "not-researched") {
      reasons.push(NO_RULES_MESSAGE)
    } else {
      const covers = (ids: VaccineId[]) =>
        rule.vaccinesNoRx === "all-acip" ||
        (Array.isArray(rule.vaccinesNoRx) && ids.every((id) => (rule.vaccinesNoRx as string[]).includes(id)))
      const exc = rule.exceptionsNoRx
      const noRxOk =
        (rule.minAgeNoRx !== null && age >= rule.minAgeNoRx && covers(vaccineIds)) ||
        (!!exc && age >= exc.minAge && vaccineIds.every((id) => exc.vaccines.includes(id)))
      const rxOk =
        hasPrescription && rule.minAgeWithRx !== null && age >= rule.minAgeWithRx
      if (!noRxOk && !rxOk) {
        if (rule.minAgeWithRx !== null && age >= rule.minAgeWithRx)
          reasons.push("A prescription is needed for this child in this state.")
        else
          reasons.push(`This state's pharmacist rule does not cover a child aged ${age} for these vaccines.`)
      }
      if (rule.requiresAgreement)
        notices.push("This state requires the pharmacist to have a signed agreement with a physician or health department.")
      if (rule.writtenConsentUnderAge !== null && age < rule.writtenConsentUnderAge)
        notices.push("Written parental consent is required.")
      if (rule.status === "unverified")
        notices.push("This state rule has not been checked against an official source.")
    }
  }
  return {
    eligible: reasons.length === 0,
    reasons,
    notices,
    rule: { status: rule.status, sourceUrl: rule.sourceUrl, lastReviewed: rule.lastReviewed },
  }
}
