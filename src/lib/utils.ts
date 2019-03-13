import {
  fromPairs,
  isNull,
  isNumber,
  max as _max,
  min as _min,
  toPairs,
  toString
} from 'lodash';

import dayjs, { Dayjs } from 'dayjs';

import { IMaybeNull, IType, types } from 'mobx-state-tree';
import { isCategorical, isContinous, isDatetime } from '../types/utils';

// tslint:disable:no-if-statement
// tslint:disable:no-this
// tslint:disable:no-expression-statement
// Fuck you tslint, watch me us those fucking if statements.

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
  dateTime: unknown;
  scaled: number | null;
  isValid: boolean;
}

// TODO: correctly type the conditional format based on general
export type ParseObjectType = {
  [P in ValueOf<InferObject>]?: P extends 'date'
    ? DatetimeParse
    : (P extends 'continuous' ? CategoricalParser : ContinuousParser)
};

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

              // TODO: this could be done without this property definition?
              if (parseObject && parseObject.continuous) {
                const parser = parseObject.continuous;
                Object.defineProperty(returnValueObj, 'formatted', {
                  get(): string | number {
                    return parser.format(this.raw);
                  }
                });
              }

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
              const generate =
                parseObject && parseObject.date && parseObject.date.generate
                  ? parseObject.date.generate
                  : dayjs;

              const returnObjDate: DatetimeDatum = {
                raw: value,
                get dateTime(): unknown {
                  return generate(this.raw);
                },
                get isValid(): boolean {
                  return valiDate(this.dateTime);
                },

                get iso(): string {
                  const dateTime = this.dateTime;

                  const format =
                    parseObject && parseObject.date && parseObject.date.format;

                  if (dayjs.isDayjs(dateTime)) {
                    return dateTime.format(
                      typeof format === 'string' ? format : undefined
                    );
                  } else {
                    return typeof format !== 'string' && format
                      ? format(dateTime)
                      : '';
                  }
                },
                get scaled(): number | null {
                  if (!dateMin || !dateMax) {
                    return null;
                  }
                  return (this.raw - dateMin) / (dateMax - dateMin);
                }
              };

              return [variable, returnObjDate];
            } else {
              return [variable, { raw: value }];
            }

          case 'categorical':
            const stringValue = toString(value);

            const returnCatObj: CategoricalDatum = {
              raw: stringValue
            };

            if (parseObject && parseObject.categorical) {
              const parser = parseObject.categorical;
              Object.defineProperty(returnCatObj, 'formatted', {
                get(): string | number {
                  return parser.format(this.raw);
                }
              });
            }

            return [variable, returnCatObj];
        }
      })
    );

    return processedSnapshot;
  };
}

function valiDate(dateObj: Dayjs | unknown): boolean {
  return dayjs.isDayjs(dateObj) ? dateObj.isValid() : false;
}
