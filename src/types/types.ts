import { Dayjs } from 'dayjs';

export type ValueOf<T> = T[keyof T];

export interface NormalizingContinuous {
  sum: number;
  min: number | null;
  max: number | null;
}

export interface NormalizingDatetime {
  min: number | null;
  max: number | null;
}

export interface NormalizingCategorical {
  frequencies: { readonly [instance: string]: number };
}

export interface MapTypeInfer {
  continuous: NormalizingContinuous;
  categorical: NormalizingCategorical;
  date: NormalizingDatetime;
}

export type DatumType = keyof MapTypeInfer;
export interface MomentsType {
  sum: number;
  min: number | null;
  max: number | null;
  frequencies: { readonly [instance: string]: number };
}

export type MapSchema<T extends DatumType> = MapTypeInfer[T];

export interface StringKeyedObj {
  [key: string]: unknown;
}

export type InferObject<T extends StringKeyedObj> = {
  [V in keyof T]: DatumType;
};
interface FormattedProperties {
  [customForms: string]: string | number | null | Dayjs | boolean;
}

export type ContinuousDatum = {
  raw: number;
  scaled: number | null;
  logScale: number | null;
  [x: string]: number | null | string;
} & FormattedProperties;

export type CategoricalDatum = {
  raw: string;
} & FormattedProperties;

export type DatetimeDatum = {
  raw: number | null;
  iso: string;
  dateTime: Dayjs;
  scaled: number | null;
  logScale: number | null;
  isValid: boolean;
} & FormattedProperties;

export type CollapsedDatum<T extends StringKeyedObj> = {
  [variable in keyof T]: ContinuousDatum | CategoricalDatum | DatetimeDatum;
};

export type MomentsObject<T extends StringKeyedObj> = {
  [variable in keyof T]: MomentsType;
};

export interface DatetimeParse {
  generate?: (unix: number) => unknown;
  format: ((s: unknown) => string) | string;
}

export interface CategoricalParser {
  format: (n: number) => number | string;
}

export interface ContinuousParser {
  format: (categoricalVariableInstance: string) => string;
}
