export interface IBrush {
  color: string
  size: number
  opacity: number
  speed: number
  streamline: number
  variation: number
  spacing: number
  jitter: number
  sizeJitter: number
  alpha: number
}

export interface IMark {
  type: string
  points: number[][]
}
