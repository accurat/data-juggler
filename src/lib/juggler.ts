import { parseDates, parseDatumFactory } from './parse';
import {
  autoInferenceType,
  FormatterObject,
  GenericDatum
} from './utils/dataInference';

import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
  InferObject,
  MomentsObject
} from '../types/types';
import { doKeysMatch } from './utils/parseObjects';
import { computeMoments, populateNullData } from './utils/stats';

const MISMATCH_KEY =
  'It seems like the data keys and the types object you passed do not match!';

interface JuggleConfig<T> {
  passedInferTypes?: InferObject<T>;
  formatter?: FormatterObject<T>;
}

export type JuggledData<D> = Array<
  { [V in keyof D]: ContinuousDatum | CategoricalDatum | DatetimeDatum }
>;

// TODO: Better typing for this.
/**
 * The core function, it takes in a dataset, a type inference object and an (optional) formatter and returns the juggled data
 */
export function dataJuggler<T>(
  unparsedDataset: Array<GenericDatum<T>>,
  { passedInferTypes, formatter }: JuggleConfig<T> = {}
): {
  data: JuggledData<T>;
  moments: MomentsObject<T>;
  inferedTypes: InferObject<T>;
} {
  const filledDataSet = populateNullData(unparsedDataset);

  const inferedTypes = passedInferTypes || autoInferenceType(unparsedDataset);

  if (!doKeysMatch(unparsedDataset, inferedTypes)) {
    throw new Error(MISMATCH_KEY);
  }

  const dataSet = passedInferTypes
    ? filledDataSet
    : parseDates(filledDataSet, inferedTypes);
  const moments = computeMoments(dataSet, inferedTypes);

  const datumPreprocessor = parseDatumFactory(inferedTypes, moments, formatter);

  const data = dataSet.map(datum => datumPreprocessor(datum));

  return { data, moments, inferedTypes };
}
