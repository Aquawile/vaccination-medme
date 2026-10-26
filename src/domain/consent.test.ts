import { describe, expect, it } from "vitest"
import { optedOut } from "./consent"
describe("optedOut", () => {
  it("is stable for the same id", () => expect(optedOut("st-011")).toBe(optedOut("st-011")))
  it("is false for an id with no number", () => expect(optedOut("abc")).toBe(false))
})
