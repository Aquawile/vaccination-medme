import { addDays } from "./dates"
import type { Dose, Student } from "./types"

// DEMO-FAKE: invented students. Names are made up and do not refer to real people.
const first = ["Ada","Ben","Cleo","Dev","Elio","Faye","Gus","Hana","Ivy","Jude","Kai","Lena","Milo","Nora","Omar","Pia","Quin","Rafi","Sana","Theo","Uma","Vera","Wes","Xavi","Yara","Zane"]
const last = ["Alder","Brook","Calloway","Dunmore","Ellery","Fairfax","Garrow","Hollis","Ingram","Jarrow","Keane","Lowell","Marlow","Netherby","Orwell","Pryce","Quill","Rowan","Sterling","Tidwell","Underhill","Vance","Wren","Yardley"]
export const rosterSchools = ["Cedar Grove Elementary", "Fern Valley Elementary", "Maple Hollow Elementary"]
export const rosterGrades = ["K", "1", "2", "3", "4", "5"]

/** Small seeded generator so the same seed always gives the same roster. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const dtapOffsets = [60, 120, 180, 480, 1700] // days after birth, sample schedule only
const polioOffsets = [60, 120, 400, 1700]

function dosesFor(vaccineId: string, offsets: number[], count: number, birthDate: string): Dose[] {
  return offsets.slice(0, count).map((o) => ({
    vaccineId,
    date: addDays(birthDate, o),
    source: "registry" as const,
  }))
}

/**
 * Deterministic fake roster. Mix: about 45% up to date, 40% missing at least one dose,
 * 15% no record. Most students are in Oregon, some in North Carolina, a few in Texas
 * (which has no rules on file, so those students come out as unknown).
 */
export function generateRoster(seed: number, size: number, today: string): Student[] {
  const rand = mulberry32(seed)
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const out: Student[] = []
  const used = new Set<string>()
  const todayYear = Number(today.slice(0, 4))
  const uniqueName = () => {
    for (let tries = 0; ; tries++) {
      const n = `${pick(first)} ${pick(last)}`
      if (!used.has(n) || tries > 50) {
        used.add(n)
        return n
      }
    }
  }
  for (let i = 0; i < size; i++) {
    const grade = pick(rosterGrades)
    const gradeIndex = rosterGrades.indexOf(grade)
    const age = 5 + gradeIndex
    const month = String(1 + Math.floor(rand() * 12)).padStart(2, "0")
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, "0")
    const birthDate = `${todayYear - age - 1}-${month}-${day}`
    const roll = rand()
    const r = rand()
    const state = r < 0.82 ? "OR" : r < 0.94 ? "NC" : "TX"
    let doses: Dose[] = []
    let hasRecord = true
    if (roll < 0.45) {
      doses = [...dosesFor("dtap", dtapOffsets, 5, birthDate), ...dosesFor("polio", polioOffsets, 4, birthDate)]
    } else if (roll < 0.62) {
      doses = [...dosesFor("dtap", dtapOffsets, 4, birthDate), ...dosesFor("polio", polioOffsets, 4, birthDate)]
    } else if (roll < 0.74) {
      doses = [...dosesFor("dtap", dtapOffsets, 5, birthDate), ...dosesFor("polio", polioOffsets, 3, birthDate)]
    } else if (roll < 0.85) {
      doses = [...dosesFor("dtap", dtapOffsets, 3, birthDate), ...dosesFor("polio", polioOffsets, 2, birthDate)]
    } else {
      hasRecord = false
    }
    out.push({
      id: `st-${String(i + 1).padStart(3, "0")}`,
      name: uniqueName(),
      birthDate,
      grade,
      school: pick(rosterSchools),
      state,
      doses,
      hasRecord,
    })
  }
  return out
}
