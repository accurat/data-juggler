import dayjs from 'dayjs';
import { CategoricalDatum, ContinuousDatum, DatetimeDatum, MomentsType, NormalizingCategorical, NormalizingContinuous, NormalizingDatetime, StringKeyedObj } from '../../types/types';

/** @hidden */
function hasMultipleProperties(
  obj: { [key: string]: unknown },
  properties: string[]
): boolean {
  return properties.every(p => obj.hasOwnProperty(p));
}

export const isContinous = (
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
  [variable in keyof T]: Array<{
    name: string;
    formatter: GenericFormattingFunction;
  }>;
}
