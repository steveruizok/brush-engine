import { createSelectorHook, createState } from "@state-designer/react"
import { IMark, IBrush } from "./types"
import {
  mount,
  unmount,
  resize,
  createMarkRenderer,
  renderMark,
  clean,
  CreateMarkRenderer,
  setupExperiment,
} from "./marks/exp"
import { createMark, getMark, CreateMark } from "./marks/mark"
import * as Data from "./data"

let markRenderer: ReturnType<CreateMarkRenderer>
let markFactory: ReturnType<CreateMark>

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
    state.send("RESIZED")
  }
}

const defaultBrush: IBrush = {
  color: "#ffbe0c",
  size: 32,
  spacing: 0.15,
  speed: 0.62,
  variation: 0.82,
  streamline: 0.5,
  opacity: 1,
  alpha: 0.9,
  jitter: 0,
  sizeJitter: 0,
  type: "mouse",
}

const state = createState({
  data: {
    brush: defaultBrush,
    settings: {
      resolution: window.devicePixelRatio,
      rerenderMarks: true,
      showControls: false,
      simulatePressure: true,
    },
    marks: [] as IMark[],
    currentMark: undefined as IMark,
  },
  on: {
    LOADED: ["mountApp", "loadData", "rerenderMarks", setupExperiment],
    UNLOADED: ["unmountApp"],
    STARTED_PRESSING_E: ["clearMarks", "saveData"],
    ERASED: ["clearMarks", "saveData"],
    CHANGED_BRUSH: [
      "updateBrush",
      "saveData",
      { if: "rerenderMarks", do: "rerenderMarks" },
    ],
    CHANGED_SETTINGS: [
      "updateSettings",
      "saveData",
      { if: "rerenderMarks", do: "rerenderMarks" },
    ],
    UNDO: ["undo", "rerenderMarks", "saveData"],
    REDO: ["redo", "rerenderMarks", "saveData"],
    RESET_BRUSH: ["resetBrush", "rerenderMarks", "saveData"],
    RESIZED: ["resize", "rerenderMarks"],
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
              do: ["updateMark", "rerenderMarks"],
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
    // IMarks
    createMark(data) {
      const { x, y, type } = pointer
      const { brush, settings } = data

      let p = type === "pen" ? pointer.p : 0.15

      brush.type = type

      data.currentMark = {
        type,
        points: [[x, y, p]],
      }

      markFactory = createMark(brush, settings)
      markRenderer = createMarkRenderer(brush, settings)

      const pts = markFactory.addPoint([x, y, p])
      markRenderer.addPoints(pts)
    },
    updateMark(data) {
      let { x, y, p } = pointer
      const mark = data.currentMark!
      mark.points.push([x, y, p])

      // const pts = markFactory.addPoint([x, y, p])
      // markRenderer.addPoints(pts)
    },
    finishMark(data) {
      const mark = data.currentMark!
      let { x, y, p } = pointer
      mark.points.push([x, y, p])

      // const pts = markFactory.addPoint([x, y, p], true)
      // markRenderer.addPoints(pts)

      markRenderer.complete()

      data.marks.push(mark)
      data.currentMark = undefined
    },
    clearMarks(data) {
      clean()
      data.marks = []
      data.currentMark = undefined
    },
    rerenderMarks(data) {
      const { brush, settings } = data
      clean()

      for (let mark of data.marks) {
        const pts = getMark(mark.points, brush, settings)
        renderMark(pts, brush, settings)
      }

      if (data.currentMark) {
        const pts = getMark(data.currentMark.points, brush, settings)
        renderMark(pts, brush, settings)
      }
    },

    // Window
    resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      resize(w, h)
    },

    // Undo / Redo
    undo(data) {
      data.marks.pop()
    },
    redo(data) {},

    // Data
    saveData(data) {
      Data.save(data)
    },
    loadData(data) {
      const loaded = Data.load<typeof data>()
      for (let key in loaded) {
        Object.assign(data[key], loaded[key])
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
    resetBrush(data) {
      data.brush = { ...defaultBrush }
    },

    // Setup / Teardown
    mountApp(_, payload: { elm: HTMLDivElement }) {
      mount(payload.elm)
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
    unmountApp() {
      clean()
      unmount()
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
