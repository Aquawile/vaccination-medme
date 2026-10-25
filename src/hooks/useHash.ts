import { useEffect, useState } from "react"

/** Tiny hash router: returns the current location.hash without the leading "#". No router library needed. */
export function useHash(): [string, (next: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash.slice(1))
  useEffect(() => {
    const on = () => setHash(window.location.hash.slice(1))
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  return [
    hash,
    (next) => {
      window.location.hash = next
    },
  ]
}
