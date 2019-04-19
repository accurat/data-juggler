import { parseDatumFactory } from './parse';
import { GenericDatum, FormatterObject } from './utils/dataInference';

import {
  calculateMoments,
  getKeysArray,
  populateNullData
} from './utils/stats';


type JuggledData = Array<{
  [variable: string]: ContinuousDatum | CategoricalDatum | DatetimeDatum;
}>

// TODO: Better typing for this.
/**
 * The core function, it takes in a dataset, a type inference object and an (optional) formatter and returns the juggled data
 */
export function dataJuggler<T>(
  rawDataSet: GenericDatum[],
  inferTypes: InferObject<T>,
  parserObject?: FormatterObject
): JuggledData {

  const keysArray = getKeysArray(rawDataSet);
  const filledDataSet = populateNullData(rawDataSet, keysArray);
  const moments = calculateMoments(filledDataSet, inferTypes);

  const datumPreprocessor = parseDatumFactory(
    inferTypes,
    moments,
    parserObject
  );

  const instanceData = filledDataSet.map(datum => datumPreprocessor(datum));

  return instanceData;
}
