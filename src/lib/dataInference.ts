import dayjs from 'dayjs';
import { get, isFinite, isNaN, isNull, isUndefined, keys, isDate, isString } from 'lodash';
import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
  DatumType,
  InferObject,
  StringKeyedObj
} from '../types/types';
import { fromPairs } from './parseObjects';
import { getAllKeys } from './stats';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

// references:
// https://day.js.org/docs/en/parse/string-format
// https://day.js.org/docs/en/display/format
export const DATE_FORMATS = [
  'YYYY-MM-DD',
  'YYYY-MM-D',
  'YYYY-M-DD',
  'YYYY-M-D',

  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DD HH:mm[Z]',
  'YYYY-MM-DD[T]HH:mm',
  'YYYY-MM-DD[T]HH:mm[Z]',
  
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm:ss[Z]',
  'YYYY-MM-DD[T]HH:mm:ss',
  'YYYY-MM-DD[T]HH:mm:ss[Z]',

  'YYYY-MM-DD HH:mm:ss.SSS',
  'YYYY-MM-DD HH:mm:ss.SSS[Z]',
  'YYYY-MM-DD[T]HH:mm:ss.SSS',
  'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', // ISO8601

  'YYYY-MM-DD HH:mm:ss A',
  'YYYY-MM-DD HH:mm:ss a',
  
  // these two formats don't work
  // 'YYYY-MM-DD HH:mm:ssZ', // 2013-02-08 09:00:00+07:00
  // 'YYYY-MM-DD HH:mm:ssZZ', // 2013-02-08 09:00:00-0700
];

export type GenericDatumValue = number | string | boolean | null;

export type GenericDatum<T extends StringKeyedObj> = {
  [key in keyof T]: GenericDatumValue
};

export function valiDate(dateObj: dayjs.Dayjs | unknown): boolean {
  return dayjs.isDayjs(dateObj) ? dateObj.isValid() : false;
}

export type GenericFormattingFunction = (
  datum: CategoricalDatum | ContinuousDatum | DatetimeDatum,
  stats: {
    min?: number | null;
    max?: number | null;
    frequencies?: { [cat: string]: number };
    sum?: number;
  }
) => string;

export type FormatterObject<T extends StringKeyedObj> = {
  [variable in keyof T]?: Array<{
    name: string;
    formatter: GenericFormattingFunction;
  }>
};

export type ParserFunction = (raw: any) => any;

export type ParserObject<T extends StringKeyedObj> = {
  [variable in keyof T]?: ParserFunction
};

function inferIfStringIsNumber(value: unknown): boolean {
  return typeof value === 'string' ? !isNaN(Number(value)) : false;
}

function inferIsNumber(value: unknown): boolean {
  return isFinite(value) || inferIfStringIsNumber(value);
}

export function detectValue(
  value: string | number | boolean | dayjs.Dayjs | Date | null,
  parser?: ParserFunction
): DatumType | 'unknown' {
  if (!value || isNull(value) || typeof value === 'boolean') {
    return 'unknown';
  }
  if (inferIsNumber(value)) {
    return 'continuous';
  } else if (isDate(value) || (isString(value) && isFormatDateValid(value, parser))) {
    return 'date';
  } else {
    return 'categorical';
  }
}

function isValidDate(dateString: string, formats: string[]): boolean {
  const strictMode = true
  const results = formats.map(format => {
    // @ts-ignore
    return dayjs(dateString, format, strictMode).isValid()
  })
  return results.some(res => res === true)
}

export function isFormatDateValid(
  value: string,
  parser?: ParserFunction
): boolean {
  if(!inferIfStringIsNumber(value[0])) return false

  const isFormatDateValid = isValidDate(value, DATE_FORMATS);

  // NOTE: we assume that if the user has written a parser, then the dates are in the correct format
  return isFormatDateValid || !isUndefined(parser);
}

interface Frequencies {
  categorical: number;
  continuous: number;
  date: number;
  unknown: number;
}

export function selectTypeFromFrequencies(fr: Frequencies): DatumType {
  // To be date, no unknown can be present, to be continuous the same condition does not apply
  switch (true) {
    case fr.unknown === 0 &&
      fr.categorical === 0 &&
      fr.continuous === 0 &&
      fr.date > 0:
      return 'date';
    case fr.categorical === 0 && fr.date === 0 && fr.continuous > 0:
      return 'continuous';
    default:
      return 'categorical';
  }
}

export function detectArrayType<T extends StringKeyedObj>(
  column: Array<GenericDatum<T>[keyof T]>,
  parser?: ParserFunction
): DatumType {
  const columnProbs = column.reduce<Frequencies>(
    (acc, value) => {
      const t = detectValue(value, parser);

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

  return selectTypeFromFrequencies(columnProbs);
}

export function autoInferenceType<T extends StringKeyedObj>(
  data: Array<GenericDatum<T>>,
  existingObj: InferObject<T> | {} = {},
  parser: ParserObject<T> = {}
): InferObject<T> {
  const incomingKeys = [...getAllKeys(data)];
  const passedKeys = new Set(keys(existingObj));
  const keyType: Array<[keyof T, DatumType]> = incomingKeys
    .filter(k => !passedKeys.has(k))
    .map(key => {
      const columnParser = get(parser, key, undefined);
      const variableData = data.map(d => d[key]);
      return [key, detectArrayType(variableData, columnParser)];
    });
  return { ...fromPairs(keyType), ...existingObj };
}
