// tslint:disable:no-expression-statement
import test from 'ava';
import { types } from 'mobx-state-tree';
import { dataStoreFactory } from './datastore';

test('power', t => {
  const FIRST_SAMPLE_DATA: ReadonlyArray<any> = [
    { a: 3, b: 'mamma' },
    { a: 2, b: 'papà', c: 2 }
  ];
  const INSTANCE_TYPES: InferObject = {
    a: 'continuous',
    b: 'categorical',
    c: 'continuous'
  };

  const result = dataStoreFactory(
    FIRST_SAMPLE_DATA,
    INSTANCE_TYPES,
    'dataStore'
  );

  t.notThrows(() =>
    dataStoreFactory(FIRST_SAMPLE_DATA, INSTANCE_TYPES, 'dataStore')
  );
  t.not(result, null);
  t.is(typeof result, typeof types.model());
});
