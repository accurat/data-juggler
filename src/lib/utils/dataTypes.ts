import dayjs from 'dayjs';
import { fromPairs } from 'lodash';
import { IMaybeNull, IType, types } from 'mobx-state-tree';

export interface ContinuousDatum {
  raw: number;
  scaled: number | null;
  [customForms: string]: number | string | null;
}

export interface CategoricalDatum {
  raw: string;
  [customForms: string]: number | string | null;
}

export interface DatetimeDatum {
  raw: number;
  iso: string;
  dateTime: dayjs.Dayjs;
  scaled: number | null;
  isValid: boolean;
  [customForms: string]: number | string | null | dayjs.Dayjs | boolean;
}

export interface FrozenObject {
  [variable: string]: IMaybeNull<IType<any, any, any>>;
}

export type DataProperty = Array<{
  [variable: string]: ContinuousDatum | CategoricalDatum | DatetimeDatum;
}>;

export function generateDatumModel(datumKeys: string[]): FrozenObject {
  const model = datumKeys.map(variable => [
    variable,
    types.maybeNull(types.frozen())
  ]);

  const storeObj: {
    [variable: string]: IMaybeNull<IType<any, any, any>>;
  } = fromPairs(model);

  return storeObj;
}
