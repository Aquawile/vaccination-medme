import { useEffect } from "react"
export default function usePageTransition(step: string | number) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
    document
      .querySelector<HTMLHeadingElement>("main h1")
      ?.focus({ preventScroll: true })
  }, [step])
}
