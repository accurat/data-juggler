import _ from 'lodash';

import { isCategorical, isContinous, isDatetime } from '../types/utils';

// tslint:disable:no-if-statement
// Fuck you tslint, watch me us those fucking if statements.

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
        [variable]: frequencies[variable] ? frequencies[variable] + 1 : 1
      };
      const newFrequencyMoments: NormalizingCategorical = {
        frequencies: newFrequencies
      };

      return [variable, newFrequencyMoments];
    } else if (isContinous(variableMoments) && typeof value === 'number') {
      const { min, max, sum } = variableMoments;
      const newContinousMoments: NormalizingContinuous = {
        max: value && value > max ? value : max,
        min: value && value < min ? value : min,
        sum: sum + value
      };

      return [variable, newContinousMoments];
    } else if (isDatetime(variableMoments) && typeof value === 'number') {
      const { min, max } = variableMoments;
      const newDatetimeMoments: NormalizingDatetime = {
        max: value && value > max ? value : max,
        min: value && value < min ? value : min
      };
      return [variable, newDatetimeMoments];
    } else {
      return [variable, variableMoments];
    }
  });

  const newMoments: MomentsObject = _.fromPairs(newMomentsEntries);

  return newMoments;
};
