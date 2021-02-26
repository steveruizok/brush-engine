export interface IVector {
  x: number
  y: number
}

export interface IQuadBezier {
  p1: IVector
  pc: IVector
  p2: IVector
}

export interface IBoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Point extends IVector {
  p?: number
}

export interface BrushOptions {
  min: number
  max: number
  velocity: number
  // The resistance to pressure change (in simulated brushes)
  friction: number
  // The amount to average new points to old points
  streamline: number
  // The speed at which pressure may change
  speed: number
}

export type IPoint = {
  p: Point
  d: number
}
