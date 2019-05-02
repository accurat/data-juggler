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
  types?: InferObject<T>;
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
  { types, formatter }: JuggleConfig<T> = {}
): {
  data: JuggledData<T>;
  moments: MomentsObject<T>;
  types: InferObject<T>;
} {
  const filledDataSet = populateNullData(unparsedDataset);

  const inferedTypes = types || autoInferenceType(unparsedDataset);
  // TODO: Infer only keys not present in "types"

  if (!doKeysMatch(unparsedDataset, inferedTypes)) {
    throw new Error(MISMATCH_KEY);
  }

  const dataSet = types
    ? filledDataSet
    : parseDates(filledDataSet, inferedTypes);
  const moments = computeMoments(dataSet, inferedTypes);

  const datumPreprocessor = parseDatumFactory(inferedTypes, moments, formatter);

  const data = dataSet.map(datum => datumPreprocessor(datum));

  return { data, moments, types: inferedTypes };
}
