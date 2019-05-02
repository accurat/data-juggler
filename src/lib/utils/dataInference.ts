import dayjs from 'dayjs';
import { entries } from 'lodash'
import { isNull, isNumber } from 'util';
import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
  InferType,
  MomentsType,
  NormalizingCategorical,
  NormalizingContinuous,
  NormalizingDatetime,
  StringKeyedObj
} from '../../types/types';
import { fromPairs } from './parseObjects';
import { getAllKeys } from './stats';

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

export type GenericDatumValue = number | string | boolean | null

export type GenericDatum<T extends StringKeyedObj> = {
  [key in keyof T]: GenericDatumValue
}

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
) => string

export type FormatterObject<T extends StringKeyedObj> = {
  [variable in keyof T]?: Array<{
    name: string;
    formatter: GenericFormattingFunction;
  }>;
}

function detectValue(value: string | number | boolean | dayjs.Dayjs | Date | null): InferType | 'unknown' {
  if (isNull(value) || typeof value === 'boolean') { return 'unknown' }

  if (isNumber(value)) {
    return 'continuous'
  } else if (dayjs(value).isValid()) {
    return 'date'
  } else {
    return 'categorical'
  }
}

function detectArrayType<T>(column: Array<GenericDatum<T>[keyof T]>): InferType | 'unknown' {
  const columnProbs = column.reduce((acc, value) => {
    const t = detectValue(value)
    return {
      ...acc,
      ...(t === 'unknown' && {unknown: acc.unknown + 1}),
      ...(t === 'categorical' && {categorical: acc.categorical + 1}),
      ...(t === 'continuous' && {continuous: acc.continuous + 1}),
      ...(t === 'date' && {date: acc.date + 1}),
    }
  },
    {
      categorical: 0,
      continuous: 0,
      date: 0,
      unknown: 0
    })

  const { maxK } = entries(columnProbs)
    .reduce((acc, [k, v]) =>
      v > acc.maxV ? { maxK: k, maxV: v } : acc,
      { maxK: 'categorical', maxV: 0 });

  return maxK as InferType | 'unknown'
}

export function autoInferenceType<T>(data: Array<GenericDatum<T>>)
: { [P in keyof T]: "continuous" | "categorical" | "date" } {
  const incomingKeys = [...getAllKeys(data)]
  const keyType: Array<[keyof T, InferType]> = incomingKeys.map(key => {
    const variableData = data.map(d => d[key])
    const detectedType = detectArrayType(variableData)
    return detectedType === 'unknown' ? [key, 'categorical'] : [key, detectedType]
  })

  return fromPairs(keyType)
}