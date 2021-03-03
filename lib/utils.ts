/**
 * Clamp a value into a range.
 * @param n
 * @param min
 */
export function clamp(n: number, min: number): number
export function clamp(n: number, min: number, max: number): number
export function clamp(n: number, min: number, max?: number): number {
  return Math.max(min, typeof max !== "undefined" ? Math.min(n, max) : n)
}

/**
 * Get a point between two points.
 * @param x0 The x-axis coordinate of the first point.
 * @param y0 The y-axis coordinate of the first point.
 * @param x1 The x-axis coordinate of the second point.
 * @param y1 The y-axis coordinate of the second point.
 * @param d Normalized
 */
export function getPointBetween(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  d = 0.5
) {
  return [x0 + (x1 - x0) * d, y0 + (y1 - y0) * d]
}

export function distanceBetweenPoints(a: number[], b: number[]) {
  return Math.hypot(a[1] - b[1], a[0] - b[0])
}
export function lerpPoints(a: number[], b: number[], t: number) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

/**
 * Linear interpolation betwen two numbers.
 * @param y1
 * @param y2
 * @param mu
 */
export function lerp(y1: number, y2: number, mu: number) {
  mu = clamp(mu, 0, 1)
  return y1 * (1 - mu) + y2 * mu
}

/**
 * Modulate a value between two ranges.
 * @param value
 * @param rangeA from [low, high]
 * @param rangeB to [low, high]
 * @param clamp
 */
export function modulate(
  value: number,
  rangeA: number[],
  rangeB: number[],
  clamp = false
) {
  const [fromLow, fromHigh] = rangeA
  const [v0, v1] = rangeB
  const result = v0 + ((value - fromLow) / (fromHigh - fromLow)) * (v1 - v0)

  return clamp
    ? v0 < v1
      ? Math.max(Math.min(result, v1), v0)
      : Math.max(Math.min(result, v0), v1)
    : result
}

/**
 * Move a point in an angle by a distance.
 * @param x0
 * @param y0
 * @param a angle (radians)
 * @param d distance
 */
export function projectPoint(x0: number, y0: number, a: number, d: number) {
  return [Math.cos(a) * d + x0, Math.sin(a) * d + y0]
}

function shortAngleDist(a0: number, a1: number) {
  var max = Math.PI * 2
  var da = (a1 - a0) % max
  return ((2 * da) % max) - da
}

export function lerpAngles(a0: number, a1: number, t: number) {
  return a0 + shortAngleDist(a0, a1) * t
}

export function angleDelta(a0: number, a1: number) {
  return shortAngleDist(a0, a1)
}

export function isLeft(A: number[], C: number[], B: number[]) {
  // >0 is counterclockwise, =0 is none (degenerate), <0 is clockwise
  return (C[0] - A[0]) * (B[1] - A[1]) - (B[0] - A[0]) * (C[1] - A[1])
}

export function clockwise(A: number[], C: number[], B: number[]) {
  return isLeft(A, C, B) > 0
}

/**
 * Simplify a line (using Ramer-Douglas-Peucker algorithm)
 * @param points An array of points as [x, y, ...][]
 * @param tolerance The minimum line distance (also called epsilon).
 * @returns Simplified array as [x, y, ...][]
 */
export function simplify(points: number[][], tolerance = 1) {
  const len = points.length,
    a = points[0],
    b = points[len - 1],
    [x1, y1] = a,
    [x2, y2] = b

  if (len > 2) {
    let distance = 0,
      index = 0,
      max = Math.hypot(y2 - y1, x2 - x1)

    for (let i = 1; i < len - 1; i++) {
      const [x0, y0] = points[i],
        d = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / max

      if (distance > d) continue

      distance = d
      index = i
    }

    if (distance > tolerance) {
      let l0 = simplify(points.slice(0, index + 1), tolerance)
      let l1 = simplify(points.slice(index + 1), tolerance)
      return l0.concat(l1.slice(1))
    }
  }

  return [a, b]
}

// Get unique values from an array of primitives

export function unique<T extends any>(arr: T[]) {
  return Array.from(new Set(arr).values())
}

export function uniqueAdjacent<T extends any>(arr: T[]) {
  return arr.filter((t, i) => i === 0 || !(t === arr[i - 1]))
}

// Get unique values from an array of objects (or anything)

export function uniqueObj<T extends any>(arr: T[]) {
  return Array.from(new Map(arr.map((p) => [JSON.stringify(p), p])).values())
}

export function uniqueAdjacentObj<T extends any>(arr: T[]) {
  return arr.filter(
    (t, i) => i === 0 || !(JSON.stringify(t) === JSON.stringify(arr[i - 1]))
  )
}

// Get unique values from an array of arrays

export function uniqueArr<T extends any[]>(arr: T[]) {
  return Array.from(new Map(arr.map((p) => [p.join(), p])).values())
}

export function uniqueAdjacentArr<T extends any[]>(arr: T[]) {
  return arr.filter(
    (t, i) => i === 0 || !t.every((v, j) => v === arr[i - 1][j])
  )
}

/**
 * Get a Bezier curve to fit the provided points.
 * Uses a Catmull-Rom spline (https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline)
 * @param points
 * @param k
 * @returns
 */
export function getSpline(pts: number[][], k = 1) {
  const path: number[][] = [pts[0]]

  let p0: number[],
    [p1, p2, p3] = pts

  for (let i = 1, len = pts.length; i < len - 1; i++) {
    p0 = p1
    p1 = p2
    p2 = p3
    p3 = pts[i + 2] ? pts[i + 2] : p2
    path.push([
      p1[0] + ((p2[0] - p0[0]) / 6) * k,
      p1[1] + ((p2[1] - p0[1]) / 6) * k,
      p2[0] - ((p3[0] - p1[0]) / 6) * k,
      p2[1] - ((p3[1] - p1[1]) / 6) * k,
      p2[0],
      p2[1],
    ])
  }

  return path
}

export function det(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  h: number,
  i: number
) {
  return a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g
}

// Get a circle from three points.
export function circleFromThreePoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  var a = det(x0, y0, 1, x1, y1, 1, x2, y2, 1)

  var bx = -det(
    x0 * x0 + y0 * y0,
    y0,
    1,
    x1 * x1 + y1 * y1,
    y1,
    1,
    x2 * x2 + y2 * y2,
    y2,
    1
  )
  var by = det(
    x0 * x0 + y0 * y0,
    x0,
    1,
    x1 * x1 + y1 * y1,
    x1,
    1,
    x2 * x2 + y2 * y2,
    x2,
    1
  )
  var c = -det(
    x0 * x0 + y0 * y0,
    x0,
    y0,
    x1 * x1 + y1 * y1,
    x1,
    y1,
    x2 * x2 + y2 * y2,
    x2,
    y2
  )
  return [
    -bx / (2 * a),
    -by / (2 * a),
    Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a)),
  ]
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
export function getOuterTangents(
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

/**
 * Rotate a point around a center.
 * @param x The x-axis coordinate of the point.
 * @param y The y-axis coordinate of the point.
 * @param cx The x-axis coordinate of the point to rotate round.
 * @param cy The y-axis coordinate of the point to rotate round.
 * @param angle The distance (in radians) to rotate.
 */
export function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  angle: number
) {
  const s = Math.sin(angle)
  const c = Math.cos(angle)

  const px = x - cx
  const py = y - cy

  const nx = px * c - py * s
  const ny = px * s + py * c

  return [nx + cx, ny + cy]
}
