// tslint:disable:no-expression-statement
// tslint:disable:no-console
import test from 'ava';
import {
  dataStoreFactory,
  generateParamsArrayFromInferObject,
  getKeysArray,
  populateNullData
} from './datastore';

const FIRST_SAMPLE_DATA: GenericDatum[] = [
  { a: 3, b: 'mamma' },
  { a: 2, b: 'papà', c: 2 }
];
const INSTANCE_TYPES: InferObject = {
  a: 'continuous',
  b: 'categorical',
  c: 'continuous'
};

test('dataStore', t => {
  const keysArray = getKeysArray(FIRST_SAMPLE_DATA);
  const EXPECTED_KEYS_ARRAY = ['a', 'b', 'c'];

  const filledSample = populateNullData(FIRST_SAMPLE_DATA, keysArray);
  const EXPECTED_FILLED_SAMPLE = [
    { a: 3, b: 'mamma', c: null },
    { a: 2, b: 'papà', c: 2 }
  ];

  const result = dataStoreFactory(
    FIRST_SAMPLE_DATA
    // INSTANCE_TYPES,
    // 'dataStore'
  );

  // Keys array tests
  t.notThrows(() => getKeysArray(FIRST_SAMPLE_DATA));
  t.deepEqual(EXPECTED_KEYS_ARRAY, keysArray);

  // Filled array tests
  t.notThrows(() => populateNullData(FIRST_SAMPLE_DATA, keysArray));
  t.deepEqual(EXPECTED_FILLED_SAMPLE, filledSample);

  t.notThrows(() => dataStoreFactory(FIRST_SAMPLE_DATA));
  t.not(result, null);
});

test('inferObject', t => {
  const defualtInfer = generateParamsArrayFromInferObject(INSTANCE_TYPES);
  const EXPECTED_INFER_DEFAULT = [
    { min: 0, max: 0, mean: 0 },
    { frequencies: [] },
    { min: 0, max: 0, mean: 0 }
  ];

  t.deepEqual(EXPECTED_INFER_DEFAULT, defualtInfer);
});
