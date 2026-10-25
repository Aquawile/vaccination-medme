import { Badge, Card, Check, Heading } from "../../components/ui"
import { appointmentStatus, dateLabel, locations } from "../../demo/journey"
import { useDemo } from "../../state"

export default function Appointments({ campaign }: { campaign: string }) {
  const { data, update, event } = useDemo()
  const appointments = data.appointments.filter((a) => a.campaign === campaign)
  const generated = appointments.filter((a) => !a.seeded)
  return (
    <>
    <div className="metrics secondary-metrics">
      {[
        [
          "Administered doses",
          generated.reduce((n, a) => n + a.doses.length, 0),
        ],
        ["Proof created", generated.filter((a) => a.proofCreated).length],
        [
          "Proof shared / copied",
          generated.filter((a) => a.proofShared).length,
        ],
        [
          "School accepted",
          generated.filter((a) => a.schoolAccepted).length,
        ],
        [
          "Cancelled appointments",
          generated.filter((a) => a.cancelled).length,
        ],
      ].map(([label, value]) => (
        <Card key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>Generated demo activity</small>
        </Card>
      ))}
    </div>
    <Card className="admin-appointment-table">
      <div className="section-heading">
        <div>
          <Heading level={2}>Appointments and outcomes</Heading>
          <p className="muted">
            School acceptance is recorded separately, only after a demo
            proof has been shared.
          </p>
        </div>
        <Badge>{appointments.length} appointments</Badge>
      </div>
      {appointments.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Child / visit</th>
                <th>Location / status</th>
                <th>Doses</th>
                <th>Proof</th>
                <th>School acceptance</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.child.name}</strong>
                    <p>
                      {dateLabel(a.date)} · {a.time}
                    </p>
                    <Badge>
                      {a.seeded ? "Seeded example" : "Parent booking"}
                    </Badge>
                  </td>
                  <td>
                    {locations.find((p) => p.id === a.locationId)?.name}
                    <p>{appointmentStatus(a)}</p>
                  </td>
                  <td>
                    {a.doses.length} saved / {a.vaccines.length} selected
                    <br />
                    {a.doses.filter((d) => d.reported).length} reported
                  </td>
                  <td>
                    {a.proofCreated ? "Created" : "Not created"}
                    <br />
                    {a.proofShared ? "Shared / copied" : "Not shared"}
                  </td>
                  <td>
                    <Check
                      checked={a.schoolAccepted}
                      disabled={
                        !a.proofShared ||
                        a.doses.length !== a.vaccines.length
                      }
                      onChange={(e) => {
                        const accepted = e.target.checked
                        update((d) => ({
                          ...d,
                          appointments: d.appointments.map((x) =>
                            x.id === a.id
                              ? { ...x, schoolAccepted: accepted }
                              : x,
                          ),
                        }))
                        event(
                          `${
                            a.seeded ? "Seeded example: " : ""
                          }Demo school acceptance ${
                            accepted ? "recorded" : "removed"
                          } for ${a.child.name}`,
                          "school",
                        )
                      }}
                    >
                      Demo accepted
                    </Check>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No appointments in this campaign.</p>
        </div>
      )}
    </Card>
    </>
  )
}
