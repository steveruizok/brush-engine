import { ISettings, IBrush } from "../types"
import {
  projectPoint,
  lerpAngles,
  angleDelta,
  modulate,
  simplify,
  getSpline,
  clockwise,
  getPointBetween,
  circleFromThreePoints,
} from "../utils"
import * as Vector from "../curves/vector"
import { IVector } from "lib/curves/types"

// Here I'm not going to use multiple layers (yet).
// as we don't need to erase previous strokes in order to paint new ones.

const canvas = document.createElement("canvas")

const PI = Math.PI,
  PI2 = PI * 2,
  TAU = PI / 2

let dpr = window.devicePixelRatio || 1

/**
 * Mount into an element.
 * @param element
 */
export function mount(element: HTMLElement) {
  if (typeof window !== "undefined") {
    const dpr = window.devicePixelRatio
    canvas.width = element.offsetWidth * dpr
    canvas.height = element.offsetHeight * dpr
    canvas.style.setProperty("position", "absolute")
    canvas.style.setProperty("width", canvas.width + "px")
    canvas.style.setProperty("height", canvas.height + "px")

    const ctx = canvas.getContext("2d")
    ctx.scale(dpr, dpr)
  }

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
  function addPoint([x, y, r]: number[]) {}

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

function scalePoint(pt: number[], scale: number) {
  return pt.map((p) => p / scale)
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
  const ctx = canvas.getContext("2d")
  const pts = points.map((p) => scalePoint(p, dpr))

  ctx.fillStyle = "green"
  ctx.strokeStyle = "#fff"

  const leftPoints: number[][] = []
  const rightPoints: number[][] = []

  if (pts.length < 3) {
    const [x, y, r] = pts[0]

    // ctx.arc(x, y, r, 0, PI2)
    // Handle this differently
    // Draw a circle at the first point
    return
  }

  let err = 0
  let Pa: number
  let Ps = 0
  let P: number[]
  let Pl: number[]
  let Pr: number[]
  let Pc = "left"
  let Pba = 0

  for (let i = 0, len = pts.length; i < len; i++) {
    const B = pts[i]
    const C = pts[i + 1]

    if (i === 0) {
      leftPoints.push([B[0], B[1]])
      rightPoints.push([B[0], B[1]])
      P = B
      Pl = B
      Pr = B
    }

    if (i > 0 && i < len - 2) {
      const [Ax, Ay, As] = P
      const [Bx, By, Bs] = B
      const [Cx, Cy] = C

      const ABa = Vector.ang(P, B)
      const BCa = Vector.ang(B, C)
      let MBa = lerpAngles(ABa, BCa, 0.5)

      const delta = angleDelta(Pa, MBa)

      const dist = Math.hypot(P[1] - By, P[0] - Bx)
      const rChange = Math.abs(Bs - Ps)

      if (
        i > len - 10 ||
        dist > brush.size ||
        rChange > 2 ||
        (dist > 1 && Math.abs(delta) > TAU)
      ) {
        P = B
        let s = Bs

        if (leftPoints.length === 1) {
          s /= 2
        }

        if (i > pts.length - 8) {
          const eDist = Vector.distance(B, pts[len - 1])
          if (eDist < brush.size * 2) continue
        }

        if (Math.abs(delta) > TAU) {
          // ctx.beginPath()
          // ctx.arc(Bx, By, 2, 0, PI2)
          // ctx.fillStyle = "red"
          // ctx.fill()
          if (delta > 0) {
            // right turn
          } else {
            // left turn
            // rightPoints.pop()
          }
        }

        const Ml = projectPoint(Bx, By, MBa - TAU, s)
        const Mr = projectPoint(Bx, By, MBa + TAU, s)

        if (Vector.distance(Ml, Pl) > brush.size / 4) {
          leftPoints.push(Ml)
          Pl = Ml
        }

        if (Vector.distance(Mr, Pr) > brush.size / 4) {
          rightPoints.push(Mr)
          Pr = Mr
        }

        Pa = MBa
        Ps = s
      }
    } else if (i === len - 1) {
      const [Bx, By] = B
      leftPoints.push([Bx, By])
    }
  }

  const ptsToDraw = leftPoints.concat([...rightPoints].reverse())

  // QUADRADIC CURVE BETWEEN POINTS

  // if (ptsToDraw.length > 3) {
  //   const path = new Path2D()
  //   let [x0, y0] = ptsToDraw[0]
  //   let [x1, y1] = ptsToDraw[1]
  //   let [x2, y2] = ptsToDraw[2]
  //   path.moveTo(x0, y0)

  //   for (let i = 1, len = ptsToDraw.length; i < len + 1; i++) {
  //     const [mpx, mpy] = getPointBetween(x0, y0, x1, y1, 0.5)
  //     path.quadraticCurveTo(x0, y0, mpx, mpy)
  //     ;[x0, y0] = [x1, y1]
  //     ;[x1, y1] = ptsToDraw[(i + 1) % ptsToDraw.length]
  //   }

  //   path.closePath()

  //   ctx.save()
  //   ctx.lineWidth = 1
  //   ctx.fillStyle = "rgba(255, 0, 255, .1)"
  //   ctx.strokeStyle = "rgba(255, 0, 255, .1)"
  //   ctx.stroke(path)
  //   ctx.fill(path)
  //   ctx.restore()
  // }

  // CATMULL ROM SPLINE

  const splined = getSpline(ptsToDraw, 1)

  ctx.beginPath()
  ctx.moveTo(splined[0][0], splined[0][1])
  for (let [cp1x, cp1y, cp2x, cp2y, px, py] of splined) {
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, px, py)
  }

  ctx.fillStyle = "rgba(255, 0, 255, .9)"
  ctx.strokeStyle = "rgba(255, 255, 0, 1)"
  // ctx.fill()
  ctx.stroke()

  // DRAW DOTS

  // const dots = new Path2D()
  // for (let [x0, y0] of ptsToDraw) {
  //   dots.moveTo(x0, y0)
  //   dots.arc(x0, y0, 1, 0, PI2)
  // }

  // ctx.save()
  // ctx.fillStyle = "rgba(255, 32, 255, 1)"
  // ctx.fill(dots)
  // ctx.restore()

  // DRAW TEXT

  ctx.font = 16 / dpr + "px Arial"
  ctx.clearRect(0, 0, 112, 40 + 56 / dpr)
  ctx.fillStyle = "white"
  ctx.fillText("input points", 16, 40)
  ctx.fillText("path points", 16, 40 + 24 / dpr)
  ctx.fillText(String(points.length), 72, 40)
  ctx.fillText(String(ptsToDraw.length), 72, 40 + 24 / dpr)

  // const renderer = createMarkRenderer(brush, options)

  // for (let i = 0, len = points.length; i < len; i++) {
  //   renderer.addPoint(points[i])
  // }

  // renderer.complete()
}

function drawPoints(...pts: number[][]) {
  const ctx = canvas.getContext("2d")
  ctx.save()
  ctx.beginPath()
  for (let [x, y] of pts) {
    ctx.moveTo(x, y)
    ctx.arc(x, y, 1.5, 0, PI2)
  }
  ctx.fill()
  ctx.restore()
}

/**
 * Resize to the provided dimensions.
 * @param w
 * @param h
 */
export function resize(w: number, h: number) {
  dpr = window.devicePixelRatio || 1
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
    strokeStyle: "black",
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

  ctx = canvas.getContext("2d")
  ctx.lineWidth = 2
  ctx.strokeStyle = "rgba(255, 255, 255, .82)"
  ctx.fillStyle = "rgba(255, 255, 255, .82)"

  // Circles A and B
  drawCircle(Ax, Ay, Ar)
  drawDot(Ax, Ay)

  drawCircle(Bx, By, Br)
  drawDot(Bx, By)

  drawCircle(Cx, Cy, Cr)
  drawDot(Cx, Cy)

  drawOuterTangents(Ax, Ay, Ar, Bx, By, Br)
  drawOuterTangents(Bx, By, Br, Cx, Cy, Cr)

  // // Circle connecting points?

  // const ab = getOuterTangents(Ax, Ay, Ar, Bx, By, Br)
  // const bc = getOuterTangents(Bx, By, Br, Cx, Cy, Cr)

  // const dxAB = Bx - Ax,
  //   dyAB = By - Ay,
  //   dxBC = Cx - Bx,
  //   dyBC = Cy - By

  // const alAB = Math.atan2(dyAB, dxAB)
  // const alBC = Math.atan2(dyBC, dxBC)
  // const aABC = lerpAngles(alAB, alBC, 0.5)

  // const abcx0 = Bx + Br * Math.cos(aABC - TAU),
  //   abcy0 = By + Br * Math.sin(aABC - TAU),
  //   abcx1 = Bx + Br * Math.cos(aABC + TAU),
  //   abcy1 = By + Br * Math.sin(aABC + TAU)

  // const [cx, cy, cr] = circleFromThreePoints(
  //   ab[0],
  //   ab[1],
  //   abcx0,
  //   abcy0,
  //   bc[2],
  //   bc[3]
  // )
  // drawCircle(cx, cy, cr)

  // drawDot(abcx0, abcy0)
  // drawDot(ab[0], ab[1])
  // drawDot(bc[2], bc[3])

  // const pts = getSpline(
  //   [
  //     [ab[0], ab[1]],
  //     // [ab[2], ab[3]],
  //     [abcx0, abcy0],
  //     // [bc[0], bc[1]],
  //     [bc[2], bc[3]],
  //   ],
  //   1
  // )
  // ctx.beginPath()
  // ctx.strokeStyle = "white"
  // ctx.fillStyle = "white"
  // ctx.moveTo(ab[0], ab[1])
  // for (let i = 1; i < pts.length; i++) {
  //   ctx.bezierCurveTo(
  //     pts[i][0],
  //     pts[i][1],
  //     pts[i][2],
  //     pts[i][3],
  //     pts[i][4],
  //     pts[i][5]
  //   )
  // }
  // ctx.stroke()
  // drawCurve(ab[4], ab[5], abcx0, abcy0, bc[6], bc[7])
}

/**
 * Get outer tangents of two circles.
 * @param x0
 * @param y0
 * @param r0
 * @param x1
 * @param y1
 * @param r1
 * @returns [lx0, ly0, lx1, ly1, rx0, ry0, rx1, ry1]
 */
function getOuterTangents(
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number
) {
  const dx = x1 - x0,
    dy = y1 - y0,
    dist = Math.hypot(dx, dy)

  // Circles are overlapping, no tangents
  if (dist < Math.abs(r1 - r0)) return

  const a0 = Math.atan2(dy, dx),
    a1 = Math.acos((r0 - r1) / dist),
    t0 = a0 + a1,
    t1 = a0 - a1

  return [
    x0 + r0 * Math.cos(t1),
    y0 + r0 * Math.sin(t1),
    x1 + r1 * Math.cos(t1),
    y1 + r1 * Math.sin(t1),
    x0 + r0 * Math.cos(t0),
    y0 + r0 * Math.sin(t0),
    x1 + r1 * Math.cos(t0),
    y1 + r1 * Math.sin(t0),
  ]
}
