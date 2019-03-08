import _ from 'lodash';
import { getRoot, types } from 'mobx-state-tree';

import { generateDatumModel, generateNewMoments } from './utils';

export const DataStore = types.model('DataStore', {});

/*
continuous --> normalized: value between 0-1, display: two decimal places
categorical --> one-hot label, display: = raw 
date --> raw: unix, display: dd-mm-yyyy or given ISO format
*/

const mapParams: MapTypeInfer = {
  categorical: { frequencies: {} },
  continuous: { min: null, max: null, sum: 0 },
  date: { min: null, max: null }
};

export function generateParamsArrayFromInferObject(
  inferObject: InferObject
): MomentsObject {
  return _.fromPairs(
    _.toPairs(inferObject).map(([variable, possibleType]) => {
      return [variable, mapParams[possibleType]];
    })
  );
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
  name: string,
  rawDataSet: GenericDatum[],
  inferTypes: InferObject
): unknown {
  const keysArray = getKeysArray(rawDataSet);
  const filledDataSet = populateNullData(rawDataSet, keysArray);
  const moments = calculateMoments(filledDataSet, inferTypes);
  const modelName = name || 'dataStore';

  const datumStore = types.model(
    'datumStore',
    generateDatumModel(keysArray, inferTypes, moments)
  );
  const genericDataset = types
    .model('dataSet', {
      data: types.array(datumStore)
    })
    .extend(self => {
      const getAllDataForVariable = keysArray.reduce(
        (views, variable) => ({
          ...views,
          get [variable](): Array<number | string> {
            return self.data.map(datum => datum[variable]);
          }
        }),
        {}
      );

      return {
        views: { ...getAllDataForVariable }
      };
    });

  return { modelName, genericDataset, moments };
}
