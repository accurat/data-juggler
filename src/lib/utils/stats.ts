import {
  InferObject,
  MomentsObject,
  MomentsType,
  StringKeyedObj
} from '../../types/types';
import { GenericDatum, GenericDatumValue } from './dataInference';

import { isNull } from 'lodash';
import { fromPairs, toPairs } from './parseObjects';

const updateMin = (value: number, min: number) => Math.min(value, min);
const updateMax = (value: number, max: number) => Math.max(value, max);

const getKeys = <T>(obj: T) => Object.keys(obj) as Array<keyof T>;

const setDifference = <A>(a: Set<A>, b: Set<A>) =>
  [...a].filter(x => !b.has(x));

export function generateDefaultMoments<T extends StringKeyedObj>(
  inferObject: InferObject<T>
): MomentsObject<T> {
  const variables = getKeys(inferObject);
  const moments = variables.reduce(
    (acc, v) => ({
      ...acc,
      [v]: {
        frequencies: {},
        max: null,
        min: null,
        sum: 0
      }
    }),
    {}
  ) as MomentsObject<T>;

  return moments;
}

export function getAllKeys<T extends StringKeyedObj>(
  rawDataSet: Array<GenericDatum<T>>
): Set<keyof T> {
  return rawDataSet.reduce(
    (acc: Set<keyof T>, datum) =>
      new Set([...acc, ...getKeys<GenericDatum<T>>(datum)]),
    new Set<keyof T>()
  );
}

export function populateNullData<T extends StringKeyedObj>(
  rawDataSet: Array<GenericDatum<T>>
): Array<GenericDatum<T>> {
  const allKeys = getAllKeys(rawDataSet);

  return rawDataSet.map(
    (datum): GenericDatum<T> => {
      const missingKeys = setDifference(allKeys, new Set([...getKeys(datum)]));
      const filledDatum = missingKeys.reduce(
        (acc, key) => ({ ...acc, [key]: null }),
        {}
      );
      return { ...datum, ...filledDatum };
    }
  );
}

export const generateNewMoments = <T extends StringKeyedObj>(
  accumulator: MomentsObject<T>,
  datum: GenericDatum<T>,
  inferObject: InferObject<T>
) => {
  return fromPairs(
    toPairs(datum).map(([variable, value]: [keyof T, GenericDatumValue]) => {
      const variableMoments = accumulator[variable];

      if (
        inferObject[variable] === 'categorical' &&
        typeof value === 'string'
      ) {
        const { frequencies } = variableMoments;
        const newFrequencies = {
          ...frequencies,
          [value]: frequencies[value] ? frequencies[value] + 1 : 1
        };
        const newFrequencyMoments = {
          frequencies: newFrequencies,
          max: null,
          min: null,
          sum: 0
        };

        return [variable, newFrequencyMoments] as [keyof T, MomentsType];
      } else if (
        inferObject[variable] === 'continuous' &&
        typeof value === 'number'
      ) {
        const { min, max, sum } = variableMoments;

        const newMin = !isNull(min) ? updateMin(value, min) : value;
        const newMax = !isNull(max) ? updateMax(value, max) : value;
        const updatedSum = sum + value;
        const newContinousMoments = {
          frequencies: {},
          max: newMax,
          min: newMin,
          sum: updatedSum
        };

        return [variable, newContinousMoments] as [keyof T, MomentsType];
      } else if (
        inferObject[variable] === 'date' &&
        typeof value === 'number'
      ) {
        const { min, max } = variableMoments;
        const newMin = !isNull(min) ? updateMin(value, min) : value;
        const newMax = !isNull(max) ? updateMax(value, max) : value;

        const newDatetimeMoments = {
          frequencies: {},
          max: newMax,
          min: newMin,
          sum: 0
        };
        return [variable, newDatetimeMoments] as [keyof T, MomentsType];
      } else {
        return [variable, variableMoments] as [
          keyof T,
          MomentsObject<T>[keyof T]
        ];
      }
    })
  );
};

export function computeMoments<T extends StringKeyedObj>(
  rawDataSet: Array<GenericDatum<T>>,
  inferObject: InferObject<T>
): MomentsObject<T> {
  const inferedObject: MomentsObject<T> = generateDefaultMoments(inferObject);
  const momentsObject: MomentsObject<T> = rawDataSet.reduce(
    (acc, datum) => generateNewMoments(acc, datum, inferObject),
    inferedObject
  );

  return momentsObject;
}
