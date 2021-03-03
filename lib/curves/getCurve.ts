import { IVector } from "./types"
import * as Vector from "./vector"
import * as Bezier from "./bezier"

export default function getCurve(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  // Generate a curve
  // Generate circles ([x, y, r]) spaced along the curve
  const A = [x0, y0],
    B = [x1, y1],
    C = [x2, y2]

  const p1 = Vector.med(A, B)
  const pc = B
  const p2 = Vector.med(B, C)
  const b = Bezier.create(p1, pc, p2)

  let p1n = Bezier.normalUnitVectorAtT(b, 0)
  let g0 = Vector.add(p1, p1n)

  let t = Bezier.closestTtoPc(b)
  let pt = Bezier.getPointAtT(b, t)
  let ptn = Bezier.normalUnitVectorAtT(b, t)
  let g1 = Vector.add(pt, ptn)

  let p2n = Bezier.normalUnitVectorAtT(b, 1)
  let g2 = Vector.add(p2, p2n)

  let ptm = Vector.med(p1n, p2n)
  let cr = Vector.add(pc, ptm)

  return [...g0, ...cr, ...g1, ...g2]
}
