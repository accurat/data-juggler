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
  readonly mean: number;
  readonly min: number;
  readonly max: number;
}

interface NormalizingDatetime {
  readonly min: number;
  readonly max: number;
}

interface NormalizingCategorical {
  readonly frequencies: ReadonlyArray<
    ReadonlyArray<{ readonly [variable: string]: number }>
  >;
}

interface MapTypeInfer {
  readonly continuous: NormalizingContinuous;
  readonly categorical: NormalizingCategorical;
  readonly date: NormalizingDatetime;
}

type InferType = keyof MapTypeInfer;

type MapSchema<T extends InferType> = MapTypeInfer[T];

interface InferObject {
  readonly [key: string]: InferType;
}

type MomentsObject = Array<
  NormalizingContinuous | NormalizingCategorical | NormalizingDatetime
>;
