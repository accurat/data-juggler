import {
  isNull,
  max as _max,
  min as _min,
  toString,
} from 'lodash'

import dayjs from 'dayjs'

import {
  FormatterObject,
  GenericDatum,
  GenericDatumValue,
  valiDate
} from './utils/dataInference'

import {
  CategoricalDatum,
  ContinuousDatum,
  DatetimeDatum,
  InferObject,
  InferType,
  MomentsObject,
  NormalizingCategorical,
  NormalizingContinuous,
  NormalizingDatetime,
  StringKeyedObj,
} from '../types/types'

import { conditionalValueMap, fromPairs, toPairs } from './utils/parseObjects';

// tslint:disable:no-this
// tslint:disable:no-object-literal-type-assertion
// tslint:disable:no-object-mutation
// tslint:disable:no-expression-statement
// Fuck you tslint, watch me use those fucking if statements.

type ParsedDatum<T> = { [P in keyof T]: ContinuousDatum | DatetimeDatum | CategoricalDatum }

export function parseDatumFactory<T extends StringKeyedObj>(
  inferObject: InferObject<T>,
  moments: MomentsObject<T>,
  formatterObject?: FormatterObject<T>
): (snapshot: GenericDatum<T>) => ParsedDatum<T> {
  return (snapshot) => {
    return fromPairs(Object.entries(snapshot)
      .map(([variable, value]:[keyof T, GenericDatumValue]): [keyof T, ContinuousDatum | DatetimeDatum | CategoricalDatum] => {
        const inference: InferType = inferObject[variable]
        const variableFormatter = (formatterObject && variable in formatterObject)
          ? formatterObject[variable]
          : []

        switch (inference) {
          case 'continuous': {
            const { min, max } = moments[variable] as NormalizingContinuous
            const datum: ContinuousDatum = {
              raw: value as number, // FIXME: Better typing, link this to inference
              get scaled(): number {
                return !isNull(min) && !isNull(max) ? (this.raw - min) / (max - min) : this.raw
              }
            }

            if (variableFormatter) {
                variableFormatter.forEach(({ name, formatter }) => {
                Object.defineProperty(datum, name, {
                  configurable: true,
                  enumerable: true,
                  get(): string { return formatter(this) }
                })
              })
            }

            return [variable, datum]
          }
          case 'date': {
            const { min, max } = moments[variable] as NormalizingDatetime

            const datum: DatetimeDatum = {
              raw: value as number,
              get dateTime(): dayjs.Dayjs {
                return dayjs.unix(this.raw)
              },
              get isValid(): boolean {
                return valiDate(this.dateTime)
              },
              get iso(): string {
                return this.dateTime.format('DD-MM-YYYY')
              },
              get scaled(): number | null {
                return !isNull(min) && !isNull(max) ? (this.raw - min) / (max - min) : this.raw
              }
            }

            if (variableFormatter) {
              variableFormatter.forEach(({ name, formatter }) => {
              Object.defineProperty(datum, name, {
                configurable: true,
                enumerable: true,
                get(): string { return formatter(this) }
              })
            })
          }

            return [variable, datum]
          }

          case 'categorical': {
            const stringValue = toString(value)
            const datum: CategoricalDatum = { raw: stringValue }
            const { frequencies } = moments[variable] as NormalizingCategorical

            if (variableFormatter) {
              variableFormatter.forEach(({ name, formatter }) => {
                Object.defineProperty(datum, name, {
                  configurable: true,
                  enumerable: true,
                  get(): string { return formatter(this.raw, { frequencies }) }
                })
              })
            }

            return [variable, datum]
          }
        }
      }))
  }
}

export function parseDates<T>(
  rawData: Array<GenericDatum<T>>,
  inferTypes: InferObject<T>
  ): Array<{ [P in keyof T]: GenericDatumValue }> {
  const dateKeys = toPairs(inferTypes)
    .filter(([__, t]) => t === 'date')
    .map(([v, __]) => v)

  const isPairDate = <K extends keyof T>(key: K): boolean =>
    dateKeys.includes(key)

  const makeDayjs = <K extends keyof T, V>(key: K, value: V): [K, number] =>
    [key, dayjs(String(value)).unix()]

  return rawData.map((datum) => conditionalValueMap<keyof T, GenericDatumValue, number>(datum, isPairDate, makeDayjs))
}