// tslint:disable:no-if-statement

function hasMultipleProperties(
  obj: { [key: string]: unknown },
  properties: string[]
): boolean {
  return properties.every(p => obj.hasOwnProperty(p));
}

export const isContinous = (
  moment: MomentsType
): moment is NormalizingContinuous =>
  hasMultipleProperties(moment, ['min', 'max', 'mean']);

export const isDatetime = (
  moment: MomentsType
): moment is NormalizingDatetime =>
  hasMultipleProperties(moment, ['min', 'max']) &&
  !moment.hasOwnProperty('mean');

export const isCategorical = (
  moment: MomentsType
): moment is NormalizingCategorical =>
  hasMultipleProperties(moment, ['frequencies']);
