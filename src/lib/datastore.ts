import { types } from 'mobx-state-tree';
import { isCategorical, isContinous, isDatetime } from '../types/utils';

export const DataStore = types.model('DataStore', {});

/*
continuous --> normalized: value between 0-1, display: two decimal places
categorical --> one-hot label, display: = raw 
date --> raw: unix, display: dd-mm-yyyy or given ISO format
*/
// tslint:disable:no-if-statement
// Fuck you tslint, watch me us those fucking if statements.

const mapParams: MapTypeInfer = {
  categorical: { frequencies: {} },
  continuous: { min: 0, max: 0, sum: 0 },
  date: { min: 0, max: 0 }
};

export const generateNewMoments = (
  accumulator: MomentsObject,
  datum: GenericDatum
) => {
  const entries = Object.entries(datum);

  const newMoments: MomentsObject = entries.map(([key, value], index) => {
    const variableMoments = accumulator[index];

    if (isCategorical(variableMoments) && typeof value === 'string') {
      const { frequencies } = variableMoments;
      const newFrequencies = {
        ...frequencies,
        [key]: frequencies[key] ? frequencies[key] + 1 : 1
      };
      const newFrequencyMoments: NormalizingCategorical = {
        frequencies: newFrequencies
      };

      return newFrequencyMoments;
    } else if (isContinous(variableMoments) && typeof value === 'number') {
      const { min, max, sum } = variableMoments;
      const newContinousMoments: NormalizingContinuous = {
        max: value && value > max ? value : max,
        min: value && value < min ? value : min,
        sum: sum + value
      };

      return newContinousMoments;
    } else if (isDatetime(variableMoments) && typeof value === 'number') {
      const { min, max } = variableMoments;
      const newDatetimeMoments: NormalizingDatetime = {
        max: value && value > max ? value : max,
        min: value && value < min ? value : min
      };
      return newDatetimeMoments;
    } else {
      return variableMoments;
    }
  });
  return newMoments;
};

export function generateParamsArrayFromInferObject(
  inferObject: InferObject
): MomentsObject {
  return Object.values(inferObject).map(possibleType => {
    return mapParams[possibleType];
  });
}

export function getKeysArray(rawDataSet: GenericDatum[]): string[] {
  const keysSet = rawDataSet.reduce((accumulator: Set<string>, datum) => {
    const keys = Object.keys(datum);
    return new Set([...accumulator, ...keys]);
  }, new Set<string>());

  const keysArray = Array.from(keysSet);
  return keysArray;
}

export function populateNullData(
  rawDataSet: GenericDatum[],
  keysArray: string[]
): GenericDatum[] {
  const filledDataSet = rawDataSet.map(datum => {
    const filledDatum: GenericDatum = keysArray.reduce(
      (acc: GenericDatum, key) => {
        return { ...acc, [key]: datum.hasOwnProperty(key) ? datum[key] : null };
      },
      {}
    );
    return filledDatum;
  });
  return filledDataSet;
}

export function calculateMoments(
  rawDataSet: GenericDatum[],
  inferObject: InferObject
): MomentsObject {
  const inferedObject: MomentsObject = generateParamsArrayFromInferObject(
    inferObject
  );

  const momentsObject: MomentsObject = rawDataSet.reduce(
    generateNewMoments,
    inferedObject
  );

  return momentsObject;
}

export function dataStoreFactory(
  rawDataSet: GenericDatum[]
  // inferTypes: InferObject
  // name?: string
): unknown {
  const keysArray = getKeysArray(rawDataSet);
  const filledDataSet = populateNullData(rawDataSet, keysArray);

  return filledDataSet;
}
