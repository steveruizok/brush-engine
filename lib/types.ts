export interface IBrush {
  type: string
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

export interface ISettings {
  rerenderMarks: boolean
  showControls: boolean
  simulatePressure: boolean
}
