import dayjs from 'dayjs';
import {
  get,
  isNaN,
  isNull,
  isNumber,
  max as _max,
  min as _min,
  toString
} from 'lodash';
import CustomParseFormat from 'dayjs/plugin/customParseFormat'; // load on demand
import {
  FormatterObject,
  GenericDatum,
  GenericDatumValue,
  ParserFunction,
  ParserObject,
  valiDate
} from './dataInference';
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
import { conditionalValueMap, fromPairs, toPairs } from './parseObjects';
import { convertToUnix } from './dateUtils';
dayjs.extend(CustomParseFormat); // use plugin

// Fuck you tslint, watch me use those fucking if statements.

type ParsedDatum<T> = {
  [P in keyof T]: ContinuousDatum | DatetimeDatum | CategoricalDatum
};

export const identity = <I>(t: I): I => t;

const logScale = (v: number, l: number, u: number) => {
  const safeL = l === 0 ? l + 0.0001 : l;
  return Math.log(v / safeL) / Math.log(u / safeL);
};

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

          const parse: ParserFunction | typeof identity = get(
            parser,
            variable,
            identity
          );

          switch (inference) {
            case 'continuous': {
              const { min, max, sum } = moments[
                variable
              ] as NormalizingContinuous;
              const datum: ContinuousDatum = {
                raw: parse(value), // FIXME: Better typing, link this to inference
                get scaled(): null | number {
                  if (isNull(this.raw)) {
                    return null;
                  }

                  return !isNull(min) && !isNull(max)
                    ? (this.raw - min) / (max - min)
                    : this.raw;
                },
                get logScale(): null | number {
                  if (isNull(this.raw)) {
                    return null;
                  }

                  return !isNull(min) && !isNull(max)
                    ? logScale(this.raw, min, max)
                    : this.raw;
                }
              };

              if (variableFormatter) {
                variableFormatter.forEach(({ name, formatter }) => {
                  Object.defineProperty(datum, name, {
                    configurable: true,
                    enumerable: true,
                    get(): string {
                      return formatter(datum, {
                        max,
                        min,
                        sum
                      });
                    }
                  });
                });
              }

              return [variable, datum];
            }
            case 'date': {
              const { min, max } = moments[variable] as NormalizingDatetime;
              const rawValue = value;
              const datum: DatetimeDatum = {
                raw: !isNaN(rawValue) && isNumber(rawValue) ? rawValue : null,
                get dateTime(): dayjs.Dayjs {
                  return dayjs.unix(this.raw || 0);
                },
                get isValid(): boolean {
                  return valiDate(this.dateTime);
                },
                get iso(): string {
                  return this.dateTime.format('DD-MM-YYYY');
                },
                get scaled(): number | null {
                  return !isNull(min) && !isNull(max) && !isNull(rawValue)
                    ? (Number(rawValue) - min) / (max - min)
                    : null;
                },
                get logScale(): null | number {
                  if (isNull(this.raw)) {
                    return null;
                  }

                  return !isNull(min) && !isNull(max)
                    ? logScale(this.raw, min, max)
                    : this.raw;
                }
              };

              if (variableFormatter) {
                variableFormatter.forEach(({ name, formatter }) => {
                  Object.defineProperty(datum, name, {
                    configurable: true,
                    enumerable: true,
                    get(): string {
                      return formatter(datum, {
                        max,
                        min
                      });
                    }
                  });
                });
              }

              return [variable, datum];
            }

            case 'categorical': {
              const stringValue = toString(value);
              const datum: CategoricalDatum = {
                raw: parse(stringValue) as string
              };
              const { frequencies } = moments[
                variable
              ] as NormalizingCategorical;

              if (variableFormatter) {
                variableFormatter.forEach(({ name, formatter }) => {
                  Object.defineProperty(datum, name, {
                    configurable: true,
                    enumerable: true,
                    get(): string {
                      return formatter(datum, { frequencies });
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

export function parseDates<T extends StringKeyedObj>(
  rawData: Array<GenericDatum<T>>,
  inferTypes: InferObject<T>,
  parser: ParserObject<T>
): Array<{ [P in keyof T]: GenericDatumValue }> {
  const dateKeys = toPairs(inferTypes)
    .filter(([_, t]) => t === 'date')
    .map(([v, _]) => v);

  const isPairDate = <K extends keyof T, S>(key: K, _: unknown): _ is S =>
    dateKeys.includes(key);

  const makeDayjs = <K extends keyof T, V extends string | number>(
    key: K,
    value: V
  ): number =>
    get(parser, key, (v: V) =>
      !isNaN(dayjs(v).unix()) ? convertToUnix(v) : null
    )(value);

  return rawData.map(datum =>
    conditionalValueMap<keyof T, number, GenericDatumValue, number>(
      datum,
      isPairDate,
      makeDayjs
    )
  );
}
