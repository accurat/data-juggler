import { InferObject, ValueOf, StringKeyedObj } from '../../types/types';
import { GenericDatum } from './dataInference';
import { getAllKeys } from './stats';

// tslint:disable:no-expression-statement
// tslint:disable:no-object-mutation
// tslint:disable:no-object-literal-type-assertion

export function fromPairs<K extends string, V>(
  pairs: Array<[K, V]>
): Record<K, V> {
  const newObj = {} as { [P in K]: V };
  pairs.forEach(([key, value]) => {
    newObj[key] = value;
  });

  return newObj;
}

export function toPairs<O>(obj: O): Array<[keyof O, ValueOf<O>]> {
  return Object.entries(obj) as Array<[keyof O, ValueOf<O>]>;
}

// TODO: Optimize this ugly function
function equalSets<T>(setOne: Set<T>, setTwo: Set<T>): boolean {
  if (setOne.size !== setTwo.size) {
    return false;
  }

  for (const one of setOne) {
    if (!setTwo.has(one)) {
      return false;
    }
  }

  for (const two of setTwo) {
    if (!setOne.has(two)) {
      return false;
    }
  }

  return true;
}

export function doKeysMatch<T extends StringKeyedObj>(
  dataSet: Array<GenericDatum<T>>,
  inferObject: InferObject<T>
): boolean {
  const incomingKeys = getAllKeys(dataSet);
  const expectedKeys = new Set([...Object.keys(inferObject)]);
  return equalSets(incomingKeys, expectedKeys);
}

function mapWithIndex<K extends string, A, B>(
  r: Record<K, A>,
  fn: (k: K, a: A) => B
): Record<K, B> {
  const parsedPairs: Array<[K, B]> = toPairs(r).map(([k, v]) => [k, fn(k, v)]);
  return fromPairs(parsedPairs);
}

export function conditionalValueMap<K extends string, S extends I, I, O>(
  r: Record<K, I>,
  paradigm: (k: K, a: I) => a is S,
  fn: (k: K, f: S) => O
): Record<K, I | O> {
  return mapWithIndex(r, (k, a) => (paradigm(k, a) ? fn(k, a) : a));
}
