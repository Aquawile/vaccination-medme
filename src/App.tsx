import { lazy, Suspense, useEffect, useState } from "react"
import { Button, Icon } from "./components/ui"
import { accountRoles } from "./demo/config"
import { DemoProvider } from "./state"
import Auth from "./screens/Auth"
import Dev from "./screens/Dev"
import { useDemo } from "./state"
import { useHash } from "./hooks/useHash"
const Parent = lazy(() => import("./screens/Parent"))
const Pharmacist = lazy(() => import("./screens/Pharmacist"))
const Admin = lazy(() => import("./screens/Admin"))
// Set by the hosting build (see vercel.json). Shows which branch and commit a deployed copy came from.
const buildEnv = (import.meta as unknown as { env: Record<string, string | undefined> }).env
const buildStamp = buildEnv.VITE_BUILD_BRANCH
  ? `Build: ${buildEnv.VITE_BUILD_BRANCH} @ ${(buildEnv.VITE_BUILD_COMMIT ?? "").slice(0, 7)}`
  : ""
/** Visiting #from/maps (or school, hotline, ai) records where the parent arrived from. */
function SourceCapture() {
  const { update } = useDemo()
  const [hash] = useHash()
  useEffect(() => {
    const m = hash.match(/^from\/(school|maps|hotline|ai)$/)
    if (m) update((d) => ({ ...d, entrySource: m[1] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash])
  return null
}
export default function App() {
  const [email, setEmail] = useState(
    () => localStorage.getItem("school-demo-session") || "",
  )
  const role = accountRoles[email]
  const [hash] = useHash()
  return (
    <DemoProvider>
      <SourceCapture />
      {!role ? (
        <Auth onLogin={setEmail} />
      ) : (
        <div className="workspace">
          <header className="workspace-header">
            <div className="workspace-label">
              <Icon
                name={
                  role === "parent"
                    ? "document"
                    : role === "pharmacist"
                      ? "calendar"
                      : "grid"
                }
              />
              <span>
                {role === "parent"
                  ? "School vaccination details"
                  : role === "pharmacist"
                    ? "Appointment workspace"
                    : "Campaign administration"}
              </span>
            </div>
            <div className="header-right">
              <span className="demo-notice">
                <span />
                Demo data
              </span>
              <span className="account-email">{email}</span>
              <Button
                variant="text"
                onClick={() => {
                  localStorage.removeItem("school-demo-session")
                  window.location.hash = ""
                  setEmail("")
                }}
              >
                <Icon name="logout" size={17} />
                <span>Sign out</span>
              </Button>
            </div>
          </header>
          <Suspense
            fallback={
              <main className="parent-main" role="status">
                Opening workspace…
              </main>
            }
          >
            {hash === "dev" ? (
              <Dev />
            ) : role === "parent" ? (
              <Parent />
            ) : role === "pharmacist" ? (
              <Pharmacist />
            ) : (
              <Admin />
            )}
          </Suspense>
          <footer className="workspace-footer">
            <Icon name="shield" size={16} /> Fictional records · Stored on this
            device · No live clinical services
            {buildStamp && <span className="build-stamp"> · {buildStamp}</span>}
          </footer>
        </div>
      )}
    </DemoProvider>
  )
}
