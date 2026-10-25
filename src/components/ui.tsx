import {
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type HTMLAttributes,
} from "react"
interface IconProps {
  name: string
  size?: number
}
export function Icon({ name, size = 20 }: IconProps) {
  const paths: Record<string, ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    back: <path d="m14 6-6 6 6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z" />
        <path d="m8 12 3 3 5-5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 11h18m-12 4h2" />
      </>
    ),
    document: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8m-8 4h5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    logout: (
      <>
        <path d="M9 4H4v16h5m4-12 4 4-4 4m-5-4h13" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v1" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.document}
    </svg>
  )
}
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}
export function Heading({
  children,
  level = 1,
  className = "",
}: {
  children: ReactNode
  level?: number
  className?: string
}) {
  if (level === 1)
    return (
      <h1 tabIndex={-1} className={className}>
        {children}
      </h1>
    )
  if (level === 2) return <h2 className={className}>{children}</h2>
  return <h3 className={className}>{children}</h3>
}
export function Field({
  label,
  error,
  hint,
  children,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  children?: ReactNode
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-help` : undefined}
          {...props}
        />
        {children}
      </div>
      {(error || hint) && (
        <small id={`${id}-help`} className={error ? "error" : "muted"}>
          {error || hint}
        </small>
      )}
    </div>
  )
}
export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} {...props}>
        {children}
      </select>
    </div>
  )
}
export function Card({
  children,
  className = "",
  ...props
}: {
  children: ReactNode
  className?: string
} & HTMLAttributes<HTMLElement>) {
  return (
    <section className={`card ${className}`} {...props}>
      {children}
    </section>
  )
}
export function Alert({
  children,
  kind = "info",
}: {
  children: ReactNode
  kind?: string
}) {
  return (
    <div className={`alert ${kind}`} role="status">
      <Icon name={kind === "success" ? "check" : "info"} />
      <div>{children}</div>
    </div>
  )
}
export function Badge({
  children,
  kind = "",
}: {
  children: ReactNode
  kind?: string
}) {
  return <span className={`badge ${kind}`}>{children}</span>
}
export function Check({
  children,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" {...props} />
      <span>{children}</span>
    </label>
  )
}
export function Illustration() {
  return (
    <div className="illustration" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="paper-back" />
      <div className="paper">
        <div className="paper-top">
          <span className="paper-icon">
            <Icon name="document" size={26} />
          </span>
          <span className="paper-dots">•••</span>
        </div>
        <div className="paper-line wide" />
        <div className="paper-line short" />
        <div className="paper-rule" />
        {[1, 2, 3].map((i) => (
          <div className="paper-row" key={i}>
            <span className="mini-check">
              <Icon name="check" size={13} />
            </span>
            <div className="paper-line" />
          </div>
        ))}
      </div>
      <div className="calendar-art">
        <div className="calendar-top" />
        <div className="calendar-rings" />
        <div className="calendar-grid">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className={i === 4 ? "picked" : ""}>
              {i === 4 ? <Icon name="check" size={17} /> : ""}
            </span>
          ))}
        </div>
      </div>
      <span className="floating-check">
        <Icon name="check" size={26} />
      </span>
      <span className="spark spark-one">+</span>
      <span className="spark spark-two">+</span>
    </div>
  )
}
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    "up-to-date": ["Up to date", "success"],
    complete: ["Complete", "success"],
    missing: ["Missing doses", "warning"],
    "not-yet-due": ["Not yet due", ""],
    unknown: ["Unknown", ""],
  }
  const [label, kind] = map[status] ?? [status, ""]
  return <Badge kind={kind}>{label}</Badge>
}
/** A metric box that expands in place to show a definition and an optional action. */
export function MetricCard({
  label,
  value,
  note,
  open,
  onToggle,
  children,
}: {
  label: string
  value: ReactNode
  note?: string
  open: boolean
  onToggle: () => void
  children?: ReactNode
}) {
  return (
    <Card
      className={`metric-card ${open ? "expanded" : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onToggle()
        }
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
      {open && children}
    </Card>
  )
}
/** Tab row. Same buttons as the rest of the app, with an active state. */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`button text tab ${active === t.id ? "nav-active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
export type Segment = { label: string; value: number; tone: "ok" | "gap" | "unknown" | "neutral"; onClick?: () => void }
/** One horizontal bar split into labeled segments. Segments are buttons when they have an onClick. */
export function StackedBar({ segments, ariaLabel }: { segments: Segment[]; ariaLabel: string }) {
  const total = segments.reduce((n, s) => n + s.value, 0)
  return (
    <div className="stacked" role="group" aria-label={ariaLabel}>
      {segments.map((s) => {
        const style = { flexGrow: s.value, flexBasis: 0 }
        const text = `${s.label}: ${s.value}${total ? ` (${Math.round((s.value / total) * 100)}%)` : ""}`
        return s.value === 0 ? null : s.onClick ? (
          <button key={s.label} className={`seg ${s.tone}`} style={style} title={text} aria-label={text} onClick={s.onClick}>
            {s.value}
          </button>
        ) : (
          <span key={s.label} className={`seg ${s.tone}`} style={style} title={text} aria-label={text}>
            {s.value}
          </span>
        )
      })}
    </div>
  )
}
export function Legend({ items }: { items: { label: string; tone: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}><i className={`dot ${i.tone}`} />{i.label}</span>
      ))}
    </div>
  )
}
