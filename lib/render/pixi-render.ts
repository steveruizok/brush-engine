import * as PIXI from "pixi.js"
import { ISettings, IBrush } from "../types"

const dpr = window.devicePixelRatio

// Pixi App
PIXI.settings.RESOLUTION = dpr
PIXI.settings.FILTER_RESOLUTION = dpr
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR

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

export function mount(element: HTMLElement) {
  element.appendChild(app.view)
}

export function unmount() {
  const parent = app.view.parentElement
  parent.removeChild(app.view)
}

/**
 * A pure function for creating marks.
 * @param brush
 * @param options
 * @returns
 */
function _createMarkRenderer(brush: IBrush, options = {} as ISettings) {
  const { resolution: dpr = 1 } = options
  const { color = "#ffffff", opacity = 1, alpha = 1 } = brush
  const nColor = Number(color.replace("#", "0x"))

  // Create brush texture (could be loaded from elsewhere?)
  const brushShape = new PIXI.Graphics()
  brushShape.beginFill(Number(0xffffff))
  brushShape.drawCircle(0, 0, 50)
  brushShape.endFill()

  const brushTexture = app.renderer.generateTexture(
    brushShape,
    PIXI.SCALE_MODES.LINEAR,
    dpr
  )

  // Container
  const container = new PIXI.Container()
  container.interactive = false
  container.interactiveChildren = false

  if (opacity < 1) {
    container.filters = [new PIXI.filters.AlphaFilter(opacity)]
  }

  // Function that draws a point
  function addPoint([x, y, r]: number[]) {
    const dab = new PIXI.Sprite(brushTexture)
    dab.tint = nColor
    dab.alpha = alpha
    dab.anchor.set(0.5)
    dab.setTransform(x / dpr, y / dpr, r / 100 / dpr, r / 100 / dpr)
    container.addChild(dab)
  }

  return { addPoint, container }
}

/**
 * Get a factory to gradually render a mark. Wraps _createMarkRenderer.
 * @param brush
 * @param options
 * @returns
 */
export function createMarkRenderer(brush: IBrush, options = {} as ISettings) {
  const { container, addPoint } = _createMarkRenderer(brush, options)

  currSurface.addChild(container)

  function addPoints(points: number[][]) {
    for (let pt of points) {
      addPoint(pt)
    }
  }

  function complete() {
    prevSurface.addChild(currSurface.removeChild(container))
  }

  return { addPoint, addPoints, complete }
}

/**
 * Render a full mark.
 * @param points
 * @param brush
 * @param options
 */
export function renderMark(
  points: number[][],
  brush: IBrush,
  options = {} as ISettings
) {
  const renderer = createMarkRenderer(brush, options)

  for (let i = 0, len = points.length; i < len; i++) {
    renderer.addPoint(points[i])
  }

  renderer.complete()
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

export function resize(w: number, h: number) {
  app.renderer.resize(w, h)
}

export default app
export type ICreateMarkRenderer = typeof _createMarkRenderer
export type CreateMarkRenderer = typeof createMarkRenderer
export type RenderMark = typeof renderMark
