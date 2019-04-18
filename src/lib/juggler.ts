import { parseDatumFactory } from './parse';
import { GenericDatum, ParseObjectType } from './utils/dataInference';
import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
} from './utils/dataTypes';
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
export function dataJuggler(
  rawDataSet: GenericDatum[],
  inferTypes: InferObject,
  parserObject?: ParseObjectType
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
