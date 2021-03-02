import { ISettings, IBrush } from "./types"

// Here I'm not going to use multiple layers (yet).
// as we don't need to erase previous strokes in order to paint new ones.

const canvas = document.createElement("canvas")

/**
 * Mount into an element.
 * @param element
 */
export function mount(element: HTMLElement) {
  const dpr = window.devicePixelRatio
  canvas.width = element.offsetWidth * dpr
  canvas.height = element.offsetHeight * dpr
  canvas.style.setProperty("position", "absolute")
  canvas.style.setProperty("width", canvas.width + "px")
  canvas.style.setProperty("height", canvas.height + "px")

  const ctx = canvas.getContext("2d")
  ctx.scale(dpr, dpr)

  element.append(canvas)
}

/**
 * Unmount from an element.
 */
export function unmount() {
  const parent = canvas.parentElement
  parent.removeChild(canvas)
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

  // Function that draws a point
  function addPoint([x, y, r]: number[]) {
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = color
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.ellipse(x / dpr, y / dpr, r / 4, r / 4, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  return { addPoint }
}

/**
 * Get a factory to gradually render a mark. Wraps _createMarkRenderer.
 * @param brush
 * @param options
 * @returns
 */
export function createMarkRenderer(brush: IBrush, options = {} as ISettings) {
  const { addPoint } = _createMarkRenderer(brush, options)

  function addPoints(points: number[][]) {
    for (let pt of points) {
      addPoint(pt)
    }
  }

  function complete() {}

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

/**
 * Resize to the provided dimensions.
 * @param w
 * @param h
 */
export function resize(w: number, h: number) {
  const dpr = window.devicePixelRatio
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.setProperty("position", "absolute")
  canvas.style.setProperty("width", canvas.width + "px")
  canvas.style.setProperty("height", canvas.height + "px")

  const ctx = canvas.getContext("2d")
  ctx.scale(dpr, dpr)
}

/**
 * Clean the surface.
 */
export function clean() {
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

export type ICreateMarkRenderer = typeof _createMarkRenderer
export type CreateMarkRenderer = typeof createMarkRenderer
export type RenderMark = typeof renderMark
