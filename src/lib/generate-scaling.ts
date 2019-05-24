import { isNull, keys, reduce, toNumber } from "lodash"
import { MomentsObject, MomentsType, StringKeyedObj } from "../types/types";

type ScalingFn = (lower: number, upper: number) => (scaledValue: unknown)=> number

export type ScalingFnsRecords<D> = {
  [K in keyof D]: ScalingFn
}

function scaleFromMoment(m: MomentsType): ScalingFn {
  const { min, max } = m
  return (lower: number, upper: number) =>
    (scaled: unknown) => !(isNull(max) || isNull(min)) ? (toNumber(scaled) * (max - min) + min - lower) / (upper - lower) : toNumber(scaled)
}

export function scalesFromMoments<T extends StringKeyedObj>(moments: MomentsObject<T>): ScalingFnsRecords<T> {
  // tslint:disable-next-line:no-object-literal-type-assertion
  return reduce(keys(moments), (acc, variable) => ({...acc, [variable]: scaleFromMoment(moments[variable])}), {} as ScalingFnsRecords<T>)
}
