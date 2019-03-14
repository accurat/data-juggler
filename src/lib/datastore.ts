import { fromPairs, toPairs } from 'lodash';
import { _NotCustomized, types } from 'mobx-state-tree';

import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
  generateDatumModel,
  generateNewMoments,
  ParseObjectType,
  processDatumSnapshotFactory
} from './utils';

export type DataProperty = Array<{
  [variable: string]: ContinuousDatum | CategoricalDatum | DatetimeDatum;
}>;

const mapParams: MapTypeInfer = {
  categorical: { frequencies: {} },
  continuous: { min: null, max: null, sum: 0 },
  date: { min: null, max: null }
};

export function generateParamsArrayFromInferObject(
  inferObject: InferObject
): MomentsObject {
  return fromPairs(
    toPairs(inferObject).map(([variable, possibleType]) => {
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

interface ReturnDataStoreFactory1 {
  [variable: string]: Array<ContinuousDatum | CategoricalDatum | DatetimeDatum>;
}
interface ReturnDataStoreFactory2 {
  data: DataProperty;
  stats: MomentsObject;
}

type ReturnDataStoreFactory = ReturnDataStoreFactory1 & ReturnDataStoreFactory2;

export function dataStoreFactory(
  name: string,
  rawDataSet: GenericDatum[],
  inferTypes: InferObject,
  parserObject?: ParseObjectType
): ReturnDataStoreFactory {
  // TODO: Better typing for this.
  const keysArray = getKeysArray(rawDataSet);
  const filledDataSet = populateNullData(rawDataSet, keysArray);
  const moments = calculateMoments(filledDataSet, inferTypes);
  const modelName = name || 'dataStore';

  const datumPreprocessor = processDatumSnapshotFactory(
    inferTypes,
    moments,
    parserObject
  );

  const datumStore = types
    .model('datumStore', generateDatumModel(keysArray))
    .preProcessSnapshot(datumPreprocessor);

  const instanceData = filledDataSet.map(datum => datumStore.create(datum));

  const genericDataset = types
    .model(modelName, {
      data: types.array(datumStore),
      stats: types.frozen()
    })
    .extend(self => {
      const viewsVariableGetters = keysArray.reduce((acc, variable) => {
        const newViews = {
          ...acc,
          [variable]: {
            configurable: true,
            enumerable: true,
            get: () => self.data.map(datum => datum[variable])
          }
        };
        return newViews;
      }, {});
      const views = Object.create(Object.prototype, viewsVariableGetters);

      return {
        views
      };
    });

  const dataSetInstance = genericDataset.create({
    data: instanceData,
    stats: moments
  });
  return dataSetInstance;
}
