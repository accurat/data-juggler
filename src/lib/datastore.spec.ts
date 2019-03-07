// tslint:disable:no-expression-statement
// tslint:disable:no-console
import test from 'ava';
import { dataStoreFactory, getKeysArray, populateNullData } from './datastore';

test('dataStore', t => {
  const FIRST_SAMPLE_DATA: GenericDatum[] = [
    { a: 3, b: 'mamma' },
    { a: 2, b: 'papà', c: 2 }
  ];
  const INSTANCE_TYPES: InferObject = {
    a: 'continuous',
    b: 'categorical',
    c: 'continuous'
  };

  const keysArray = getKeysArray(FIRST_SAMPLE_DATA);
  const EXPECTED_KEYS_ARRAY = ['a', 'b', 'c'];

  const filledSample = populateNullData(FIRST_SAMPLE_DATA);
  const EXPECTED_FILLED_SAMPLE = [
    { a: 3, b: 'mamma', c: null },
    { a: 2, b: 'papà', c: 2 }
  ];

  const result = dataStoreFactory(
    FIRST_SAMPLE_DATA,
    INSTANCE_TYPES,
    'dataStore'
  );

  // Keys array tests
  t.notThrows(() => getKeysArray(FIRST_SAMPLE_DATA));
  t.deepEqual(EXPECTED_KEYS_ARRAY, keysArray);

  // Filled array tests
  t.notThrows(() => populateNullData(FIRST_SAMPLE_DATA));
  t.deepEqual(EXPECTED_FILLED_SAMPLE, filledSample);

  t.notThrows(() =>
    dataStoreFactory(FIRST_SAMPLE_DATA, INSTANCE_TYPES, 'dataStore')
  );
  t.not(result, null);
});
