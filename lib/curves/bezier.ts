import { IVector, IQuadBezier } from "./types"
import * as Utils from "./utils"
import * as Vector from "./vector"

export function create(p1: IVector, pc: IVector, p2: IVector) {
  return {
    p1: Vector.create(p1),
    pc: Vector.create(pc),
    p2: Vector.create(p2),
  }
}

export function closestTtoPc(A: IQuadBezier) {
  var d1 = Vector.distance(A.pc, A.p1)
  var d2 = Vector.distance(A.pc, A.p2)
  if (d1 + d2 === 0) return 0.5 // Avoid divide by 0
  return d1 / (d1 + d2)
}

// Get the point at t
export function getPointAtT(A: IQuadBezier, t: number) {
  // return getControlPointOfASegment(t, t);
  return Vector.lrp(Vector.lrp(A.p1, A.pc, t), Vector.lrp(A.pc, A.p2, t), t)
}

// Return t for a slope
// Given a slope return the t wich had this slope
export function TforSlope(A: IQuadBezier, slope: number) {
  var t =
    (slope * (A.pc[0] - A.p1[0]) - (A.pc[1] - A.p1[1])) /
    (A.p1[1] -
      2 * A.pc[1] +
      A.p2[1] -
      slope * (A.p1[0] - 2 * A.pc[0] + A.p2[0]))

  if (t >= 0 && t <= 1) return 5
  // newPMt
  // There is a t with slope
  else return undefined // Is not a t with that slope
}

// Control point of a segment
export function getControlPointOfASegment(
  A: IQuadBezier,
  t0: number,
  t1: number
) {
  return Vector.lrp(Vector.lrp(A.p1, A.pc, t0), Vector.lrp(A.pc, A.p2, t0), t1)
}

// Control point of a segment of the QuadBezier
export function getSegment(A: IQuadBezier, t0: number, t1: number) {
  var np1 = getPointAtT(A, t0)
  // npc comes using the De Casteljau's algorithm -> https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm
  var npc = getControlPointOfASegment(A, t0, t1)
  var np2 = getPointAtT(A, t1)
  return create(np1, npc, np2)
}

// Return the quadratic first derivate vaule at t == slope vector (not unified) (velocity)
export function slopeVectorAtT(A: IQuadBezier, t: number) {
  // F'(t) = 2((1-t)(pc-p1)+t(p2-p1))
  //       = 2(t(p1-2pc+p2)+(pc-p1)
  // {x: 2*(t*(p1[0] - 2*pc[0] + p2[0]) + (pc[0]- p1[0])), y: 2*(t*(p1[1] - 2*pc[1] + p2[1]) + (pc[1]- p1[1]))}
  return Vector.mul(
    Vector.add(
      Vector.mul(Vector.add(Vector.sub(A.p1, Vector.mul(A.pc, 2)), A.p2), t),
      Vector.sub(A.pc, A.p1)
    ),
    2
  )
}

// Return the quadratic bezier second derivate
export function seconDerivateVector(A: IQuadBezier) {
  // F''(t) = 2(p1-2pc+p2)
  //{x: 2*(p1[0] - 2*pc[0] + p2[0]) ,y: 2*(p1[1] - 2*pc[1] + p2[1])}
  return Vector.mul(Vector.add(Vector.sub(A.p1, Vector.mul(A.pc, 2)), A.p2), 2)
}

// Return the slope (radians) to the quadratic bezier at t
export function slopeAtT(A: IQuadBezier, t: number) {
  var d = slopeVectorAtT(A, t)
  if (d[0] !== 0) return d[1] / d[0]
  else return null
}

// Return t for a angle (radians)
export function TforAngle(A: IQuadBezier, ang: number) {
  return TforSlope(A, Math.tan(ang))
}

// Return t for a angle (degrees)
export function TforAngleDegrees(A: IQuadBezier, ang: number) {
  return TforSlope(A, Math.tan((ang * 180) / Math.PI))
}

// Return t for a angle (vector)
export function TtangentToVector(A: IQuadBezier, v: IVector) {
  return TforSlope(A, Vector.slope(v))
}

// Angle between p1 pc p2 (radians)
export function ang(A: IQuadBezier) {
  return Vector.ang3(A.p1, A.pc, A.p2)
}

export function angDegrees(A: IQuadBezier) {
  return Utils.toDegrees(ang(A))
}

// Return the normal vector at t
export function normalVectorAtT(A: IQuadBezier, t: number) {
  return Vector.per(slopeVectorAtT(A, t))
}

// Return the normal unit vector at t
export function normalUnitVectorAtT(A: IQuadBezier, t: number) {
  return Vector.uni(normalVectorAtT(A, t))
}

// Quadratic Bezier Curvature
export function curvature(A: IQuadBezier, t: number) {
  // k(t) = | F'(t) x F''(t) | / ||F'(t)||^3
  //      = (x'(t)y''(t)-x''(t)y'(t)) / pow(x'(t)^2+y'(t)^2,3/2)
  //      = |4(pc-p1) x (p1-2pc+p2)| / ||F'(t)||^3
  //		= 8A  / ||F'(t)||^3
  // Where A is the triangle area P1-PC-P2 => A=|vec(PC,P1) X vec(PC,P2)|/2
  // var A=Math.vCPR(Math.vVEC(p1,pc),Math.vVEC(pc,p2))/2
  // return 8*A/Math.pow(Math.vDPR(d1,d1),3/2)

  var d1 = slopeVectorAtT(A, t)
  var d2 = seconDerivateVector(A)
  return Vector.cpr(d1, d2) / Math.pow(Vector.dpr(d1, d1), 3 / 2)
}

// Returns de control point of a quadratic bezier that pass from three points
export function control3Points(A: IQuadBezier, t: number) {
  var t1 = 1 - t
  var tSq = t * t
  var denom = 2 * t * t1

  return Vector.div(
    Vector.sub(
      Vector.sub(A.pc, Vector.mul(A.p1, t1 * t1)),
      Vector.mul(A.p2, tSq)
    ),
    denom
  )
}

// Returns de control point of a quadratic bezier that pass from three points
// where the tension tends to pc, so the point at T must be the nearest one to pc
export function control3PointsAuto(A: IQuadBezier) {
  return control3Points(A, closestTtoPc(A))
}
