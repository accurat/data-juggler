type ValueOf<T> = T[keyof T];

interface GenericDatum {
  readonly [key: string]: number | string | boolean | null;
}

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
