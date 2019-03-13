// tslint:disable:no-expression-statement
// tslint:disable:no-console
import test from 'ava';
import dayjs from 'dayjs';
import { range } from 'lodash';
import {
  calculateMoments,
  dataStoreFactory,
  generateParamsArrayFromInferObject,
  getKeysArray,
  populateNullData
} from './datastore';

const DEFAULT_DATE = 1552397833139;
const DATES_D = range(4).map(i => DEFAULT_DATE - i * 10000);

const FIRST_SAMPLE_DATA: GenericDatum[] = [
  { a: 3, b: 'mamma', d: DATES_D[0] },
  { a: 2, b: 'papà', c: 2, d: DATES_D[1] },
  { a: 1.5, b: 'cugino', c: 3, d: DATES_D[2] },
  { a: 1, b: 'papà', c: 4, d: DATES_D[3] }
];
const INSTANCE_TYPES: InferObject = {
  a: 'continuous',
  b: 'categorical',
  c: 'continuous',
  d: 'date'
};

test('inferObject', t => {
  const defaultMoments = generateParamsArrayFromInferObject(INSTANCE_TYPES);

  const EXPECTED_DEFAULT_MOMENTS: MomentsObject = {
    a: { min: null, max: null, sum: 0 },
    b: { frequencies: {} },
    c: { min: null, max: null, sum: 0 },
    d: { min: null, max: null }
  };

  t.deepEqual(EXPECTED_DEFAULT_MOMENTS, defaultMoments);
});

test('dataStore', t => {
  const keysArray = getKeysArray(FIRST_SAMPLE_DATA);
  const EXPECTED_KEYS_ARRAY = ['a', 'b', 'c', 'd'];

  const filledSample = populateNullData(FIRST_SAMPLE_DATA, keysArray);
  const EXPECTED_FILLED_SAMPLE = [
    { a: 3, b: 'mamma', c: null, d: DATES_D[0] },
    { a: 2, b: 'papà', c: 2, d: DATES_D[1] },
    { a: 1.5, b: 'cugino', c: 3, d: DATES_D[2] },
    { a: 1, b: 'papà', c: 4, d: DATES_D[3] }
  ];

  const Store = dataStoreFactory('hello', FIRST_SAMPLE_DATA, INSTANCE_TYPES); // Better typing for this
  const a = Store.a;
  const d = Store.d;

  const moments = calculateMoments(filledSample, INSTANCE_TYPES);
  const EXPECTED_MOMENTS: MomentsObject = {
    a: { min: 1, max: 3, sum: 7.5 },
    b: { frequencies: { mamma: 1, papà: 2, cugino: 1 } },
    c: { min: 2, max: 4, sum: 9 },
    d: { min: DATES_D[3], max: DATES_D[0] }
  };

  // Keys array tests
  t.notThrows(() => getKeysArray(FIRST_SAMPLE_DATA));
  EXPECTED_KEYS_ARRAY.map(key => t.true(keysArray.includes(key)));

  // Filled array tests
  t.notThrows(() => populateNullData(FIRST_SAMPLE_DATA, keysArray));
  t.deepEqual(EXPECTED_FILLED_SAMPLE, filledSample);

  // Moments test
  t.notThrows(() => calculateMoments(filledSample, INSTANCE_TYPES));
  t.deepEqual(EXPECTED_MOMENTS, moments);

  t.notThrows(() =>
    dataStoreFactory('hello', FIRST_SAMPLE_DATA, INSTANCE_TYPES)
  );
  t.deepEqual(a, [
    { raw: 3, scaled: 1 },
    { raw: 2, scaled: 0.5 },
    { raw: 1.5, scaled: 0.25 },
    { raw: 1, scaled: 0 }
  ]);

  const firstSampleDatum = {
    dateTime: dayjs(1552397833139),
    isValid: true,
    iso: '2019-03-12T14:37:13+01:00',
    raw: 1552397833139,
    scaled: 1
  };

  t.deepEqual(firstSampleDatum, d[0]);
});
