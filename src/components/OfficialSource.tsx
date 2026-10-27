import officialLinks from "../data/officialLinks.json"
import { stateName } from "../data/states"
import { useDemo } from "../state"

/** MedMe does not write or summarize law. Wherever a rule matters, this sends the person to the state's own page. */
export default function OfficialSource({ topic }: { topic: string }) {
  const { data } = useDemo()
  const link = officialLinks.find((l) => l.state === data.schoolState)
  return (
    <p className="official-source">
      Rules on {topic} differ by state and change. MedMe does not summarize them.{" "}
      {link ? (
        <>Read {stateName(data.schoolState)}'s own page: <a href={link.url} target="_blank" rel="noreferrer">{link.label}</a>.</>
      ) : (
        <>No official link is on file for {stateName(data.schoolState)}. Check with the state health department or your school nurse.</>
      )}
    </p>
  )
}
