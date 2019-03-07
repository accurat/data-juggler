import { types } from 'mobx-state-tree';

export const DataStore = types.model('DataStore', {});

/*
continuous --> normalized: value between 0-1, display: two decimal places
categorical --> one-hot label, display: = raw 
date --> raw: unix, display: dd-mm-yyyy or given ISO format
*/

const mapParams: MapTypeInfer = {
  categorical: { frequencies: [] },
  continuous: { min: 0, max: 0, mean: 0 },
  date: { min: 0, max: 0 }
};

export const generateNewMoments = (accumulator: MomentsObject) => (
  datum: GenericDatum
): unknown => {
  const values = Object.values(datum);

  const newAccumulator = values.map((value, index) => {
    const variableMoments = accumulator[index];
    const { min, max } = variableMoments;
  });
  return;
};

export function generateParamsArrayFromInferObject(
  inferObject: InferObject
): Array<NormalizingContinuous | NormalizingCategorical | NormalizingDatetime> {
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
    (accumulator: MomentsObject, datum) => {
      const entries = Object.entries(datum);

      const h = entries.map((key, value) => {});

      return { ...accumulator };
    },
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
