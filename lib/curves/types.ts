export type IVector = number[]

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

export type IPoint = {
  p: IVector
  d: number
}
