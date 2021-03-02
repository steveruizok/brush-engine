import { compress, decompress } from "lz-string"

const ID = "__engine_0"

export function save<T extends { [key: string]: any }>(data: T) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ID, compress(JSON.stringify(data)))
  }
}

export function load<T extends { [key: string]: any } = {}>(): Partial<T> {
  if (typeof localStorage !== "undefined") {
    const local = localStorage.getItem(ID)
    if (local !== null) {
      return JSON.parse(decompress(local)) as Partial<T>
    }
  }

  return {}
}
