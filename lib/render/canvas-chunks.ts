import { ISettings, IBrush } from "../types"
import {
  angleDelta,
  getOuterTangents,
  getSpline,
  lerp,
  projectPoint,
  rotatePoint,
  clamp,
} from "../utils"
import * as Bezier from "../curves/bezier"
import * as Vector from "../curves/vector"
import * as Utils from "../curves/utils"
import { IVector, IPoint } from "../curves/types"
import getCurve from "../curves/getCurve"

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
  const { spacing, color = "#ffffff", opacity = 1, alpha = 1 } = brush
  let i = 0,
    A: number[],
    B: number[],
    C: number[],
    error = 0
  const stroke: number[][] = []

  let pA = 0,
    dA = 0

  const leftPts: number[][] = []
  const rightPts: number[][] = []

  // Function that draws a point
  function addPoint([x1, y1, r1]: number[]) {
    A = B
    B = C
    C = [x1 / dpr, y1 / dpr, r1 / dpr]

    stroke.push(C)

    if (B) {
      // let ang = Math.atan2(C[1] - B[1], C[0] - B[0])
      // dA = angleDelta(ang, pA)
      // pA = ang
      // if (Math.abs(dA) > Math.PI * 0.75) {
      // Sharp corner
      // for (let t = 0, step = 0.1; t <= 1; t += step) {
      //   const [px, py] = projectPoint(
      //     B[0],
      //     B[1],
      //     ang + Math.PI / 2 + t * Math.PI,
      //     B[2]
      //   )
      //   leftPts.push([px, py])
      // }
      // for (let t = 0, step = 0.1; t <= 1; t += step) {
      //   const [px, py] = projectPoint(
      //     B[0],
      //     B[1],
      //     ang - Math.PI / 2 + t * Math.PI,
      //     B[2]
      //   )
      //   rightPts.push([px, py])
      // }
      // return
      // }
    }

    if (stroke.length <= 2) {
      const [x2, y2, r2] = C

      drawCircle(x2, y2, r2, {
        stroke: false,
        fill: true,
        fillStyle: color,
        strokeWidth: 1,
        strokeStyle: color,
        alpha: 1,
      })

      if (stroke.length === 2) {
        const [x1, y1, r1] = B

        const pts = getOuterTangents(x1, y1, r1, x2, y2, r2)

        if (pts) {
          let [G0x, G0y, H0x, H0y, G1x, G1y, H1x, H1y] = pts
          leftPts.push([G0x, G0y], [H0x, H0y])
          rightPts.push([G1x, G1y], [H1x, H1y])

          drawChunk(G0x, G0y, H0x, H0y, H1x, H1y, G1x, G1y, {
            stroke: false,
            fill: true,
            fillStyle: color,
            strokeWidth: 1,
            strokeStyle: color,
            alpha: 1,
          })
        }
      }
    } else {
      const p1 = Vector.med(A, B)
      const pc = B
      const p2 = Vector.med(B, C)
      const b = Bezier.create(p1, pc, p2)

      // Interpolate chunks
      let P = [...p1, B[2]]
      for (let t = 0, step = 0.25; t <= 1; t += step) {
        const [x, y] = Bezier.getPointAtT(b, t)
        const r = lerp(B[2], C[2], t)

        drawCircle(x, y, r, {
          stroke: false,
          fill: true,
          fillStyle: color,
          strokeWidth: 1,
          strokeStyle: color,
          alpha: 1,
        })

        const pts = getOuterTangents(P[0], P[1], P[2], x, y, r)

        if (pts) {
          let [G0x, G0y, H0x, H0y, G1x, G1y, H1x, H1y] = pts
          leftPts.push([G0x, G0y], [H0x, H0y])
          rightPts.push([G1x, G1y], [H1x, H1y])

          drawChunk(G0x, G0y, H0x, H0y, H1x, H1y, G1x, G1y, {
            stroke: false,
            fill: true,
            fillStyle: color,
            strokeWidth: 1,
            strokeStyle: color,
            alpha: 1,
          })
        }

        P = [x, y, r]
      }
    }

    // Trace points

    // if (leftPts.length > 1) {
    //   clean()
    //   // ctx.moveTo(leftPts[0][0], leftPts[0][1])
    //   // for (let pt of leftPts) {
    //   //   ctx.lineTo(pt[0], pt[1])
    //   // }
    //   for (let pt of getSpline(leftPts, 0.5)) {
    //     ctx.bezierCurveTo(pt[0], pt[1], pt[2], pt[3], pt[4], pt[5])
    //   }
    //   ctx.save()
    //   ctx.strokeStyle = "red"
    //   ctx.stroke()
    //   ctx.restore()
    // }

    // if (rightPts.length > 1) {
    //   // ctx.moveTo(rightPts[0][0], rightPts[0][1])
    //   // for (let pt of rightPts) {
    //   //   ctx.lineTo(pt[0], pt[1])
    //   // }
    //   for (let pt of getSpline(rightPts, 0.5)) {
    //     ctx.bezierCurveTo(pt[0], pt[1], pt[2], pt[3], pt[4], pt[5])
    //   }
    //   ctx.save()
    //   ctx.strokeStyle = "red"
    //   ctx.stroke()
    //   ctx.restore()
    // }

    i++
    drawPointsSize(i)
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
  alpha?: number
}

function paint(options = {} as PaintOptions) {
  const {
    fill = false,
    stroke = true,
    fillStyle = "rgba(255, 255, 255, 1)",
    strokeStyle = "rgba(255, 255, 255, 1)",
    strokeWidth = 1,
    alpha = 1,
  } = options

  ctx.save()

  ctx.globalAlpha = alpha

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
    fill: true,
    stroke: true,
    strokeStyle: "rgba(0,0,0,.5)",
    strokeWidth: 1,
    fillStyle: "red",
    ...options,
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

function drawChunk(
  p0x: number,
  p0y: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  options?: PaintOptions
) {
  ctx.beginPath()
  ctx.moveTo(p0x, p0y)
  ctx.lineTo(p1x, p1y)
  ctx.lineTo(p2x, p2y)
  ctx.lineTo(p3x, p3y)
  ctx.closePath()
  paint({
    alpha: 1,
    stroke: true,
    fill: true,
    strokeWidth: 1,
    ...options,
  })
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

export function setupExperiment() {
  const Ax = 100,
    Ay = 150,
    Ar = 100,
    Bx = 300,
    By = 250,
    Br = 50,
    Cx = 300,
    Cy = 450,
    Cr = 100

  if (!canvas) return
}
