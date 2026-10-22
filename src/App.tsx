import { lazy, Suspense, useState } from "react"
import { Button, Icon } from "./components/ui"
import { accountRoles } from "./demo/config"
import { DemoProvider } from "./state"
import Auth from "./screens/Auth"
const Parent = lazy(() => import("./screens/Parent"))
const Pharmacist = lazy(() => import("./screens/Pharmacist"))
const Admin = lazy(() => import("./screens/Admin"))
export default function App() {
  const [email, setEmail] = useState(
    () => localStorage.getItem("school-demo-session") || "",
  )
  const role = accountRoles[email]
  return (
    <DemoProvider>
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
            {role === "parent" ? (
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
          </footer>
        </div>
      )}
    </DemoProvider>
  )
}
