import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { type DemoData } from "./demo/config"
import { loadData, persistData } from "./demo/services"
type Store = {
  data: DemoData
  update: (fn: (data: DemoData) => DemoData) => void
  event: (text: string, type: string) => void
}
const Context = createContext<Store>(null!)
export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(loadData)
  useEffect(() => persistData(data), [data])
  const event = (text: string, type: string) =>
    setData((d) => ({
      ...d,
      events: [
        { id: crypto.randomUUID(), text, type, time: new Date().toISOString() },
        ...d.events,
      ],
    }))
  return (
    <Context.Provider value={{ data, update: setData, event }}>
      {children}
    </Context.Provider>
  )
}
export const useDemo = () => useContext(Context)
