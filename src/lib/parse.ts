import { get, isNaN, isNull, max as _max, min as _min, toString } from 'lodash';

import dayjs from 'dayjs';

// tslint:disable-next-line:no-submodule-imports
import CustomParseFormat from 'dayjs/plugin/customParseFormat' // load on demand
// tslint:disable-next-line:no-expression-statement
dayjs.extend(CustomParseFormat) // use plugin

import {
  FormatterObject,
  GenericDatum,
  GenericDatumValue,
  ParserFunction,
  ParserObject,
  valiDate
} from './utils/dataInference';

import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
  DatumType,
  InferObject,
  MomentsObject,
  NormalizingCategorical,
  NormalizingContinuous,
  NormalizingDatetime,
  StringKeyedObj
} from '../types/types';

import { conditionalValueMap, fromPairs, toPairs } from './utils/parseObjects';

// tslint:disable:no-this
// tslint:disable:no-object-literal-type-assertion
// tslint:disable:no-object-mutation
// tslint:disable:no-expression-statement
// Fuck you tslint, watch me use those fucking if statements.

type ParsedDatum<T> = {
  [P in keyof T]: ContinuousDatum | DatetimeDatum | CategoricalDatum
};

export const identity = <I>(t: I):I => t

const defaultParseDate = (d: unknown) => {
  switch(typeof d) {
    case 'number':
      return d
    case 'string':
      return dayjs(d).unix()
    case 'object': // null case for fuck sake javascript
      return 0

    default:
      return 0
  }
}

export function parseDatumFactory<T extends StringKeyedObj>(
  inferObject: InferObject<T>,
  moments: MomentsObject<T>,
  formatterObject?: FormatterObject<T>,
  parser?: ParserObject<T>
): (snapshot: GenericDatum<T>) => ParsedDatum<T> {
  return snapshot => {
    return fromPairs(
      Object.entries(snapshot).map(
        ([variable, value]: [keyof T, GenericDatumValue]): [
          keyof T,
          ContinuousDatum | DatetimeDatum | CategoricalDatum
        ] => {
          const inference: DatumType = inferObject[variable];
          const variableFormatter =
            formatterObject && variable in formatterObject
              ? formatterObject[variable]
              : [];

          const parse: ParserFunction | typeof identity = get(parser, variable, identity)
          const parseDate = get(parser, variable, defaultParseDate)

          switch (inference) {
            case 'continuous': {
              const { min, max } = moments[variable] as NormalizingContinuous;
              const datum: ContinuousDatum = {
                raw: parse(value), // FIXME: Better typing, link this to inference
                get scaled(): number {
                  return !isNull(min) && !isNull(max)
                    ? (this.raw - min) / (max - min)
                    : this.raw;
                }
              };

              if (variableFormatter) {
                variableFormatter.forEach(({ name, formatter }) => {
                  Object.defineProperty(datum, name, {
                    configurable: true,
                    enumerable: true,
                    get(): string {
                      return formatter(this);
                    }
                  });
                });
              }

              return [variable, datum];
            }
            case 'date': {
              const { min, max } = moments[variable] as NormalizingDatetime;
              const rawValue = parseDate(value)
              const datum: DatetimeDatum = {
                raw: !isNaN(rawValue) ? rawValue : null,
                get dateTime(): dayjs.Dayjs {
                  return dayjs.unix(Number(rawValue));
                },
                get isValid(): boolean {
                  return valiDate(this.dateTime);
                },
                get iso(): string {
                  return this.dateTime.format('DD-MM-YYYY');
                },
                get scaled(): number | null {
                  return !isNull(min) && !isNull(max) && !isNull(this.raw)
                    ? (Number(rawValue) - min) / (max - min)
                    : 0;
                }
              };

              if (variableFormatter) {
                variableFormatter.forEach(({ name, formatter }) => {
                  Object.defineProperty(datum, name, {
                    configurable: true,
                    enumerable: true,
                    get(): string {
                      return formatter(this);
                    }
                  });
                });
              }

              return [variable, datum];
            }

            case 'categorical': {
              const stringValue = toString(value);
              const datum: CategoricalDatum = { raw: parse(stringValue) as string };
              const { frequencies } = moments[
                variable
              ] as NormalizingCategorical;

              if (variableFormatter) {
                variableFormatter.forEach(({ name, formatter }) => {
                  Object.defineProperty(datum, name, {
                    configurable: true,
                    enumerable: true,
                    get(): string {
                      return formatter(this.raw, { frequencies });
                    }
                  });
                });
              }

              return [variable, datum];
            }
          }
        }
      )
    );
  };
}

export function parseDates<T>(
  rawData: Array<GenericDatum<T>>,
  inferTypes: InferObject<T>,
  parser: ParserObject<T>,
): Array<{ [P in keyof T]: GenericDatumValue }> {
  const dateKeys = toPairs(inferTypes)
    .filter(([__, t]) => t === 'date')
    .map(([v, __]) => v);

  const isPairDate = <K extends keyof T, S>(key: K, _: unknown): _ is S =>
    dateKeys.includes(key);

  const makeDayjs = <K extends keyof T, V>(key: K, value: V): number =>
    get(
      parser,
      key,
      (v: V) => !isNaN(dayjs(String(v)).unix()) ? dayjs(String(v)).unix() : null
    )(value)

  return rawData.map(datum =>
    conditionalValueMap<keyof T, number, GenericDatumValue, number>(
      datum,
      isPairDate,
      makeDayjs
    )
  );
}
