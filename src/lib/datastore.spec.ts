// tslint:disable:no-expression-statement
// tslint:disable:no-console
import test from 'ava';
import {
  calculateMoments,
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

test('inferObject', t => {
  const defaultMoments = generateParamsArrayFromInferObject(INSTANCE_TYPES);

  const EXPECTED_DEFAULT_MOMENTS: MomentsObject = {
    a: { min: null, max: null, sum: 0 },
    b: { frequencies: {} },
    c: { min: null, max: null, sum: 0 }
  };

  t.deepEqual(EXPECTED_DEFAULT_MOMENTS, defaultMoments);
});

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

  const moments = calculateMoments(filledSample, INSTANCE_TYPES);
  const EXPECTED_MOMENTS: MomentsObject = {
    a: { min: 2, max: 3, sum: 5 },
    b: { frequencies: { mamma: 1, papà: 1 } },
    c: { min: 2, max: 2, sum: 2 }
  };

  // Keys array tests
  t.notThrows(() => getKeysArray(FIRST_SAMPLE_DATA));
  t.deepEqual(EXPECTED_KEYS_ARRAY, keysArray);

  // Filled array tests
  t.notThrows(() => populateNullData(FIRST_SAMPLE_DATA, keysArray));
  t.deepEqual(EXPECTED_FILLED_SAMPLE, filledSample);

  // Moments test
  t.notThrows(() => calculateMoments(filledSample, INSTANCE_TYPES));
  t.deepEqual(EXPECTED_MOMENTS, moments);

  t.notThrows(() => dataStoreFactory(FIRST_SAMPLE_DATA));
  t.not(result, null);
});
