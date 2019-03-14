import {
  fromPairs,
  has,
  isNull,
  isNumber,
  isUndefined,
  max as _max,
  min as _min,
  toPairs,
  toString
} from 'lodash';

import dayjs from 'dayjs';

import { IMaybeNull, IType, types } from 'mobx-state-tree';
import { isCategorical, isContinous, isDatetime } from '../types/utils';

// tslint:disable:no-if-statement
// tslint:disable:no-this
// tslint:disable:no-expression-statement
// Fuck you tslint, watch me use those fucking if statements.

export interface ContinuousDatum {
  raw: number;
  scaled: number | null;
  formatted?: string | number;
}

export interface CategoricalDatum {
  raw: string;
  formatted?: string;
}

export interface DatetimeDatum {
  raw: number;
  iso: string;
  dateTime: dayjs.Dayjs;
  scaled: number | null;
  isValid: boolean;
}

const updateMin = (value: number, min: number | null) =>
  isNull(min) ? value : _min([value, min]) || min;
const updateMax = (value: number, max: number | null) =>
  isNull(max) ? value : _max([value, max]) || max;

export const generateNewMoments = (
  accumulator: MomentsObject,
  datum: GenericDatum
) => {
  const entries = toPairs(datum);

  const newMomentsEntries = entries.map(([variable, value]) => {
    const variableMoments = accumulator[variable];

    if (isCategorical(variableMoments) && typeof value === 'string') {
      const { frequencies } = variableMoments;
      const newFrequencies = {
        ...frequencies,
        [value]: frequencies[value] ? frequencies[value] + 1 : 1
      };
      const newFrequencyMoments: NormalizingCategorical = {
        frequencies: newFrequencies
      };

      return [variable, newFrequencyMoments];
    } else if (isContinous(variableMoments) && typeof value === 'number') {
      const { min, max, sum } = variableMoments;

      const newMin = updateMin(value, min);
      const newMax = updateMax(value, max);
      const updatedSum = sum + value;

      const newContinousMoments: NormalizingContinuous = {
        max: newMax,
        min: newMin,
        sum: updatedSum
      };

      return [variable, newContinousMoments];
    } else if (isDatetime(variableMoments) && typeof value === 'number') {
      const { min, max } = variableMoments;
      const newMin = updateMin(value, min);
      const newMax = updateMax(value, max);

      const newDatetimeMoments: NormalizingDatetime = {
        max: newMax,
        min: newMin
      };
      return [variable, newDatetimeMoments];
    } else {
      return [variable, variableMoments];
    }
  });

  const newMoments: MomentsObject = fromPairs(newMomentsEntries);

  return newMoments;
};

interface FrozenObject {
  [variable: string]: IMaybeNull<IType<any, any, any>>;
}

export function generateDatumModel(datumKeys: string[]): FrozenObject {
  const model = datumKeys.map(variable => [
    variable,
    types.maybeNull(types.frozen())
  ]);

  const storeObj: {
    [variable: string]: IMaybeNull<IType<any, any, any>>;
  } = fromPairs(model);

  return storeObj;
}

// --- Processing the snapshot

function valiDate(dateObj: dayjs.Dayjs | unknown): boolean {
  return dayjs.isDayjs(dateObj) ? dateObj.isValid() : false;
}

type ParsingFunction = (
  datum: number | string,
  min?: number,
  max?: number
) => number | string;
type DateFormattingFunction = (datum: dayjs.Dayjs) => string;

export interface ParseObjectType {
  [variable: string]: Array<{
    name: string;
    formatting: DateFormattingFunction | ParsingFunction;
  }>;
}

// FIXME: please
function isFnForDates(
  misteryFn: (arg: any) => unknown
): misteryFn is DateFormattingFunction {
  try {
    misteryFn(dayjs());
    return true;
  } catch (_) {
    return false;
  }
}

export function processDatumSnapshotFactory(
  inferObject: InferObject,
  moments: MomentsObject,
  parseObject?: ParseObjectType
): (
  snapshot: GenericDatum
) => {
  [variable: string]: ContinuousDatum | CategoricalDatum | DatetimeDatum;
} {
  return (snapshot: GenericDatum) => {
    const processedSnapshot: {
      [variable: string]: ContinuousDatum | CategoricalDatum | DatetimeDatum;
    } = fromPairs(
      toPairs(snapshot).map(([variable, value]) => {
        const inference = inferObject[variable];

        const customVariableParser =
          !isUndefined(parseObject) && has(parseObject, variable)
            ? parseObject.variable
            : [];

        switch (inference) {
          case 'continuous':
            const contMoments = moments[variable];
            const { min: valueMin, max: valueMax } = isContinous(contMoments)
              ? contMoments
              : { min: 0, max: 1 };
            if (isNumber(value)) {
              const returnValueObj: ContinuousDatum = {
                raw: value,
                get scaled(): number | null {
                  if (!valueMin || !valueMax) {
                    return null;
                  }
                  return (this.raw - valueMin) / (valueMax - valueMin);
                }
              };

              customVariableParser.forEach(({ name, formatting }) => {
                if (!isFnForDates(formatting)) {
                  Object.defineProperty(returnValueObj, name, {
                    get(): string | number {
                      return formatting(this.raw);
                    }
                  });
                }
              });

              return [variable, returnValueObj];
            } else {
              return [variable, { raw: value }];
            }

          case 'date':
            const dateMoments = moments[variable];
            const { min: dateMin, max: dateMax } = isDatetime(dateMoments)
              ? dateMoments
              : { min: 0, max: 1 };

            if (isNumber(value) && dateMin && dateMax) {
              const returnObjDate: DatetimeDatum = {
                raw: value,
                get dateTime(): dayjs.Dayjs {
                  return dayjs.unix(this.raw);
                },
                get isValid(): boolean {
                  return valiDate(this.dateTime);
                },
                get iso(): string {
                  return this.dateTime.format('DD-MM-YYYY');
                },
                get scaled(): number | null {
                  if (!dateMin || !dateMax) {
                    return null;
                  }
                  return (this.raw - dateMin) / (dateMax - dateMin);
                }
              };

              customVariableParser.forEach(({ name, formatting }) => {
                if (!isFnForDates(formatting)) {
                  Object.defineProperty(returnObjDate, name, {
                    get(): string | number {
                      return formatting(this.raw);
                    }
                  });
                } else {
                  Object.defineProperty(returnObjDate, name, {
                    get(): string {
                      return formatting(this.dateTime);
                    }
                  });
                }
              });

              return [variable, returnObjDate];
            } else {
              return [variable, { raw: value }];
            }

          case 'categorical':
            const stringValue = toString(value);

            const returnCatObj: CategoricalDatum = {
              raw: stringValue
            };

            customVariableParser.forEach(({ name, formatting }) => {
              if (!isFnForDates(formatting)) {
                Object.defineProperty(returnCatObj, name, {
                  get(): string | number {
                    return formatting(this.raw);
                  }
                });
              }
            });

            return [variable, returnCatObj];
        }
      })
    );

    return processedSnapshot;
  };
}
