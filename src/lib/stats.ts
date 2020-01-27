import {
  InferObject,
  MomentsObject,
  StringKeyedObj
} from '../types/types';
import { GenericDatum } from './dataInference';
import { isNull } from 'lodash';

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
  Object.keys(datum).forEach((variable: keyof T) => {
      const columnAccumulator = accumulator[variable];
      const columnType = inferObject[variable]
      const value = datum[variable]

      if (columnType === 'categorical' && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
        const stringValue = value.toString();
        if(columnAccumulator.frequencies[stringValue]) {
          columnAccumulator.frequencies[stringValue] += 1
        } else {
          columnAccumulator.frequencies[stringValue] = 1
        }
        const newMoments = {
          frequencies: columnAccumulator.frequencies,
          max: null,
          min: null,
          sum: 0
        };
        accumulator[variable] = newMoments
      } else if (columnType === 'continuous' && typeof value === 'number') {
        const { min, max, sum } = columnAccumulator;

        const newMin = !isNull(min) ? Math.min(value, min) : value;
        const newMax = !isNull(max) ? Math.max(value, max) : value;
        const newSum = sum + value;
        const newMoments = {
          frequencies: {},
          max: newMax,
          min: newMin,
          sum: newSum
        };
        accumulator[variable] = newMoments
      } else if (columnType === 'date' && typeof value === 'number') {
        const { min, max } = columnAccumulator;

        const newMin = !isNull(min) ? Math.min(value, min) : value;
        const newMax = !isNull(max) ? Math.max(value, max) : value;
        const newMoments = {
          frequencies: {},
          max: newMax,
          min: newMin,
          sum: 0
        };
        accumulator[variable] = newMoments
      } else {
        accumulator[variable] = columnAccumulator
      }
    })

    return accumulator
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
