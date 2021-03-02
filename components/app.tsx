import state, { useSelector } from "lib/state"
import Toolbar from "./ui/toolbar"
import Controls from "./ui/controls"
import * as React from "react"

export default function App() {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    state.send("LOADED", { elm: ref.current })
    return () => {
      state.send("UNLOADED", { elm: ref.current })
    }
  }, [ref.current])

  const showControls = useSelector((state) => state.data.settings.showControls)

  return (
    <>
      <div className="app" ref={ref}></div>
      <Toolbar />
      {showControls && <Controls />}
    </>
  )
}
