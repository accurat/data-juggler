import {
  _NotCustomized,
  IArrayType,
  IModelType,
  ISimpleType,
  ModelPropertiesDeclarationToProperties
} from 'mobx-state-tree';

export type GenericModelData = IModelType<
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
