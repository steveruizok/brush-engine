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
  const [toLow, toHigh] = rangeB
  const result =
    toLow + ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow)
  if (clamp === true) {
    if (toLow < toHigh) {
      if (result < toLow) {
        return toLow
      }
      if (result > toHigh) {
        return toHigh
      }
    } else {
      if (result > toLow) {
        return toLow
      }
      if (result < toHigh) {
        return toHigh
      }
    }
  }
  return result
}

import { IVector } from "./types"

/**
 * Global isNum -> Double check is number
 * @param n
 */
export const IsNum = (n: number | any) => {
  return !!(
    Number(typeof n).toString() === "NaN" && Number(n + "").toString() === "NaN"
  )
}

/**
 * Round a number to pecision.
 * @param num
 * @param precision
 */
export function preciseRound(num: number, precision: number) {
  return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision)
}

/**
 * Get the squared distance between two points.
 * @param A
 * @param B
 */
export function distance2(A: IVector, B: IVector) {
  var dX = B.x - A.x
  var dY = B.y - A.y
  return dX * dX + dY * dY
}

/**
 * Get the distance between two points.
 * @param A
 * @param B
 */
export function distance(A: IVector, B: IVector) {
  return Math.sqrt(distance2(A, B))
}

/**
 * Linear interpolation betwen two numbers.
 * @param y1
 * @param y2
 * @param mu
 */
export function cosineInterpolate(y1: number, y2: number, mu: number) {
  let mu2 = (1 - Math.cos(mu * Math.PI)) / 2
  return y1 * (1 - mu2) + y2 * mu2
}

/**
 * Radians to degrees.
 * @param r
 */
export function toDegrees(r: number) {
  return (r * 180) / Math.PI
}

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
 * Get a random number between a num and max
 * @param min
 * @param max
 */
export function random(min?: number, max?: number) {
  if (min !== undefined && max !== undefined) {
    return Math.random() * (max - min) + min
  }

  if (min !== undefined) {
    return Math.random() * min
  }

  return Math.random()
}

/**
 * Get a random integer.
 */
export function randomInt(max: number): number
export function randomInt(min: number, max: number): number
export function randomInt(a: number, b?: number): number {
  let min: number, max: number
  if (a !== undefined && b !== undefined) {
    min = Math.ceil(a)
    max = Math.floor(b)
  } else {
    max = Math.floor(a)
    min = 0
  }

  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Array

/**
 * Get the minimum value of an array of numbers.
 * */
export function min(arr: number[]) {
  return arr.reduce((m, p) => (p < m ? p : m), arr[0])
}

/**
 * Get the maximum value in an array of numbers.
 */
export function max(arr: number[]) {
  return arr.reduce((m, p) => (p > m ? p : m), arr[0])
}

/**
 * Get the value at the specified index. (Supports negative values)
 * @param arr
 * @param n
 */
export function at<T>(arr: T[], n: number) {
  return n >= 0 ? arr[n] : arr[arr.length - 1 + n]
}

/**
 * Get the last value in an array.
 */
export function last<T>(arr: T[]) {
  return arr[arr.length - 1]
}

/**
 * Get the second to last value in an array.
 * @param arr
 */
export function prior<T>(arr: T[]) {
  return at(arr, -1)
}

/**
 * Get the first value in an array.
 * */
export function first<T>(arr: T[]) {
  return arr[0]
}

/**
 * Convert a hue to an RGB value.
 * @param p
 * @param q
 * @param t
 */
function hue2rgb(p: number, q: number, t: number) {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

/**
 * Convert an HSL color value to an RGB value.
 * @param h
 * @param s
 * @param l
 */
export function hslToRgb(h: number, s: number, l: number) {
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s
    var p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [r * 255, g * 255, b * 255]
}

/**
 * Get the document offset (top) for an element.
 * @param elm
 */
export function getDocumentOffsetTop(elm: HTMLElement): number {
  return (
    elm.offsetTop +
    (elm.offsetParent
      ? getDocumentOffsetTop(elm.offsetParent as HTMLElement)
      : 0)
  )
}

/**
 * Get the document offset (left) for an element.
 * @param elm
 */
export function getDocumentOffsetLeft(elm: HTMLElement): number {
  return (
    elm.offsetLeft +
    (elm.offsetParent
      ? getDocumentOffsetLeft(elm.offsetParent as HTMLElement)
      : 0)
  )
}
