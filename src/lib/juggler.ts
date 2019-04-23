import { parseDatumFactory } from './parse';
import { FormatterObject, GenericDatum } from './utils/dataInference';

import { CategoricalDatum, ContinuousDatum, DatetimeDatum, InferObject } from '../types/types';
import {
  computeMoments,
  populateNullData
} from './utils/stats';


type JuggledData<D> = Array<{
  [V in keyof D]: ContinuousDatum | CategoricalDatum | DatetimeDatum;
}>

// TODO: Better typing for this.
/**
 * The core function, it takes in a dataset, a type inference object and an (optional) formatter and returns the juggled data
 */
export function dataJuggler<T>(
  rawDataSet: Array<GenericDatum<T>>,
  inferTypes: InferObject<T>,
  parserObject?: FormatterObject<T>
): JuggledData<T> {

  const filledDataSet = populateNullData(rawDataSet);
  const moments = computeMoments(filledDataSet, inferTypes);

  const datumPreprocessor = parseDatumFactory(
    inferTypes,
    moments,
    parserObject
  );

  const instanceData = filledDataSet.map(datum => datumPreprocessor(datum));

  return instanceData;
}
