import { Badge } from "./ui"
import { vaccines } from "../demo/config"
import { useDemo } from "../state"

/** What the school lists against what is documented. It never recommends a vaccine or an age. */
export default function RequirementSummary() {
  const { data } = useDemo()
  const given = new Set(data.appointments.flatMap((a) => a.doses.map((d) => d.vaccine)))
  const complete = data.record.state === "complete"
  const open = vaccines.filter((v) => !complete && !given.has(v.id))
  return (
    <div className="requirement-summary" role="status">
      <div>
        <strong>{open.length === 0 ? "Nothing on the school's list is missing" : `${open.length} item${open.length > 1 ? "s" : ""} on the school's list ${open.length > 1 ? "are" : "is"} not documented`}</strong>
        <span>{open.length ? open.map((v) => v.name).join(", ") + ". " : ""}Checked against the school's list (a sample). The parent decides what to do next.</span>
      </div>
      <Badge kind="warning">Sample, unverified</Badge>
    </div>
  )
}
