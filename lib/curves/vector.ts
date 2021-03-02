import { IVector } from "./types"
import * as Utils from "./utils"

/**
 * Create a new vector object.
 */
export function create(x: number, y: number): IVector
export function create(A: IVector): IVector
export function create(x: number | IVector, y?: number): IVector {
  // A new copy the vector object
  if (Array.isArray(x)) {
    return [...x]
  }

  return [x, y as number]
}

/**
 * Get the scope of a vector.
 * @param A
 */
export function slope(A: IVector) {
  return A[1] / A[0]
}

/**
 * Add vectors.
 * @param A
 * @param B
 */
export function add(A: IVector, B: IVector) {
  return create(A[0] + B[0], A[1] + B[1])
}

/**
 * Subtract vectors.
 * @param A
 * @param B
 */
export function sub(A: IVector, B: IVector) {
  return create(A[0] - B[0], A[1] - B[1])
}

/**
 * Get the vector from vectors A to B.
 * @param A
 * @param B
 */
export function vec(A: IVector, B: IVector) {
  // A, B as points get the vector from A to B
  return create(B[0] - A[0], B[1] - A[1])
}

/**
 * Vector multiplication by scalar
 * @param A
 * @param n
 */
export function mul(A: IVector, n: number) {
  // VECTOR MULTIPLICATION BY SCALAR
  return create(A[0] * n, A[1] * n)
}

/**
 * Vector division by scalar.
 * @param A
 * @param n
 */
export function div(A: IVector, n: number) {
  return create(A[0] / n, A[1] / n)
}

/**
 * Perpendicular rotation of a vector A
 * @param A
 */
export function per(A: IVector) {
  return create(A[1], -A[0])
}

/**
 * Dot product
 * @param A
 * @param B
 */
export function dpr(A: IVector, B: IVector) {
  return A[0] * B[0] + A[1] * B[1]
}

/**
 * Cross product (outer product) | A X B |
 * @param A
 * @param B
 */
export function cpr(A: IVector, B: IVector) {
  return A[0] * B[1] - B[0] * A[1]
}

/**
 * Length of the vector squared
 * @param A
 */
export function len2(A: IVector) {
  return A[0] * A[0] + A[1] * A[1]
}

/**
 * Length of the vector
 * @param A
 */
export function len(A: IVector) {
  return Math.sqrt(len2(A))
}

/**
 * Project A over B
 * @param A
 * @param B
 */
export function pry(A: IVector, B: IVector) {
  return dpr(A, B) / len(B)
}

/**
 * Get normalized / unit vector.
 * @param A
 */
export function uni(A: IVector) {
  return div(A, len(A))
}

/**
 * Get normalized / unit vector.
 * @param A
 */
export function normalize(A: IVector) {
  return uni(A)
}

/**
 * Get the tangent between two vectors.
 * @param A
 * @param B
 * @returns
 */
export function tangent(A: IVector, B: IVector) {
  return normalize(sub(A, B))
}

/**
 * Distance length from A to B squared.
 * @param A
 * @param B
 */
export function distance2(A: IVector, B: IVector) {
  var dif = sub(A, B)
  return dif[0] * dif[0] + dif[1] * dif[1]
}

/**
 * Distance length from A to B
 * @param A
 * @param B
 */
export function distance(A: IVector, B: IVector) {
  return Math.hypot(A[1] - B[1], A[0] - B[0])
}

/**
 * Angle between vector A and vector B in radians
 * @param A
 * @param B
 */
export function ang(A: IVector, B: IVector) {
  return Math.atan2(A[1] - B[1], A[0] - B[0])
}

/**
 * Mean between two vectors or mid point between two points
 * @param A
 * @param B
 */
export function med(A: IVector, B: IVector) {
  return mul(add(A, B), 0.5)
}

/**
 * Vector rotation by r (radians)
 * @param A
 * @param r rotation in radians
 */
export function rot(A: IVector, r: number) {
  return create(
    A[0] * Math.cos(r) - A[1] * Math.sin(r),
    A[1] * Math.cos(r) + A[0] * Math.sin(r)
  )
}

/**
 * Check of two vectors are identical.
 * @param A
 * @param B
 */
export function isEqual(A: IVector, B: IVector) {
  return A[0] === B[0] && A[1] === B[1]
}

/**
 * Interpolate vector A to B with a scalar t
 * @param A
 * @param B
 * @param t scalar
 */
export function lrp(A: IVector, B: IVector, t: number) {
  return add(A, mul(vec(A, B), t))
}

/**
 * Interpolate from A to B when curVAL goes fromVAL => to
 * @param A
 * @param B
 * @param from Starting value
 * @param to Ending value
 * @param s Strength
 */
export function int(A: IVector, B: IVector, from: number, to: number, s = 1) {
  var t = (Utils.clamp(from, to) - from) / (to - from)
  return add(mul(A, 1 - t), mul(B, s))
}

/**
 * Get the angle between the three vectors A, B, and C.
 * @param p1
 * @param pc
 * @param p2
 */
export function ang3(p1: IVector, pc: IVector, p2: IVector) {
  // this,
  var v1 = vec(pc, p1)
  var v2 = vec(pc, p2)
  return ang(v1, v2)
}

/**
 * Get whether p1 is left of p2, relative to pc.
 * @param p1
 * @param pc
 * @param p2
 */
export function isLeft(p1: IVector, pc: IVector, p2: IVector) {
  //  isLeft: >0 for counterclockwise
  //          =0 for none (degenerate)
  //          <0 for clockwise
  return (pc[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (pc[1] - p1[1])
}

export function clockwise(p1: IVector, pc: IVector, p2: IVector) {
  return isLeft(p1, pc, p2) > 0
}
