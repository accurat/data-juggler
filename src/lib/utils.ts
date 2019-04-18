import {
  Dictionary,
  fromPairs,
  has,
  isNumber,
  isUndefined,
  max as _max,
  min as _min,
  toPairs,
  toString
} from 'lodash';

import dayjs from 'dayjs';

import {
  GenericDatum,
  isCategorical,
  isContinous,
  isDatetime,
  JSONArray,
  JSONObject,
  ParseObjectType,
  valiDate
} from './utils/dataInference';

import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum
} from './utils/dataTypes';

// tslint:disable:no-this
// tslint:disable:no-expression-statement
// Fuck you tslint, watch me use those fucking if statements.

// --- Processing the snapshot

type Datum = DatetimeDatum | CategoricalDatum | ContinuousDatum;

type fromPairsTuple = [
  string,
  string | number | boolean | dayjs.Dayjs | JSONObject | JSONArray | null
];

type ObjMapFnType = (pair: fromPairsTuple) => [string, Datum];

function mapObject(obj: GenericDatum, fn: ObjMapFnType): Dictionary<Datum> {
  return fromPairs(toPairs(obj).map(fn));
}

type PreprocessSnapshotType = (
  snapshot: GenericDatum
) => { [variable: string]: Datum };

const generateDatumObject = (
  inferObject: InferObject,
  moments: MomentsObject,
  parseObject?: ParseObjectType
): ObjMapFnType => ([variable, value]) => {
  const inference = inferObject[variable];
  const customVariableParser =
    !isUndefined(parseObject) && has(parseObject, variable)
      ? parseObject[variable]
      : [];

  switch (inference) {
    case 'continuous':
      const contMoments = moments[variable];
      const { min: valueMin, max: valueMax, sum } = isContinous(contMoments)
        ? contMoments
        : { min: 0, max: 1, sum: 1 };

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

        customVariableParser.forEach(({ name, formatter }) => {
          Object.defineProperty(returnValueObj, name, {
            configurable: true,
            enumerable: true,
            get(): string | number | dayjs.Dayjs | null {
              return formatter(returnValueObj, {
                max: valueMax || 0,
                min: valueMin || 0,
                sum
              });
            }
          });
        });

        return [variable, returnValueObj];
      } else {
        return [variable, { raw: Number(value), scaled: null }];
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

        customVariableParser.forEach(({ name, formatter }) => {
          Object.defineProperty(returnObjDate, name, {
            configurable: true,
            enumerable: true,
            get(): string | number | dayjs.Dayjs | null {
              return formatter(returnObjDate, {
                max: dateMax || 0,
                min: dateMin || 0
              });
            }
          });
        });

        return [variable, returnObjDate];
      } else {
        return [variable, { raw: value, scaled: null }];
      }

    case 'categorical':
      const stringValue = toString(value);
      const returnCatObj: CategoricalDatum = {
        raw: stringValue
      };

      const catMoments = moments[variable];
      const { frequencies } = isCategorical(catMoments)
        ? catMoments
        : { frequencies: {} };

      customVariableParser.forEach(({ name, formatter }) => {
        Object.defineProperty(returnCatObj, name, {
          configurable: true,
          enumerable: true,
          get(): string | number | dayjs.Dayjs | null {
            return formatter(this.raw, { frequencies });
          }
        });
      });

      return [variable, returnCatObj];
  }
};

/**
 * A high order function that processes the mobx-state-tree dataset snapshot, calculates the necessary statistics, adds the custom formatter and returns a mobx-state-tree store
 *
 * @export
 * @param {InferObject} inferObject
 * @param {MomentsObject} moments
 * @param {ParseObjectType} [parseObject]
 * @returns {((
 *   snapshot: GenericDatum
 * ) => {
 *   ContinuousDatum | CategoricalDatum | DatetimeDatum;
 * })}
 */
export function processDatumSnapshotFactory(
  inferObject: InferObject,
  moments: MomentsObject,
  parseObject?: ParseObjectType
): PreprocessSnapshotType {
  const preprocessFunction = (snapshot: GenericDatum) =>
    mapObject(snapshot, generateDatumObject(inferObject, moments, parseObject));
}
