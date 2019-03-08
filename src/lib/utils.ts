import _ from 'lodash';

import { isCategorical, isContinous, isDatetime } from '../types/utils';

// tslint:disable:no-if-statement
// Fuck you tslint, watch me us those fucking if statements.

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
