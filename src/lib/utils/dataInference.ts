import dayjs from 'dayjs';
import { get, isFinite, isNaN, isNull, keys } from 'lodash';
import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
  DatumType,
  InferObject,
  MomentsType,
  NormalizingCategorical,
  NormalizingContinuous,
  NormalizingDatetime,
  StringKeyedObj
} from '../../types/types';
import { fromPairs } from './parseObjects';
import { getAllKeys } from './stats';

// tslint:disable-next-line:no-submodule-imports
import CustomParseFormat from 'dayjs/plugin/customParseFormat' // load on demand
// tslint:disable-next-line:no-expression-statement
dayjs.extend(CustomParseFormat) // use plugin

/** @hidden */
function hasMultipleProperties(
  obj: { [key: string]: unknown },
  properties: string[]
): boolean {
  return properties.every(p => obj.hasOwnProperty(p));
}

export const isContinuous = (
  moment: MomentsType
): moment is NormalizingContinuous =>
  hasMultipleProperties(moment, ['min', 'max', 'sum']);

export const isDatetime = (
  moment: MomentsType
): moment is NormalizingDatetime =>
  hasMultipleProperties(moment, ['min', 'max']) &&
  !moment.hasOwnProperty('sum');

export const isCategorical = (
  moment: MomentsType
): moment is NormalizingCategorical =>
  hasMultipleProperties(moment, ['frequencies']);

export type GenericDatumValue = number | string | boolean | null;

export type GenericDatum<T extends StringKeyedObj> = {
  [key in keyof T]: GenericDatumValue
};

export function valiDate(dateObj: dayjs.Dayjs | unknown): boolean {
  return dayjs.isDayjs(dateObj) ? dateObj.isValid() : false;
}

export type GenericFormattingFunction = (
  datum: CategoricalDatum | ContinuousDatum | DatetimeDatum,
  stats?: {
    min?: number;
    max?: number;
    frequencies?: { [cat: string]: number };
    sum?: number;
  },
  row?: {
    [variable: string]: CategoricalDatum | ContinuousDatum | DatetimeDatum;
  }
) => string;

export type FormatterObject<T extends StringKeyedObj> = {
  [variable in keyof T]?: Array<{
    name: string;
    formatter: GenericFormattingFunction;
  }>
};

export type ParserFunction = (raw: any) => any

export type ParserObject<T extends StringKeyedObj> = {
  [variable in keyof T]?: ParserFunction
};

function inferIfStringIsNumber (value: unknown): boolean {
  return typeof value === 'string' ? !isNaN(Number(value)) : false
}

function inferIsNumber(value: unknown): boolean {
  return isFinite(value) || inferIfStringIsNumber(value)
}

export function detectValue(
  value: string | number | boolean | dayjs.Dayjs | Date | null,
  p: ParserFunction
): DatumType | 'unknown' {

  if (!value || isNull(value) || typeof value === 'boolean') {
    return 'unknown';
  }

  if (inferIsNumber(value)) {
    return 'continuous';
  } else if (dayjs(p(value) * 1000).isValid() || dayjs(value).isValid()) {
    return 'date';
  } else {
    return 'categorical';
  }
}

interface Frequencies {
  categorical: number
  continuous: number
  date: number
  unknown: number
}

export function selectTypeFromFrequencies(fr: Frequencies): DatumType {
  // To be date, no unknown can be present, to be continuous the same condition does not apply
  switch (true) {
    case fr.unknown === 0 && fr.categorical === 0 && fr.continuous === 0 && fr.date > 0:
      return 'date'
    case fr.categorical === 0 && fr.date === 0 && fr.continuous > 0:
      return 'continuous'
    default:
      return 'categorical'
  }
}

export function detectArrayType<T>(
  column: Array<GenericDatum<T>[keyof T]>,
  p: ParserFunction
): DatumType {
  const columnProbs = column.reduce<Frequencies>(
    (acc, value) => {
      const t = detectValue(value, p);

      return {
        ...acc,
        ...(t === 'unknown' && { unknown: acc.unknown + 1 }),
        ...(t === 'categorical' && { categorical: acc.categorical + 1 }),
        ...(t === 'continuous' && { continuous: acc.continuous + 1 }),
        ...(t === 'date' && { date: acc.date + 1 })
      };
    },
    {
      categorical: 0,
      continuous: 0,
      date: 0,
      unknown: 0
    }
  );

  return selectTypeFromFrequencies(columnProbs)
}

export function autoInferenceType<T>(
  data: Array<GenericDatum<T>>,
  existingObj: InferObject<T> | {} = {},
  parser: ParserObject<T> = {}
): InferObject<T> {
  const incomingKeys = [...getAllKeys(data)]
  const passedKeys = new Set(keys(existingObj))
  const keyType: Array<[keyof T, DatumType]> = incomingKeys
  .filter(k => !passedKeys.has(k))
  .map(key => {
      const p = get(parser, key, (v: unknown) => v)
      const variableData = data.map(d => d[key]);
      return [key, detectArrayType(variableData, p)];
    });
  return { ...fromPairs(keyType), ...existingObj };
}
