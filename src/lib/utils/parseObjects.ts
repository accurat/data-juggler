import { InferObject, ValueOf } from "../../types/types";
import { GenericDatum } from "./dataInference";
import { getAllKeys } from "./stats";

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

// TODO: Optimize this ugly function
function equalSets<T>(setOne: Set<T>, setTwo: Set<T>): boolean {
  if (setOne.size !== setTwo.size) { return false }

  for (const one of setOne) {
    if (!setTwo.has(one)) { return false }
  }

  for (const two of setTwo) {
    if (!setOne.has(two)) { return false }
  }

  return true
}

export function doKeysMatch<T>(dataSet: Array<GenericDatum<T>>, inferObject: InferObject<T>): boolean {
  const incomingKeys = getAllKeys(dataSet)
  const expectedKeys = new Set([...Object.keys(inferObject)])
  return equalSets(incomingKeys, expectedKeys)
}

export function conditionalValueMap<K extends string, V, O>(
  obj: { [k in K]: V },
  paradigm: (k: K, v: V) => boolean,
  fn: (k: K, v: V) => [K, O]
  ): { [P in K]: V | O; } {
    const pairs: Array<[K, O]> | Array<[K, V]> = toPairs(obj)
    const newPairs = pairs.map<[K, O | V]>(([k, v]) => paradigm(k, v) ? fn(k, v) : [k, v])
    return fromPairs(newPairs)
}

