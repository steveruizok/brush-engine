import * as React from "react"
import ColorInput from "./color-input"
import NumberInput from "./number-input"
import BooleanInput from "./boolean-input"
import state, { useSelector } from "lib/state"
import styled from "styled-components"

const StyledControls = styled.div`
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: auto 1fr 48px;
  gap: 4px 8px;
  font-size: 13px;
  padding: 16px 8px;
  background-color: var(--color-scrim);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(30px);
`

const ButtonGroup = styled.div`
  grid-column: 1 / span 3;
  display: grid;
  grid-auto-flow: column;
  gap: 16px;

  button {
    padding: 8px 12px;
  }
`

export default function Controls() {
  let brush = useSelector((state) => state.data.brush)
  let settings = useSelector((state) => state.data.settings)

  return (
    <StyledControls onPointerDown={(e) => e.stopPropagation()}>
      <ColorInput
        label="Color"
        value={brush.color}
        onChange={(color) => state.send("CHANGED_BRUSH", { color })}
      />
      <NumberInput
        label="Size"
        min={1}
        max={64}
        value={brush.size}
        onChange={(size) => state.send("CHANGED_BRUSH", { size })}
      />
      <NumberInput
        label="Spacing"
        min={0.04}
        max={3}
        step={0.01}
        value={brush.spacing}
        onChange={(spacing) => state.send("CHANGED_BRUSH", { spacing })}
      />

      <NumberInput
        label="Alpha"
        min={0}
        max={1}
        value={brush.alpha}
        onChange={(alpha) => state.send("CHANGED_BRUSH", { alpha })}
      />
      <NumberInput
        label="Opacity"
        min={0}
        max={1}
        value={brush.opacity}
        onChange={(opacity) => state.send("CHANGED_BRUSH", { opacity })}
      />
      <NumberInput
        label="Jitter"
        min={0}
        max={2}
        value={brush.jitter}
        onChange={(jitter) => state.send("CHANGED_BRUSH", { jitter })}
      />
      <NumberInput
        label="Size Jitter"
        min={0}
        max={2}
        value={brush.sizeJitter}
        onChange={(sizeJitter) => state.send("CHANGED_BRUSH", { sizeJitter })}
      />
      <NumberInput
        label="Variation"
        min={0.01}
        max={0.99}
        value={brush.variation}
        onChange={(variation) => state.send("CHANGED_BRUSH", { variation })}
      />
      <NumberInput
        label="Streamline"
        min={0}
        max={1}
        value={brush.streamline}
        onChange={(streamline) => state.send("CHANGED_BRUSH", { streamline })}
      />
      <NumberInput
        label="Speed"
        min={0.01}
        max={1}
        value={brush.speed}
        onChange={(speed) => state.send("CHANGED_BRUSH", { speed })}
      />
      <BooleanInput
        label="Simulate Pressure"
        value={settings.simulatePressure}
        onChange={(simulatePressure) =>
          state.send("CHANGED_SETTINGS", { simulatePressure })
        }
      />
      <BooleanInput
        label="Re-render Marks"
        value={settings.rerenderMarks}
        onChange={(rerenderMarks) =>
          state.send("CHANGED_SETTINGS", { rerenderMarks })
        }
      />
      <ButtonGroup>
        <button onClick={() => state.send("RESET_BRUSH")}>Reset</button>
        <button
          onClick={() =>
            state.send("CHANGED_SETTINGS", { showControls: false })
          }
        >
          Close
        </button>
      </ButtonGroup>
      {/* <BooleanInput
        label="Simulate Pressure"
        value={options.simulatePressure}
        onChange={(v) => state.send("CHANGED_OPTIONS", { simulatePressure: v })}
      />
      {options.simulatePressure && (
        <>
          <NumberInput
            label="Pressure Max Velocity"
            value={options.pressureMaxVelocity}
            min={0}
            max={10}
            onChange={(v) =>
              state.send("CHANGED_OPTIONS", {
                pressureMaxVelocity: v,
              })
            }
          />
          <NumberInput
            value={options.pressureChangeRate}
            onChange={(v) =>
              state.send("CHANGED_OPTIONS", {
                pressureChangeRate: v,
              })
            }
            min={0.001}
            max={2}
            label="Pressure Change Rate"
          />
          <NumberInput
            value={options.pressureVelocityEffect}
            min={0.001}
            max={50}
            onChange={(v) =>
              state.send("CHANGED_OPTIONS", {
                pressureVelocityEffect: v,
              })
            }
            label="Pressure Velocity Effect"
          />
        </>
      )}
      <NumberInput
        value={options.streamline}
        onChange={(v) => state.send("CHANGED_OPTIONS", { streamline: v })}
        label="Streamline"
        min={0}
        max={1}
      />
      <NumberInput
        label="Min Size"
        value={options.minSize}
        min={1}
        max={64}
        onChange={(v) => state.send("CHANGED_OPTIONS", { minSize: v })}
      />
      <NumberInput
        label="Max Size"
        value={options.maxSize}
        min={1}
        max={64}
        onChange={(v) => state.send("CHANGED_OPTIONS", { maxSize: v })}
      />

      <NumberInput
        value={options.softness}
        onChange={(v) => state.send("CHANGED_OPTIONS", { softness: v })}
        label="Softness"
        min={0}
        max={50}
      />
      <BooleanInput
        label="Dark Mode"
        value={settings.darkMode}
        onChange={(v) => state.send("TOGGLED_DARK_MODE")}
      />
      <BooleanInput
        label="Recompute Paths"
        value={settings.recomputePaths}
        onChange={(v) => state.send("CHANGED_SETTINGS", { recomputePaths: v })}
      />
      <BooleanInput
        label="Show Path"
        value={settings.showTrace}
        onChange={(v) => state.send("CHANGED_SETTINGS", { showTrace: v })}
      />
      <ButtonGroup>
        <button onClick={() => state.send("RESET_OPTIONS")}>Reset</button>
        <button onClick={() => state.send("TOGGLED_CONTROLS")}>Close</button>
      </ButtonGroup> */}
    </StyledControls>
  )
}
