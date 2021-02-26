import * as PIXI from "pixi.js"
import { ISettings, IBrush } from "./types"
import { lerp, lerpPoints } from "./utils"

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

// A factory function, creates a mark and returns functions for
// adding points / completing the mark.
export function createPixiMark(brush: IBrush, options = {} as ISettings) {
  const { simulatePressure = true } = options
  let {
    color,
    opacity,
    alpha,
    size,
    streamline,
    variation,
    jitter,
    sizeJitter,
    speed,
    type,
    spacing,
  } = brush
  let nColor = Number(color.replace("#", "0x"))
  let prev: number[]
  let error = 0
  let pts: number[][] = []

  // Container
  const container = new PIXI.Container()
  container.interactive = false
  container.interactiveChildren = false
  currSurface.addChild(container)
  if (opacity < 1) {
    container.filters = [new PIXI.filters.AlphaFilter(opacity)]
  }

  // Add a point to the mark
  function addPoint(curr: number[]) {
    pts.push([...curr])

    if (!prev) {
      prev = [...curr]
      drawPoint(prev)
      return
    }
    let [x, y, p] = curr

    const maxSize = size
    const minSize = maxSize * (1 - variation)

    // Move point towards previous point (streamline)
    x = prev[0] + (x - prev[0]) * (1 - streamline)
    y = prev[1] + (y - prev[1]) * (1 - streamline)

    // Get distance between current and previous point
    const dist = Math.hypot(x - prev[0], y - prev[1])

    // Use distance to determine pressure if not provided
    if (type !== "pen") {
      p = 1 - Math.min(1, dist / size)
    }

    // Smooth pressure changes (speed)
    p = lerp(prev[2], p, speed)

    let trav = error

    while (trav <= dist) {
      let [tx, ty, tp] = lerpPoints(prev, [x, y, p], trav / dist)
      let ts = simulatePressure ? lerp(minSize, maxSize, tp) : size

      trav += ts * spacing

      const jx = lerp(-jitter * (size / 2), jitter * (size / 2), Math.random())
      const jy = lerp(-jitter * (size / 2), jitter * (size / 2), Math.random())
      const js = lerp(
        -sizeJitter * (size / 2),
        sizeJitter * (size / 2),
        Math.random()
      )

      drawPoint([tx + jx, ty + jy, ts + js])
    }

    error = trav - dist

    prev = [x, y, p]
  }

  function drawPoint([x, y, r]: number[]) {
    const dab = new PIXI.Sprite(brushTexture)
    dab.tint = nColor
    dab.anchor.set(0.5)
    dab.setTransform(x / dpr, y / dpr, r / 100 / dpr, r / 100 / dpr)
    container.addChild(dab)
    dab.alpha = alpha
  }

  function complete(curr: number[]) {
    pts.push([...curr])

    // Move to pixi
    if (pts.length < 3) {
      const [x, y] = curr
      addPoint([x, y, 0.618])
    }

    currSurface.removeChild(container)
    prevSurface.addChild(container)
  }

  return { addPoint, complete }
}

// Cleanup!

export function cleanPrevSurface() {
  for (let child of prevSurface.children) {
    child.destroy()
  }
  prevSurface.removeChildren()
}

export function cleanCurrSurface() {
  for (let child of currSurface.children) {
    child.destroy()
  }
  currSurface.removeChildren()
}

export function clean() {
  cleanPrevSurface()
  cleanCurrSurface()
}

export default app
