import _ from 'lodash';
import { DateTime } from 'luxon';

import { IMaybeNull, IType, types } from 'mobx-state-tree';
import { isCategorical, isContinous, isDatetime } from '../types/utils';

// tslint:disable:no-if-statement
// Fuck you tslint, watch me us those fucking if statements.

interface ContinuousDatum {
  raw: number;
  scaled: number;
}

interface CategoricalDatum {
  raw: string;
}

interface DatetimeDatum {
  raw: number;
  iso: string;
  locale: string;
  dateTime: DateTime;
  scaled: number;
}

const updateMin = (value: number, min: number | null) =>
  _.isNull(min) ? value : _.min([value, min]) || min;
const updateMax = (value: number, max: number | null) =>
  _.isNull(max) ? value : _.max([value, max]) || max;

export const generateNewMoments = (
  accumulator: MomentsObject,
  datum: GenericDatum
) => {
  const entries = _.toPairs(datum);

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

  const newMoments: MomentsObject = _.fromPairs(newMomentsEntries);

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
  } = _.fromPairs(model);

  return storeObj;
}

export function processDatumSnapshotFactory(
  inferObject: InferObject,
  moments: MomentsObject,
  dateFormatting?: Intl.DateTimeFormatOptions
): (
  snapshot: GenericDatum
) => {
  [variable: string]: ContinuousDatum | CategoricalDatum | DatetimeDatum;
} {
  return (snapshot: GenericDatum) => {
    const processedSnapshot: {
      [variable: string]: ContinuousDatum | CategoricalDatum | DatetimeDatum;
    } = _.fromPairs(
      _.toPairs(snapshot).map(([variable, value]) => {
        const inference = inferObject[variable];

        switch (inference) {
          case 'continuous':
            const contMoments = moments[variable];
            const { min: valueMin, max: valueMax } = isContinous(contMoments)
              ? contMoments
              : { min: 0, max: 1 };
            if (_.isNumber(value) && valueMax && valueMin) {
              const returnValueObj: ContinuousDatum = {
                raw: value,
                scaled: (value - valueMin) / (valueMax - valueMin)
              };

              return [variable, returnValueObj];
            } else {
              return [variable, { raw: value }];
            }

          case 'date':
            const dateMoments = moments[variable];
            const { min: dateMin, max: dateMax } = isDatetime(dateMoments)
              ? dateMoments
              : { min: 0, max: 1 };

            if (_.isNumber(value) && dateMin && dateMax) {
              const luxonObject = DateTime.fromMillis(value);
              const iso = luxonObject.toISODate();
              const locale = luxonObject.toLocaleString(
                dateFormatting || DateTime.DATETIME_MED
              );

              const returnObjDate: DatetimeDatum = {
                dateTime: luxonObject,
                iso,
                locale,
                raw: value,
                scaled: (value - dateMin) / (dateMax - dateMin)
              };

              return [variable, returnObjDate];
            } else {
              return [variable, { raw: value }];
            }

          case 'categorical':
            return [variable, { raw: value }];
        }
      })
    );

    return processedSnapshot;
  };
}
