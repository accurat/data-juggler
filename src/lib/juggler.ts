import { parseDates, parseDatumFactory } from './parse';
import {
  autoInferenceType,
  FormatterObject,
  GenericDatum,
  ParserObject
} from './dataInference';
import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
  InferObject,
  MomentsObject,
  StringKeyedObj
} from '../types/types';
import { scalesFromMoments, ScalingFnsRecords } from './generate-scaling';
import { doKeysMatch } from './parseObjects';
import { computeMoments, populateNullData } from './stats';

const MISMATCH_KEY =
  'It seems like the data keys and the types object you passed do not match!';

interface JuggleConfig<T extends StringKeyedObj> {
  types?: InferObject<T>;
  formatter?: FormatterObject<T>;
  parser?: ParserObject<T>;
}

export type JuggledData<D> = Array<
  { [V in keyof D]: ContinuousDatum | CategoricalDatum | DatetimeDatum }
>;

// TODO: Better typing for this.
/**
 * The core function, it takes in a dataset, a type inference object and an (optional) formatter and returns the juggled data
 * @param unparsedDataset
 * @param config
 */
export function dataJuggler<T extends StringKeyedObj>(
  unparsedDataset: Array<GenericDatum<T>>,
  config: JuggleConfig<T> = {}
): {
  data: JuggledData<T>;
  moments: MomentsObject<T>;
  types: InferObject<T>;
  scalers: ScalingFnsRecords<T>;
} {
  const { types = {}, formatter, parser = {} } = config;
  const filledDataset = populateNullData(unparsedDataset);

  const inferedTypes = autoInferenceType(
    unparsedDataset,
    types as InferObject<T>,
    parser
  );

  if (!doKeysMatch(unparsedDataset, inferedTypes)) {
    throw new Error(MISMATCH_KEY);
  }

  const dataset = parseDates(filledDataset, inferedTypes, parser);

  const moments = computeMoments(dataset, inferedTypes);

  const datumPreprocessor = parseDatumFactory(
    inferedTypes,
    moments,
    formatter,
    parser
  );
  const data = dataset.map(datum => datumPreprocessor(datum));

  const scalingFns = scalesFromMoments(moments);

  return { data, moments, types: inferedTypes, scalers: scalingFns };
}
