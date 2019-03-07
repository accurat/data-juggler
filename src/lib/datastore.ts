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

export function generateParamsArrayFromInferArray(
  inferArray: InferType[]
): Array<NormalizingContinuous | NormalizingCategorical | NormalizingDatetime> {
  return inferArray.map(possibleType => {
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

export function populateNullData(rawDataSet: GenericDatum[]): GenericDatum[] {
  const keysArray = getKeysArray(rawDataSet);

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

export function dataStoreFactory(
  rawDataSet: GenericDataSet,
  inferTypes: InferObject,
  name?: string
): unknown {
  // This is done temporaraly in order to avoid tslint errors
  /* tslint:disable */
  console.log(rawDataSet, inferTypes, name);
  /* tslint:enable */

  const keysSet = rawDataSet.reduce((accumulator: Set<string>, datum) => {
    const keys = Object.keys(datum);
    return new Set([...accumulator, ...keys]);
  }, new Set<string>());

  const keysArray = Array.from(keysSet);

  const filledDataSet = rawDataSet.map(datum => {
    const filledDatum: GenericDatum = keysArray.reduce(
      (acc: GenericDatum, key) => {
        return { ...acc, [key]: datum.hasOwnProperty(key) ? datum.key : null };
      },
      {}
    );
    return filledDatum;
  });

  // const normalizingParameters: ReadonlyArray<
  //   NormalizingContinuous | NormalizingCategorical | NormalizingDatetime
  // > = null;
  // // filledDataSet.reduce((accumulator, datum) => {

  // // },
  // // generateParamsArrayFromInferArray(inferTypes));

  // const frozenArray = filledDataSet.map(filledDatum => {
  //   return types.frozen<GenericDatum>(filledDatum);
  // });

  return filledDataSet;
}
