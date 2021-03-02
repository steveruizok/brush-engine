import { ISettings, IBrush } from "../types"
import { getOuterTangents } from "../utils"
import * as Bezier from "../curves/bezier"
import * as Vector from "../curves/vector"
import * as Utils from "../curves/utils"
import { IVector } from "../curves/types"

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
  let i = 0
  let stroke: number[][] = []
  let A: IVector, B: IVector, p1: IVector, pc: IVector, p2: IVector
  let prev: number[]

  function addPoint(point: IVector, last = false) {
    // Bail early if the distance is too short
    if (!last && A) {
      const dist = Vector.distance(point, A)
      if (dist < 24) {
        return
      }
    }

    // Prior point
    A = B

    // Current point
    B = [point[0] / dpr, point[1] / dpr, point[2]]

    // Add point to stroke
    stroke.push(B)

    // Too short for a bezier
    if (stroke.length < 3) {
      return
    }

    if (last) {
      // last Stroke
      p1 = Vector.med(Utils.at(stroke, -2), A)
      pc = A
      p2 = B
    } else if (stroke.length === 3) {
      p1 = Utils.at(stroke, -2)
      pc = stroke[1]
      p2 = Vector.med(stroke[1], stroke[2])
    } else {
      p1 = Vector.med(Utils.at(stroke, -2), A)
      pc = A
      p2 = Vector.med(B, A)
    }

    // New bezier curve
    let b = Bezier.create(p1, pc, p2)

    // Point?
    let t = Bezier.closestTtoPc(b)
    let pt = Bezier.getPointAtT(b, t)

    // Points at start of curve segment
    let strokeWeight = Utils.prior(stroke)[2] / 2
    let p1n = Bezier.normalUnitVectorAtT(b, 0)
    let p1L = Vector.add(p1, Vector.mul(p1n, +strokeWeight))
    let p1R = Vector.add(p1, Vector.mul(p1n, -strokeWeight))

    // Points at end of curve segment
    strokeWeight = B[2] / 2
    let p2n = Bezier.normalUnitVectorAtT(b, 1)
    let p2L = Vector.add(p2, Vector.mul(p2n, +strokeWeight))
    let p2R = Vector.add(p2, Vector.mul(p2n, -strokeWeight))

    const angle = Bezier.angDegrees(b)

    // If the angle is closed...
    if (Math.abs(angle) < 120) {
      // Points at middle of curve segment
      strokeWeight = Utils.lerp(A[2], B[2], t) / 2
      let ptn = Bezier.normalUnitVectorAtT(b, t)
      let ptL = Vector.add(pt, Vector.mul(ptn, +strokeWeight))
      let ptR = Vector.add(pt, Vector.mul(ptn, -strokeWeight))

      let p1c = Bezier.getControlPointOfASegment(b, 0, t)
      let b1 = Bezier.create(p1, p1c, pt)
      let p1m = Vector.add(p1n, ptn)

      // Interpolate over 0-t (original bezier b) the t of p1 p1c pt
      let p1t = Utils.lerp(0, t, Bezier.closestTtoPc(b1))

      // Use that t to know the stroke weight on that point
      strokeWeight = Utils.lerp(A[2], B[2], p1t) / Vector.len2(p1m)

      // Expand with that strokeWeight the bezier stroke
      let p1cL = Vector.add(p1c, Vector.mul(p1m, +strokeWeight))
      let p1cR = Vector.add(p1c, Vector.mul(p1m, -strokeWeight))

      // Repeat for second control point
      let p2c = Bezier.getControlPointOfASegment(b, t, 1)
      let b2 = Bezier.create(pt, p2c, p2)
      let p2m = Vector.add(ptn, p2n)
      let p2t = Utils.lerp(t, 1, Bezier.closestTtoPc(b2))

      strokeWeight = Utils.lerp(A[2], B[2], p2t) / Vector.len2(p2m)
      let p2cL = Vector.add(p2c, Vector.mul(p2m, +strokeWeight))
      let p2cR = Vector.add(p2c, Vector.mul(p2m, -strokeWeight))

      if (angle < 0) {
        ctx.beginPath()
        ctx.moveTo(p1L[0], p1L[1])
        ctx.quadraticCurveTo(p1cL[0], p1cL[1], ptL[0], ptL[1])
        ctx.quadraticCurveTo(p2cL[0], p2cL[1], p2L[0], p2L[1])
        ctx.lineTo(p2R[0], p2R[1])
        ctx.closePath()
        ctx.lineWidth = 1
        ctx.strokeStyle = "white"
        ctx.fillStyle = "white"
        ctx.fill()
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.moveTo(p1R[0], p1R[1])
        ctx.quadraticCurveTo(p1cR[0], p1cR[1], ptR[0], ptR[1])
        ctx.quadraticCurveTo(p2cR[0], p2cR[1], p2R[0], p2R[1])
        ctx.lineTo(p2L[0], p2L[1])
        ctx.lineTo(p1L[0], p1L[1])
        ctx.closePath()
        ctx.lineWidth = 1
        ctx.strokeStyle = "white"
        ctx.fillStyle = "white"
        ctx.fill()
        ctx.stroke()
      }
    } else {
      let ptm = Vector.add(p1n, p2n)
      strokeWeight = Utils.lerp(A[2], B[2], t) / Vector.len2(ptm)
      let ptcL = Vector.add(pc, Vector.mul(ptm, +strokeWeight))
      let ptcR = Vector.add(pc, Vector.mul(ptm, -strokeWeight))

      ctx.beginPath()
      ctx.moveTo(p1L[0], p1L[1])
      ctx.quadraticCurveTo(ptcL[0], ptcL[1], p2L[0], p2L[1])
      ctx.lineTo(p2R[0], p2R[1])
      ctx.quadraticCurveTo(ptcR[0], ptcR[1], p1R[0], p1R[1])
      ctx.closePath()
      ctx.lineWidth = 1
      ctx.strokeStyle = "white"
      ctx.fillStyle = "white"
      ctx.fill()
      ctx.stroke()
    }
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

function drawPointsSize(len: number) {
  const dpr = window.devicePixelRatio
  ctx.font = 16 / dpr + "px Arial"
  ctx.clearRect(0, 0, 112, 40 + 56 / dpr)
  ctx.fillStyle = "white"
  ctx.fillText("input points", 16, 40)
  ctx.fillText(String(len), 72, 40)
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

// Experimental Stuff

let ctx = canvas?.getContext("2d")

interface PaintOptions {
  fill?: boolean
  stroke?: boolean
  strokeStyle?: string
  fillStyle?: string
  strokeWidth?: number
}

function paint(options = {} as PaintOptions) {
  const {
    fill = false,
    stroke = true,
    fillStyle = "rgba(255, 255, 255, .82)",
    strokeStyle = "rgba(255, 255, 255, .82)",
    strokeWidth = 2,
  } = options

  ctx.save()

  if (fill) {
    ctx.fillStyle = fillStyle
    ctx.fill()
  }

  if (stroke) {
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = strokeWidth
    ctx.stroke()
  }

  ctx.restore()
}

function drawCircle(
  cx: number,
  cy: number,
  r: number,
  options = {} as PaintOptions
) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  paint(options)
}

function drawDot(cx: number, cy: number, r = 2, options = {} as PaintOptions) {
  drawCircle(cx, cy, r, {
    ...options,
    fill: true,
    stroke: true,
    strokeStyle: "rgba(0,0,0,.5)",
    strokeWidth: 1,
    fillStyle: "red",
  })
}

function drawLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  options?: PaintOptions
) {
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  paint(options)
}

function drawCurve(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  options?: PaintOptions
) {
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.quadraticCurveTo(cx, cy, x1, y1)
  paint(options)
}

function drawOuterTangents(
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number
) {
  const [G0x, G0y, H0x, H0y, G1x, G1y, H1x, H1y] = getOuterTangents(
    x0,
    y0,
    r0,
    x1,
    y1,
    r1
  )
  drawLine(G0x, G0y, H0x, H0y)
  drawLine(G1x, G1y, H1x, H1y)
  drawDot(G0x, G0y)
  drawDot(G1x, G1y)
  drawDot(H0x, H0y)
  drawDot(H1x, H1y)
}

export function setupExperiment() {}
