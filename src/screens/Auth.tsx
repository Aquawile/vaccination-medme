import { useState, type FormEvent } from "react"
import { authenticate, DEMO_CODE, signInWithCode } from "../demo/services"
import {
  Alert,
  Button,
  Field,
  Heading,
  Icon,
  Illustration,
} from "../components/ui"
export default function Auth({
  onLogin,
}: {
  onLogin: (email: string) => void
}) {
  const [register, setRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [codeStep, setCodeStep] = useState<"" | "register" | "code">("")
  const [code, setCode] = useState("")
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setError("")
    if (
      !validEmail ||
      password.length < 8 ||
      (register && confirm !== password)
    )
      return
    if (register) {
      setCodeStep("register")
      return
    }
    setBusy(true)
    try {
      onLogin(
        await authenticate(email.trim().toLowerCase(), password, register),
      )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function verify(e: FormEvent) {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const mail = email.trim().toLowerCase()
      if (code.trim() !== DEMO_CODE) throw new Error("That code is not right. Check it and try again.")
      onLogin(codeStep === "register" ? await authenticate(mail, password, true) : await signInWithCode(mail, code))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="visual-top">
          <span className="small-dot" /> School forms, records and next steps
        </div>
        <div className="visual-content">
          <Illustration />
          <div className="eyebrow">YOUR NEXT STEPS</div>
          <Heading level={2}>
            School vaccination
            <br />
            checklist
          </Heading>
          <p>
            Keep school vaccination details together,
            <br className="desktop-break" /> and take the next step with
            confidence.
          </p>
          <div className="visual-features">
            <span>
              <Icon name="check" size={15} /> Clear next steps
            </span>
            <span>
              <Icon name="check" size={15} /> All in one place
            </span>
          </div>
        </div>
        <div className="visual-bottom">
          <Icon name="shield" size={17} /> Fictional records for a guided
          walkthrough.
        </div>
      </div>
      <main className="auth-main">
        <div className="auth-top">
          <span className="demo-notice">
            <span /> Demo data
          </span>
          <span className="auth-step">School vaccination access</span>
        </div>
        <div className="auth-form-container">
          <div className="welcome-icon">
            <Icon name={register ? "user" : "lock"} size={23} />
          </div>
          <div className="eyebrow">YOUR SCHOOL HEALTH CHECKLIST</div>
          <Heading>{register ? "Create your account" : "Welcome back"}</Heading>
          <p className="auth-description">
            {register
              ? "A few details, and you’re ready to get started."
              : "Sign in to pick up where you left off."}
          </p>
          {codeStep ? (
            <form onSubmit={verify} noValidate>
              <p className="auth-description">We sent a 6-digit code to <strong>{email}</strong>. Enter it to continue.</p>
              <Alert>Demo only: no email is sent. Your code is <strong>{DEMO_CODE}</strong>.</Alert>
              <Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
              {error && <Alert kind="error">{error}</Alert>}
              <Button type="submit" disabled={busy || code.trim().length < 6} className="full">{busy ? "Checking…" : "Verify and continue"}</Button>
              <Button type="button" variant="text" onClick={() => { setCodeStep(""); setCode(""); setError("") }}>Back</Button>
            </form>
          ) : (
          <form onSubmit={submit} noValidate>
            <Field
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={
                submitted && !validEmail
                  ? "Enter a valid email address."
                  : undefined
              }
            />
            <Field
              label={register ? "Create a demo password" : "Password"}
              type={show ? "text" : "password"}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={
                submitted && password.length < 8
                  ? "Use at least 8 characters."
                  : undefined
              }
            >
              {
                <Button
                  type="button"
                  variant="icon-button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  <Icon name="eye" size={19} />
                </Button>
              }
            </Field>
            {register && (
              <Field
                label="Confirm password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={
                  submitted && confirm !== password
                    ? "Passwords do not match."
                    : undefined
                }
              />
            )}
            {!register && (
              <p className="password-hint">
                For this prototype, use your assigned demo account.
                <br />
                Default demo password: <strong>Demo123!</strong>
              </p>
            )}
            {error && <Alert kind="error">{error}</Alert>}
            <Button type="submit" disabled={busy} className="full">
              {busy
                ? register
                  ? "Creating account…"
                  : "Signing in…"
                : register
                  ? "Create account"
                  : "Sign in"}{" "}
              {!busy && <Icon name="arrow" size={18} />}
            </Button>
            {!register && (
              <Button type="button" variant="text" className="full" onClick={() => { setSubmitted(true); if (validEmail) { setCodeStep("code"); setError("") } }}>
                Email me a sign-in code instead
              </Button>
            )}
          </form>
          )}
          <div className="auth-switch">
            {register ? "Already have an account?" : "New here?"}{" "}
            <Button
              variant="text"
              onClick={() => {
                setRegister(!register)
                setError("")
                setSubmitted(false)
              }}
            >
              {register ? "Sign in" : "Create an account"}
              <Icon name="arrow" size={15} />
            </Button>
          </div>
          <div className="auth-reassurance">
            <Icon name="shield" size={18} />
            <p>
              A safe space to explore.
              <br />
              <span>
                This prototype uses fictional records, not real health data.
              </span>
            </p>
          </div>
        </div>
        <footer className="auth-footer">
          <span>Fictional school records.</span>
          <span>Local demo · No live services</span>
        </footer>
      </main>
    </div>
  )
}
