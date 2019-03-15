import { _NotCustomized, types } from 'mobx-state-tree';

import { processDatumSnapshotFactory } from './utils';
import { GenericDatum, ParseObjectType } from './utils/dataInference';
import {
  CategoricalDatum,
  ContinuousDatum,
  DataProperty,
  DatetimeDatum,
  generateDatumModel
} from './utils/dataTypes';
import {
  calculateMoments,
  getKeysArray,
  populateNullData
} from './utils/stats';

interface GenericPropertyFactory {
  [variable: string]: Array<ContinuousDatum | CategoricalDatum | DatetimeDatum>;
}
interface DefaultPropertyFactory {
  data: DataProperty;
  stats: MomentsObject;
}

type GenericDataStore = GenericPropertyFactory & DefaultPropertyFactory;

// TODO: Better typing for this.
/**
 * The core function, it takes in a dataset, a type inference object and an (optional) formatter and returns a mobx-state-tree datastore
 *
 * @export
 * @param {string} name
 * @param {GenericDatum[]} rawDataSet
 * @param {InferObject} inferTypes
 * @param {ParseObjectType} [parserObject]
 * @returns {GenericDataStore}
 */
export function dataStoreFactory(
  name: string,
  rawDataSet: GenericDatum[],
  inferTypes: InferObject,
  parserObject?: ParseObjectType
): GenericDataStore {
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
