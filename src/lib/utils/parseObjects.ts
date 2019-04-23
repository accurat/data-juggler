import { ValueOf } from "../../types/types";

// tslint:disable:no-expression-statement
// tslint:disable:no-object-mutation
// tslint:disable:no-object-literal-type-assertion

export function fromPairs<K extends string, V>(pairs: Array<[K, V]>): {[P in K]: V} {
  const newObj = {} as {[P in K]: V}
  pairs.forEach(([key, value]) => { newObj[key] = value })

  return newObj
}

export function toPairs<O>(obj: O): Array<[keyof O, ValueOf<O>]>  {
  return Object.entries(obj) as Array<[keyof O, ValueOf<O>]>
}