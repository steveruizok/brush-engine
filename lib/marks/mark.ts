import { lerp, clamp, getSpline, lerpPoints } from "../utils"
import { IBrush, ISettings } from "../types"

// A factory function, creates a mark and returns functions for
// adding points / completing the mark.
export function createMark(brush: IBrush, options = {} as ISettings) {
  const { simulatePressure = true } = options

  let {
    size,
    streamline,
    variation,
    jitter,
    sizeJitter,
    speed,
    type,
    spacing,
  } = brush

  // const ptsReceived: number[][] = []
  const ptsToDraw: number[][] = []

  let prev: number[]
  let error = 0

  // Add a point to the mark
  function addPoint(curr: number[], last = false) {
    let newPts: number[][] = []

    let [x, y, p] = curr

    const maxSize = size
    const minSize = maxSize * (1 - variation)

    if (!prev) {
      error = 0
      prev = [...curr]
      newPts.push([x, y, lerp(minSize, maxSize, p)])
    } else {
      // Unless we're at the last point, move point
      // the point toward the previous point (streamline)
      if (!last) {
        x = prev[0] + (x - prev[0]) * (1 - streamline)
        y = prev[1] + (y - prev[1]) * (1 - streamline)
      }

      // Get distance between current and previous point
      const dist = Math.hypot(x - prev[0], y - prev[1])

      if (!last && dist < 4) return []

      // Use distance to determine pressure if not provided
      if (type !== "pen") {
        p = 1 - Math.min(1, dist / size)
      }

      if (p > prev[2]) {
        p = clamp(lerp(prev[2], p, speed * speed), 0, 1)
      } else {
        p = clamp(lerp(prev[2], p, speed), 0, 1)
      }

      // Add the last point at the current position
      if (last) {
        ptsToDraw.push([x, y, lerp(minSize, maxSize, p)])
      } else {
        // Add interpolated points between prev and curr
        // let trav = error

        // while (trav <= dist) {
        //   let [tx, ty, tp] = lerpPoints(prev, [x, y, p], trav / dist)
        //   let ts = simulatePressure ? lerp(minSize, maxSize, tp) : size

        //   trav += ts * spacing

        //   const jx = lerp(
        //     -jitter * (size / 2),
        //     jitter * (size / 2),
        //     Math.random()
        //   )
        //   const jy = lerp(
        //     -jitter * (size / 2),
        //     jitter * (size / 2),
        //     Math.random()
        //   )
        //   const js = lerp(
        //     -sizeJitter * (size / 2),
        //     sizeJitter * (size / 2),
        //     Math.random()
        //   )

        //   newPts.push([tx + jx, ty + jy, ts + js])
        // }

        // error = trav - dist

        prev = [x, y, p]

        newPts.push([x, y, lerp(minSize, maxSize, p)])
      }
    }

    ptsToDraw.push(...newPts)

    return newPts
  }

  return { addPoint, points: ptsToDraw }
}

// Get a full mark.
export function getMark(
  points: number[][],
  brush: IBrush,
  options = {} as ISettings
) {
  const mark = createMark(brush, options)

  for (let i = 0, len = points.length; i < len; i++) {
    mark.addPoint(points[i], i === len - 1)
  }

  return mark.points
}

export type CreateMark = typeof createMark
export type GetMark = typeof getMark
