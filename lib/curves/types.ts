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

export type IPoint = {
  p: Point
  d: number
}
