// tslint:disable:no-expression-statement
// tslint:disable:no-console
import test from 'ava';
import dayjs from 'dayjs';
import { omit, range, toNumber, toString } from 'lodash';
import fetch from 'node-fetch'
import { dataJuggler } from '..';
import { InferObject, MomentsObject } from '../types/types';
import { autoInferenceType, FormatterObject } from './utils/dataInference';
// ParseObjectType
import {
  computeMoments,
  generateDefaultMoments,
  populateNullData
} from './utils/stats'

import { parseDates } from './parse';
import { doKeysMatch } from './utils/parseObjects'

const DEFAULT_DATE = 1552563578
const URL = 'https://gist.githubusercontent.com/NoFishLikeIan/fa2d6511d589b4871370743a4ea74980/raw/3dc4ef72166e07dae250b7a7063e544139f8cbd8/mock_data.json'
const DATES_D = range(4).map(i => DEFAULT_DATE - i * 100)


// tslint:disable-next-line:no-object-literal-type-assertion
const dataTypes = {
  city: 'categorical',
  dateOfMeasure: 'date',
  gender: 'categorical',
  height: 'continuous',
  id: 'categorical',
  weight: 'continuous',
} as const

// tslint:disable-next-line:typedef
export async function fetchData(url: string) {
  const result = await fetch(url)
  const data = await result.json()

  return data
}


const FIRST_SAMPLE_DATA = [
  { a: 3, b: 'mamma', d: DATES_D[0] },
  { a: 2, b: 'papà', c: 2, d: DATES_D[1] },
  { a: 1.5, b: 'cugino', c: 3, d: DATES_D[2] },
  { a: 1, b: 'papà', c: 4, d: DATES_D[3] }
];

type Datum = typeof FIRST_SAMPLE_DATA[0]

const WITH_DATE_SAMPLE_DATA = [
  { a: 3, b: 'mamma', d: '2018-02-20' },
  { a: 2, b: 'papà', c: 2, d: '2018-03-20' },
  { a: 1.5, b: 'cugino', c: 3, d: '2019-06-22' },
  { a: 1, b: 'papà', c: 4, d: '2029-02-20' }
]

const INSTANCE_TYPES: InferObject<Datum> = {
  a: 'continuous',
  b: 'categorical',
  c: 'continuous',
  d: 'date',
};

const { data: juggledData } = dataJuggler(FIRST_SAMPLE_DATA, { passedInferTypes: INSTANCE_TYPES }); // Better typing for this

// -------
test('autoinfer', t => {
  t.notThrows(() => autoInferenceType(WITH_DATE_SAMPLE_DATA))

  const inferedType = autoInferenceType(WITH_DATE_SAMPLE_DATA)
  t.deepEqual(inferedType, INSTANCE_TYPES)
})

test('momets', t => {
  const defaultMoments = generateDefaultMoments(INSTANCE_TYPES);

  const EXPECTED_DEFAULT_MOMENTS: MomentsObject<Datum> = {
    a: { min: null, max: null, sum: 0 },
    b: { frequencies: {} },
    c: { min: null, max: null, sum: 0 },
    d: { min: null, max: null }
  };

  t.deepEqual(EXPECTED_DEFAULT_MOMENTS, defaultMoments);
});

test('dataStore', t => {

  const filledSample = populateNullData(FIRST_SAMPLE_DATA);
  const EXPECTED_FILLED_SAMPLE = [
    { a: 3, b: 'mamma', c: null, d: DATES_D[0] },
    { a: 2, b: 'papà', c: 2, d: DATES_D[1] },
    { a: 1.5, b: 'cugino', c: 3, d: DATES_D[2] },
    { a: 1, b: 'papà', c: 4, d: DATES_D[3] }
  ];

  const moments = computeMoments(filledSample, INSTANCE_TYPES);
  const EXPECTED_MOMENTS: MomentsObject<Datum> = {
    a: { min: 1, max: 3, sum: 7.5 },
    b: { frequencies: { mamma: 1, papà: 2, cugino: 1 } },
    c: { min: 2, max: 4, sum: 9 },
    d: { min: DATES_D[3], max: DATES_D[0] }
  };

  // Filled array tests
  t.notThrows(() => populateNullData(FIRST_SAMPLE_DATA));
  t.deepEqual(EXPECTED_FILLED_SAMPLE, filledSample);

  // Moments test
  t.notThrows(() => computeMoments(filledSample, INSTANCE_TYPES));
  t.deepEqual(EXPECTED_MOMENTS, moments);

  const firstDatum = juggledData[0]

  t.deepEqual(firstDatum.a, { raw: 3, scaled: 1 });

  const DATETIME = dayjs.unix(DATES_D[0]);
  const expectedDFirst = {
    dateTime: DATETIME,
    isValid: true,
    iso: DATETIME.format('DD-MM-YYYY'),
    raw: DATES_D[0],
    scaled: 1
  };

  t.deepEqual(firstDatum.d, expectedDFirst);
});

test('Custom formatter', t => {


  const formatter: FormatterObject<Datum> = {
    a: [
      {
        formatter: datum => toString(toNumber(datum.raw) * 3),
        name: 'timesthree'
      }
    ],
    d: [
      {
        formatter: datum =>
          datum.dateTime && dayjs.isDayjs(datum.dateTime) // issue with instanceof for dayjs
            ? datum.dateTime.format('YYYY')
            : '',
        name: 'year'
      }
    ]
  };

  const { data: formattedJuggledData } = dataJuggler(FIRST_SAMPLE_DATA, { passedInferTypes: INSTANCE_TYPES, formatter })
     // Better typing for this


  const EXPECTED_YEAR = '2019';

  const EXPECTED_A = { raw: 3, scaled: 1, timesthree: '9' };

  const firstInstanceOfA = formattedJuggledData[0].a;
  const firstDateInstanceNormal = formattedJuggledData[0].d;

  t.deepEqual(EXPECTED_YEAR, firstDateInstanceNormal.year);
  t.deepEqual(EXPECTED_A, firstInstanceOfA);
});


test("Fetching", async t => {
  // tslint:disable-next-line:only-arrow-functions
  t.notThrows(async function(): Promise<void> {fetchData(URL)})

  const data = await fetchData(URL)
  const matchingKeys = doKeysMatch(data, dataTypes)
  const unmatchingKeys = !doKeysMatch(data, omit(dataTypes, 'city'))
  t.true(matchingKeys)
  t.true(unmatchingKeys)
  t.notThrows(()=> dataJuggler(data, { passedInferTypes: dataTypes }))
  t.throws(() => dataJuggler(data, { passedInferTypes: omit(dataTypes, 'city') }))
})

test('parseDates', t => {
  const dates = [{'d': '2012-12-22'}, {'d': '2013-12-22'}]
  t.notThrows(() => parseDates(dates, autoInferenceType(dates)))
  const inferObj = autoInferenceType(dates)
  const parsedDates = parseDates(dates, inferObj)

  t.deepEqual(parsedDates[0].d, 1356130800)
})

test('autoinferreddata', t => {
  t.notThrows(() => dataJuggler(WITH_DATE_SAMPLE_DATA))
  const { data } = dataJuggler(WITH_DATE_SAMPLE_DATA)
  const djs = dayjs('2018-02-20')
  const expectedDFirst = {
    dateTime: djs,
    isValid: true,
    iso: djs.format('DD-MM-YYYY'),
    raw: djs.unix(),
    scaled: 0
  };
  t.deepEqual(data[0].d, expectedDFirst)

})