// tslint:disable:no-expression-statement
// tslint:disable:no-console
import test from 'ava';
// import { scaleLinear } from 'd3-scale';
import dayjs from 'dayjs';
import { range } from 'lodash';
import { dataJuggler } from '..';
import { GenericDatum } from './utils/dataInference';
// ParseObjectType
import {
  calculateMoments,
  generateParamsArrayFromInferObject,
  getKeysArray,
  populateNullData
} from './utils/stats';

const DEFAULT_DATE = 1552563578;
const DATES_D = range(4).map(i => DEFAULT_DATE - i * 100);

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

  const juggledData = dataJuggler(FIRST_SAMPLE_DATA, INSTANCE_TYPES); // Better typing for this

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

  t.deepEqual(juggledData[0].a, [
    { raw: 3, scaled: 1 },
    { raw: 2, scaled: 0.5 },
    { raw: 1.5, scaled: 0.25 },
    { raw: 1, scaled: 0 }
  ]);
  const DATETIME = dayjs.unix(DATES_D[0]);
  const firstSampleDatum = {
    dateTime: DATETIME,
    isValid: true,
    iso: DATETIME.format('DD-MM-YYYY'),
    raw: DATES_D[0],
    scaled: 1
  };

  t.deepEqual(firstSampleDatum, d[0]);
});

// test('Custom formatter', t => {
//   const formatter: ParseObjectType = {
//     a: [
//       {
//         formatter: (datum, stats) => {
//           return datum.raw && typeof datum.raw === 'number' && stats
//             ? scaleLinear()
//                 .domain([0, stats.max || 1])
//                 .range([0, 0.5])(datum.raw)
//             : null;
//         },
//         name: 'rescaled'
//       },
//       {
//         formatter: datum =>
//           datum.raw && typeof datum.raw === 'number' ? datum.raw * 3 : null,
//         name: 'timesthree'
//       }
//     ],
//     d: [
//       {
//         formatter: datum =>
//           datum.dateTime && dayjs.isDayjs(datum.dateTime) // issue with instanceof for dayjs
//             ? datum.dateTime.format('YYYY')
//             : null,
//         name: 'year'
//       }
//     ]
//   };

//   const dataStore = dataStoreFactory(
//     'dataStore',
//     FIRST_SAMPLE_DATA,
//     INSTANCE_TYPES,
//     formatter
//   );

//   const EXPECTED_YEAR = '2019';

//   const EXPECTED_A = { raw: 3, scaled: 1, timesthree: 9, rescaled: 0.5 };

//   const firstInstanceOfA = dataStore.data[0].a;
//   const firstDateInstanceWithGetter = dataStore.d[0];
//   const firstDateInstanceNormal = dataStore.data[0].d;
//   t.notThrows(() =>
//     dataStoreFactory('dataStore', FIRST_SAMPLE_DATA, INSTANCE_TYPES, formatter)
//   );

//   t.deepEqual(firstDateInstanceNormal, firstDateInstanceWithGetter);
//   t.deepEqual(EXPECTED_YEAR, firstDateInstanceNormal.year);
//   t.deepEqual(EXPECTED_A, firstInstanceOfA);
// });
