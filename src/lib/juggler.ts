import { parseDates, parseDatumFactory } from './parse';
import {
  autoInferenceType,
  FormatterObject,
  GenericDatum,
  ParserObject
} from './utils/dataInference';

import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
  InferObject,
  MomentsObject
} from '../types/types';
import { scalesFromMoments, ScalingFnsRecords } from './generate-scaling';
import { doKeysMatch } from './utils/parseObjects';
import { computeMoments, populateNullData } from './utils/stats';

const MISMATCH_KEY =
  'It seems like the data keys and the types object you passed do not match!';

interface JuggleConfig<T> {
  types?: InferObject<T>
  formatter?: FormatterObject<T>
  parser?: ParserObject<T>
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
  config: JuggleConfig<T> = {}
): {
  data: JuggledData<T>;
  moments: MomentsObject<T>;
  types: InferObject<T>;
  scalers: ScalingFnsRecords<T>
} {
  const { types = {}, formatter, parser = {}} = config;
  const filledDataSet = populateNullData(unparsedDataset);

  const inferedTypes = autoInferenceType(
    unparsedDataset,
    types as InferObject<T>,
    parser
  );

  if (!doKeysMatch(unparsedDataset, inferedTypes)) {
    throw new Error(MISMATCH_KEY);
  }

  const dataSet = parseDates(filledDataSet, inferedTypes, parser);

  const moments = computeMoments(dataSet, inferedTypes);

  const datumPreprocessor = parseDatumFactory(inferedTypes, moments, formatter, parser);

  const data = dataSet.map(datum => datumPreprocessor(datum));

  const scalingFns = scalesFromMoments(moments)

  return { data, moments, types: inferedTypes, scalers: scalingFns };
}
