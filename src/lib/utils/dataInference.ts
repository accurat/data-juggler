import dayjs from 'dayjs';
import { entries, isNull, isNumber, keys } from 'lodash';
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
import CustomParseFormat from 'dayjs/plugin/CustomParseFormat' // load on demand
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

function detectValue(
  value: string | number | boolean | dayjs.Dayjs | Date | null
): DatumType | 'unknown' {
  if (isNull(value) || typeof value === 'boolean') {
    return 'unknown';
  }

  if (isNumber(value)) {
    return 'continuous';
  } else if (dayjs(value).isValid()) {
    return 'date';
  } else {
    return 'categorical';
  }
}

function detectArrayType<T>(
  column: Array<GenericDatum<T>[keyof T]>
): DatumType | 'unknown' {
  const columnProbs = column.reduce(
    (acc, value) => {
      const t = detectValue(value);
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

  const { maxK } = entries(columnProbs).reduce(
    (acc, [k, v]) => (v > acc.maxV ? { maxK: k, maxV: v } : acc),
    { maxK: 'categorical', maxV: 0 }
  );

  return maxK as DatumType | 'unknown';
}

export function autoInferenceType<T>(
  data: Array<GenericDatum<T>>,
  existingObj: InferObject<T> | {}
): InferObject<T> {
  const incomingKeys = [...getAllKeys(data)]

  const passedKeys = new Set(keys(existingObj))
  const keyType: Array<[keyof T, DatumType]> = incomingKeys
  .filter(k => !passedKeys.has(k))
  .map(key => {
      const variableData = data.map(d => d[key]);
      const detectedType = detectArrayType(variableData);
      return detectedType === 'unknown'
        ? [key, 'categorical']
        : [key, detectedType]
    });

  return { ...fromPairs(keyType), ...existingObj };
}
