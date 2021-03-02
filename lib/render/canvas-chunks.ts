import { ISettings, IBrush } from "../types"
import { getOuterTangents } from "../utils"
import * as Bezier from "../curves/bezier"
import * as Vector from "../curves/vector"
import * as Utils from "../curves/utils"
import { IVector, IPoint } from "../curves/types"

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
  let i = 0,
    O: number[],
    A: number[],
    B: number[]
  const stroke: number[][] = []

  // Function that draws a point
  function addPoint([x1, y1, r1]: number[]) {
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "white"
    ctx.strokeStyle = "white"
    ctx.lineJoin = "round"

    O = A
    A = B
    B = [x1 / dpr, y1 / dpr, r1 / dpr]

    stroke.push(B)

    if (stroke.length > 2) {
      const p1 = Vector.med(O, A)
      const pc = A
      const p2 = Vector.med(B, A)

      const b = Bezier.create(p1, pc, p2)

      let p1n = Bezier.normalUnitVectorAtT(b, 0)
      let g0 = Vector.add(p1, p1n)

      // let t = Bezier.closestTtoPc(b)
      // let pt = Bezier.getPointAtT(b, t)
      // let ptn = Bezier.normalUnitVectorAtT(b, t)
      // let g1 = Vector.add(pt, ptn)

      let p2n = Bezier.normalUnitVectorAtT(b, 1)
      let g2 = Vector.add(p2, p2n)

      let ptm = Vector.med(p1n, p2n)
      let cr = Vector.add(pc, ptm)

      // drawDot(cr[0], cr[1], 1, { strokeStyle: "white" })

      ctx.beginPath()
      ctx.moveTo(g0[0], g0[1])
      ctx.quadraticCurveTo(cr[0], cr[1], g2[0], g2[1])
      // ctx.lineWidth = r1 / dpr
      ctx.stroke()

      drawCircle(g2[0], g2[1], r1 / 2, {
        stroke: true,
        fill: true,
        fillStyle: "white",
        strokeWidth: 1,
        strokeStyle: "white",
      })

      const [x0, y0, r0] = A

      const pts = getOuterTangents(g0[0], g0[1], A[2], g2[0], g2[1], B[2])

      if (pts) {
        ctx.save()
        ctx.globalAlpha = 0.5
        const [G0x, G0y, H0x, H0y, G1x, G1y, H1x, H1y] = pts
        ctx.beginPath()
        ctx.moveTo(G0x, G0y)
        ctx.lineTo(H0x, H0y)
        ctx.lineTo(H1x, H1y)
        ctx.lineTo(G1x, G1y)
        ctx.lineTo(G0x, G0y)
        ctx.stroke()
        ctx.fill()
        ctx.restore()
      }
    } else {
      drawCircle(B[0], B[1], B[2] / 2, {
        stroke: true,
        fill: true,
        fillStyle: "white",
        strokeWidth: 1,
        strokeStyle: "white",
      })
    }

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

  // ctx = canvas.getContext("2d")
  // ctx.lineWidth = 2
  // ctx.strokeStyle = "rgba(255, 255, 255, .82)"
  // ctx.fillStyle = "rgba(255, 255, 255, .82)"

  // // Circles A and B
  // drawCircle(Ax, Ay, Ar)
  // drawDot(Ax, Ay)

  // drawCircle(Bx, By, Br)
  // drawDot(Bx, By)

  // drawCircle(Cx, Cy, Cr)
  // drawDot(Cx, Cy)

  // drawOuterTangents(Ax, Ay, Ar, Bx, By, Br)
  // drawOuterTangents(Bx, By, Br, Cx, Cy, Cr)

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
