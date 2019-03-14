type ValueOf<T> = T[keyof T];

interface NormalizingContinuous {
  readonly sum: number;
  readonly min: number | null;
  readonly max: number | null;
}

interface NormalizingDatetime {
  readonly min: number | null;
  readonly max: number | null;
}

interface NormalizingCategorical {
  readonly frequencies: { readonly [instance: string]: number };
}

interface MapTypeInfer {
  readonly continuous: NormalizingContinuous;
  readonly categorical: NormalizingCategorical;
  readonly date: NormalizingDatetime;
}

type InferType = keyof MapTypeInfer;
type MomentsType = ValueOf<MapTypeInfer>;

type MapSchema<T extends InferType> = MapTypeInfer[T];

interface InferObject {
  readonly [key: string]: InferType;
}

interface MomentsObject {
  readonly [variable: string]: MomentsType;
}

interface DatetimeParse {
  generate?: (unix: number) => unknown;
  format: ((s: unknown) => string) | string;
}

interface CategoricalParser {
  format: (n: number) => number | string;
}

interface ContinuousParser {
  format: (categoricalVariableInstance: string) => string;
}
