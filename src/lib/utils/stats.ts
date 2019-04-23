import { isNull, max as _max, min as _min } from 'lodash';
import { InferObject, MapTypeInfer, MomentsObject, NormalizingCategorical, NormalizingContinuous, NormalizingDatetime } from '../../types/types';
import {
  GenericDatum,
  GenericDatumValue,
  isCategorical,
  isContinous,
  isDatetime
} from './dataInference';

import { fromPairs, toPairs } from './parseObjects'

const mapParams: MapTypeInfer = {
  categorical: { frequencies: {} },
  continuous: { min: 0, max: 0, sum: 0 },
  date: { min: 0, max: 0 }
};

const updateMin = (value: number, min: number | null) =>
  isNull(min) ? value : _min([value, min]) || min;
const updateMax = (value: number, max: number | null) =>
  isNull(max) ? value : _max([value, max]) || max;

const getKeys = <T>(obj: T) => Object.keys(obj) as Array<keyof T>

const setDifference = <A>(a: Set<A>, b: Set<A>) => [...a].filter(x => !b.has(x))

export function generateParamsArrayFromInferObject<T>(
  inferObject: InferObject<T>
): MomentsObject<T> {
  const variables = getKeys(inferObject)
  const moments = variables.reduce((acc, v) => ({...acc, [v]: mapParams[inferObject[v]]}), {}) as MomentsObject<T>

  return moments
}

export function getAllKeys<T>(rawDataSet: Array<GenericDatum<T>>): Set<(keyof T)> {
  return rawDataSet.reduce(
    (acc: Set<keyof T>, datum) => new Set([...acc, ...getKeys<GenericDatum<T>>(datum)]),
    new Set<keyof T>()
  )
}

export function populateNullData<T> (
  rawDataSet: Array<GenericDatum<T>>,
): Array<GenericDatum<T>> {
  const allKeys = getAllKeys(rawDataSet)

  return rawDataSet.map((datum): GenericDatum<T> => {
    const missingKeys = setDifference(allKeys, new Set([...getKeys(datum)]))
    const filledDatum = missingKeys.reduce((acc, key) =>({...acc, [key]: null}), {})
    return {...datum, ...filledDatum}
  })
}

export const generateNewMoments = <T>(
  accumulator: MomentsObject<T>,
  datum: GenericDatum<T>
) => {
  const newMomentsEntries: Array<[keyof T, NormalizingCategorical | NormalizingContinuous | NormalizingDatetime]> = toPairs(datum).map(([variable, value]:[keyof T, GenericDatumValue]) => {
    const variableMoments = accumulator[variable];

    if (isCategorical(variableMoments) && typeof value === 'string') {
      const { frequencies } = variableMoments;
      const newFrequencies = {
        ...frequencies,
        [value]: frequencies[value] ? frequencies[value] + 1 : 1
      };
      const newFrequencyMoments: NormalizingCategorical = {
        frequencies: newFrequencies
      };

      return [variable, newFrequencyMoments];
    } else if (isContinous(variableMoments) && typeof value === 'number') {
      const { min, max, sum } = variableMoments;

      const newMin = updateMin(value, min);
      const newMax = updateMax(value, max);
      const updatedSum = sum + value;

      const newContinousMoments: NormalizingContinuous = {
        max: newMax,
        min: newMin,
        sum: updatedSum
      };

      return [variable, newContinousMoments];
    } else if (isDatetime(variableMoments) && typeof value === 'number') {
      const { min, max } = variableMoments;
      const newMin = updateMin(value, min);
      const newMax = updateMax(value, max);

      const newDatetimeMoments: NormalizingDatetime = {
        max: newMax,
        min: newMin
      };
      return [variable, newDatetimeMoments];
    } else {
      return [variable, variableMoments];
    }
  })

  const newMoments: MomentsObject<T> = fromPairs(newMomentsEntries);

  return newMoments;
};

export function computeMoments<T>(
  rawDataSet: Array<GenericDatum<T>>,
  inferObject: InferObject<T>
): MomentsObject<T> {
  const inferedObject: MomentsObject<T> = generateParamsArrayFromInferObject(
    inferObject
  );

  const momentsObject: MomentsObject<T> = rawDataSet.reduce(
    generateNewMoments,
    inferedObject
  );

  return momentsObject;
}
