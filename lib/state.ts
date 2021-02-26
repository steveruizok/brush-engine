import { createSelectorHook, createState } from "@state-designer/react"
import { modulate, lerp, distanceBetweenPoints, lerpPoints } from "./utils"
import { compress, decompress } from "lz-string"
import * as PIXI from "pixi.js"
import * as Bezier from "./bezier"
import * as Vector from "./vector"
import { AsciiFilter } from "@pixi/filter-ascii"
import { OutlineFilter } from "@pixi/filter-outline"
import { DotFilter } from "@pixi/filter-dot"
import { ColorOverlayFilter } from "@pixi/filter-color-overlay"

interface IBrush {
  color: string
  size: number
  opacity: number
  speed: number
  streamline: number
  variation: number
  spacing: number
  jitter: number
  sizeJitter: number
  alpha: number
}

const dpr = window.devicePixelRatio

// Pixi App
PIXI.settings.RESOLUTION = dpr
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR
PIXI.settings.FILTER_RESOLUTION = dpr

const app = new PIXI.Application({
  backgroundColor: 0x1d1d1d,
  antialias: true,
  resolution: dpr,
})

// Surface for previous strokes
const prevSurface = new PIXI.Graphics()
app.stage.addChild(prevSurface)

// Surface for the current stroke
const currSurface = new PIXI.Graphics()
app.stage.addChild(currSurface)

// Filters?
prevSurface.filters = []
currSurface.filters = []

// Brush texture

const brushShape = new PIXI.Graphics()
brushShape.beginFill(Number(0xffffff))
brushShape.drawCircle(0, 0, 50)
brushShape.endFill()

const brushTexture = app.renderer.generateTexture(
  brushShape,
  PIXI.SCALE_MODES.LINEAR,
  dpr
)

// Mark functions

let pixiMark: ReturnType<typeof createPixiMark>

function createPixiMark(brush: IBrush) {
  let { color, opacity, alpha } = brush
  let nColor = Number(color.replace("#", "0x"))

  // Container
  const container = new PIXI.Container()
  container.interactive = false
  container.interactiveChildren = false
  currSurface.addChild(container)
  if (opacity < 1) {
    container.filters = [new PIXI.filters.AlphaFilter(opacity)]
  }

  function addPoint([x, y]: number[], size: number) {
    const dab = new PIXI.Sprite(brushTexture)
    dab.tint = nColor
    dab.anchor.set(0.5)
    dab.setTransform(x / dpr, y / dpr, size / 100 / dpr, size / 100 / dpr)
    container.addChild(dab)
    dab.alpha = alpha
  }

  function complete() {
    currSurface.removeChild(container)
    prevSurface.addChild(container)
    pixiMark = undefined
  }

  // Let's also keep it global for now
  pixiMark = { addPoint, complete }

  return { addPoint, complete }
}

function cleanPrevSurface() {
  for (let child of prevSurface.children) {
    child.destroy()
  }
  prevSurface.removeChildren()
}

function cleanCurrSurface() {
  for (let child of currSurface.children) {
    child.destroy()
  }
  currSurface.removeChildren()
}

function renderMarks(
  brush: IBrush,
  marks: Mark[],
  options = {} as { simulatePressure?: boolean; opacity?: number }
) {
  cleanPrevSurface()
  cleanCurrSurface()
  const { simulatePressure = true } = options
  const { size, variation, spacing, jitter, sizeJitter } = brush

  const maxSize = size
  const minSize = maxSize * (1 - variation)

  for (let { points } of marks) {
    const mark = createPixiMark(brush)
    let prev: number[],
      curr: number[],
      error = 0

    for (let i = 0; i < points.length; i++) {
      curr = points[i]

      const [x, y, p] = curr

      if (!prev) {
        prev = [...curr]
        mark.addPoint([x, y], p)
        continue
      }

      const dist = distanceBetweenPoints(prev, curr)

      let trav = error

      while (trav <= dist) {
        let [tx, ty, tp] = lerpPoints(prev, curr, trav / dist)
        let ts = simulatePressure ? lerp(minSize, maxSize, tp) : size

        trav += ts * Math.max(spacing, 0.01)

        const jx = lerp(
          -jitter * (size / 2),
          jitter * (size / 2),
          Math.random()
        )
        const jy = lerp(
          -jitter * (size / 2),
          jitter * (size / 2),
          Math.random()
        )
        const js = lerp(
          -sizeJitter * (size / 2),
          sizeJitter * (size / 2),
          Math.random()
        )

        pixiMark.addPoint([tx + jx, ty + jy], ts + js)
      }

      error = trav - dist

      prev = [...curr]
    }

    mark.complete()
  }
}

// Pointer

const pointer = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  ox: 0,
  oy: 0,
  p: 0.5,
  type: "mouse",
  shiftKey: false,
  metaKey: false,
  altKey: false,
  t: 0,
}

// Event Handling

function updatePointer(e: PointerEvent) {
  pointer.dx = e.pageX - pointer.x
  pointer.dy = e.pageY - pointer.y
  pointer.x = e.pageX
  pointer.y = e.pageY
  pointer.p = e.pressure
  pointer.type = e.pointerType
  pointer.shiftKey = e.shiftKey
  pointer.metaKey = e.metaKey
  pointer.altKey = e.altKey
  pointer.t = e.timeStamp
}

function handlePointerDown(e: PointerEvent) {
  pointer.ox = e.pageX
  pointer.oy = e.pageY
  updatePointer(e)
  state.send("STARTED_POINTING")
}

function handlePointerMove(e: PointerEvent) {
  if (e.timeStamp - pointer.t < 16) return

  updatePointer(e)
  state.send("MOVED_POINTER")
}

function handlePointerUp(e: PointerEvent) {
  updatePointer(e)
  state.send("STOPPED_POINTING")
}

function handleKeyDown(e: KeyboardEvent) {
  pointer.shiftKey = e.shiftKey
  pointer.metaKey = e.metaKey
  pointer.altKey = e.altKey
  state.send(`STARTED_PRESSING_${e.key.toUpperCase()}`)
}

function handleKeyUp(e: KeyboardEvent) {
  pointer.shiftKey = e.shiftKey
  pointer.metaKey = e.metaKey
  pointer.altKey = e.altKey
  state.send(`STARTED_PRESSING_${e.key.toUpperCase()}`)
}

function handleResize() {
  if (typeof window !== "undefined") {
    const w = window.innerWidth
    const h = window.innerHeight
    app.renderer.resize(w, h)
  }
}

interface Mark {
  type: string
  points: number[][]
}

const state = createState({
  data: {
    error: 0,
    brush: {
      color: "#ffbe0c",
      size: 32,
      spacing: 0.15,
      speed: 0.62,
      variation: 0.82,
      streamline: 0.5,
      opacity: 1,
      alpha: 0.9,
      jitter: 0.06,
      sizeJitter: 0,
    },
    settings: {
      rerenderMarks: true,
      showControls: true,
      simulatePressure: true,
    },
    marks: [] as Mark[],
    currentMark: undefined as Mark,
  },
  on: {
    LOADED: ["mountApp", "loadData"],
    UNLOADED: ["unmountApp"],
    STARTED_PRESSING_E: "clearMarks",
    ERASED: "clearMarks",
    CHANGED_BRUSH: [
      "updateBrush",
      { if: "rerenderMarks", do: ["saveData", "rerenderMarks"] },
    ],
    CHANGED_SETTINGS: [
      "updateSettings",
      { if: "rerenderMarks", do: ["saveData", "rerenderMarks"] },
    ],
    UNDO: ["undo", "rerenderMarks", "saveData"],
    REDO: ["redo", "rerenderMarks", "saveData"],
  },
  states: {
    canvas: {
      initial: "notDrawing",
      states: {
        notDrawing: {
          on: {
            STARTED_POINTING: {
              do: "createMark",
              to: "drawing",
            },
          },
        },
        drawing: {
          on: {
            MOVED_POINTER: {
              do: "updateMark",
            },
            STOPPED_POINTING: {
              do: ["updateMark", "finishMark", "saveData"],
              to: "notDrawing",
            },
          },
        },
      },
    },
  },
  conditions: {
    rerenderMarks(data) {
      return data.settings.rerenderMarks
    },
  },
  actions: {
    // Marks
    createMark(data) {
      const { x, y, type } = pointer
      const { brush } = data

      let p = type === "pen" ? pointer.p : 0.15

      data.currentMark = {
        type,
        points: [[x, y, p]],
      }

      const maxSize = brush.size
      const minSize = maxSize * (1 - brush.variation)

      const mark = createPixiMark(brush)
      mark.addPoint([x, y], modulate(p, [0, 1], [minSize, maxSize]))
    },
    updateMark(data) {
      let { x, y, p } = pointer
      const mark = data.currentMark!
      const prev = mark.points[mark.points.length - 1]
      const {
        brush: {
          size,
          jitter,
          sizeJitter,
          streamline,
          speed,
          variation,
          spacing,
        },
        error,
        settings: { simulatePressure },
      } = data

      const maxSize = size
      const minSize = maxSize * (1 - variation)

      // TODO - move into mark fn

      // Move point towards previous point (streamline)
      x = prev[0] + (x - prev[0]) * (1 - streamline)
      y = prev[1] + (y - prev[1]) * (1 - streamline)

      // Get distance between current and previous point
      const dist = Math.hypot(x - prev[0], y - prev[1])

      if (mark.type !== "pen") {
        // Use distance to determine pressure
        p = 1 - Math.min(1, dist / size)
      }

      // Smooth pressure changes (speed)
      p = lerp(prev[2], p, speed)

      let trav = error

      while (trav <= dist) {
        let [tx, ty, tp] = lerpPoints(prev, [x, y, p], trav / dist)
        let ts = simulatePressure ? lerp(minSize, maxSize, tp) : size

        trav += ts * spacing

        const jx = lerp(
          -jitter * (size / 2),
          jitter * (size / 2),
          Math.random()
        )
        const jy = lerp(
          -jitter * (size / 2),
          jitter * (size / 2),
          Math.random()
        )
        const js = lerp(
          -sizeJitter * (size / 2),
          sizeJitter * (size / 2),
          Math.random()
        )

        pixiMark.addPoint([tx + jx, ty + jy], ts + js)
      }

      data.error = trav - dist
      mark.points.push([x, y, p])
    },
    finishMark(data) {
      const mark = data.currentMark!
      const maxSize = data.brush.size
      const minSize = maxSize * (1 - data.brush.variation)

      if (mark.points.length < 3) {
        const { x, y } = pointer
        const p = lerp(minSize, maxSize, 0.618)
        mark.points.push([x, y, p])
        pixiMark.addPoint([x, y], p)
      }

      data.marks.push(mark)
      data.currentMark = undefined
      pixiMark.complete()
    },
    clearMarks(data) {
      cleanPrevSurface()
      cleanCurrSurface()
      data.marks = []
      data.currentMark = undefined
    },
    rerenderMarks(data) {
      renderMarks(data.brush, data.marks, data.settings)
    },

    // Undo / Redo
    undo(data) {
      data.marks.pop()
    },
    redo(data) {},

    // Data
    saveData(data) {
      const { marks, brush, settings } = data
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          "__brush_engine",
          compress(JSON.stringify({ marks, brush, settings }))
        )
      }
    },
    loadData(data) {
      if (typeof localStorage !== "undefined") {
        const local = localStorage.getItem("__brush_engine")
        if (local !== null) {
          const loaded = JSON.parse(decompress(local)) as Partial<typeof data>

          Object.assign(data, loaded)

          renderMarks(data.brush, data.marks)
        }
      }
    },

    // Settings
    updateSettings(data, payload: Partial<typeof data["settings"]>) {
      data.settings = { ...data.settings, ...payload }
    },
    // Brush
    updateBrush(data, payload: Partial<IBrush>) {
      data.brush = { ...data.brush, ...payload }
    },

    // Setup / Teardown
    mountApp(data, payload: { elm: HTMLDivElement }) {
      payload.elm.appendChild(app.view)
      if (typeof window !== "undefined") {
        handleResize()
        window.addEventListener("resize", handleResize)
        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerdown", handlePointerDown)
        window.addEventListener("pointerup", handlePointerUp)
        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)
      }
    },
    unmountApp(data, payload: { elm: HTMLDivElement }) {
      cleanCurrSurface()
      cleanPrevSurface()
      payload.elm.innerHTML = ""
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize)
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerdown", handlePointerDown)
        window.removeEventListener("pointerup", handlePointerUp)
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
      }
    },
  },
})

export default state
export const useSelector = createSelectorHook(state)
