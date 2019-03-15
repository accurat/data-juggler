import dayjs, { Dayjs } from 'dayjs';
import { CategoricalDatum, ContinuousDatum, DatetimeDatum } from './dataTypes';

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
export interface GenericDatum {
  readonly [key: string]: number | string | boolean | null | Dayjs;
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
) => number | string | dayjs.Dayjs | null;

export interface ParseObjectType {
  [variable: string]: Array<{
    name: string;
    formatter: GenericFormattingFunction;
  }>;
}
