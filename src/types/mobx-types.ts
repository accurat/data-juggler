import {
  _NotCustomized,
  IArrayType,
  IModelType,
  ISimpleType,
  ModelInstanceType,
  ModelPropertiesDeclarationToProperties
} from 'mobx-state-tree';

export type DataStoreInstanceType = ModelInstanceType<
  ModelPropertiesDeclarationToProperties<{
    data: IArrayType<
      IModelType<
        ModelPropertiesDeclarationToProperties<{
          [variable: string]: ISimpleType<string | number>;
        }>,
        {},
        _NotCustomized,
        _NotCustomized
      >
    >;
  }>,
  {},
  _NotCustomized,
  _NotCustomized
>;
