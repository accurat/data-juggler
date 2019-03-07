type ValueOf<T> = T[keyof T];

interface GenericDatum {
  readonly [key: string]:
    | number
    | string
    | boolean
    | ReadonlyArray<number>
    | ReadonlyArray<string>
    | GenericDatum
    | null;
}

interface NormalizingContinuous {
  readonly sum: number;
  readonly min: number;
  readonly max: number;
}

interface NormalizingDatetime {
  readonly min: number;
  readonly max: number;
}

interface NormalizingCategorical {
  readonly frequencies: { readonly [variable: string]: number };
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

type MomentsObject = MomentsType[];
