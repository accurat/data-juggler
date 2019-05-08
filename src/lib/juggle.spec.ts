// tslint:disable:no-expression-statement
// tslint:disable:no-console
// tslint:disable:ordered-imports
import test from 'ava';
import dayjs from 'dayjs';
import { isNumber , range, toNumber, toString, isNaN  } from 'lodash';
import fetch from 'node-fetch';
import { dataJuggler } from '..';
import { InferObject, MomentsObject } from '../types/types';
import { autoInferenceType, FormatterObject, detectValue, selectTypeFromFrequencies } from './utils/dataInference';
// ParseObjectType
import {
  computeMoments,
  generateDefaultMoments,
  populateNullData
} from './utils/stats';

import { parseDates } from './parse';

// tslint:disable-next-line:no-submodule-imports
import CustomParseFormat from 'dayjs/plugin/customParseFormat' // load on demand
import { conditionalValueMap } from './utils/parseObjects';
// tslint:disable-next-line:no-expression-statement
dayjs.extend(CustomParseFormat) // use plugin

const DEFAULT_DATE = 1552563578;
// const URL =
//   'https://gist.githubusercontent.com/NoFishLikeIan/fa2d6511d589b4871370743a4ea74980/raw/3dc4ef72166e07dae250b7a7063e544139f8cbd8/mock_data.json';
const DATES_D = range(4).map(i => DEFAULT_DATE - i * 100);

// tslint:disable-next-line:no-object-literal-type-assertion
// const dataTypes = {
//   city: 'categorical',
//   dateOfMeasure: 'date',
//   gender: 'categorical',
//   height: 'continuous',
//   id: 'categorical',
//   weight: 'continuous'
// } as const;

// tslint:disable-next-line:typedef
export async function fetchData(url: string) {
  const result = await fetch(url);
  const data = await result.json();

  return data;
}

const FIRST_SAMPLE_DATA = [
  { a: 3, b: 'mamma', d: DATES_D[0] },
  { a: 2, b: 'papà', c: 2, d: DATES_D[1] },
  { a: 1.5, b: 'cugino', c: 3, d: DATES_D[2] },
  { a: 1, b: 'papà', c: 4, d: DATES_D[3] }
];

type Datum = typeof FIRST_SAMPLE_DATA[0];

const WITH_DATE_SAMPLE_DATA = [
  { a: 3, b: 'mamma', d: '2018-02-20' },
  { a: 2, b: 'papà', c: 2, d: '2018-03-20' },
  { a: 1.5, b: 'cugino', c: 3, d: '2019-06-22' },
  { a: 1, b: 'papà', c: 4, d: '2029-02-20' }
];

const INSTANCE_TYPES: InferObject<Datum> = {
  a: 'continuous',
  b: 'categorical',
  c: 'continuous',
  d: 'date'
};

const { data: juggledData } = dataJuggler(FIRST_SAMPLE_DATA, {
  types: INSTANCE_TYPES
}); // Better typing for this

// -------
test('autoinfer', t => {
  t.notThrows(() => autoInferenceType(WITH_DATE_SAMPLE_DATA, {}));

  const inferedType = autoInferenceType(WITH_DATE_SAMPLE_DATA, {});
  t.deepEqual(inferedType, INSTANCE_TYPES);
});

test('momets', t => {
  const defaultMoments = generateDefaultMoments(INSTANCE_TYPES);

  const EXPECTED_DEFAULT_MOMENTS: MomentsObject<Datum> = {
    a: { min: null, max: null, sum: 0, frequencies: {} },
    b: { min: null, max: null, sum: 0, frequencies: {} },
    c: { min: null, max: null, sum: 0, frequencies: {} },
    d: { min: null, max: null, sum: 0, frequencies: {} },  };

  t.deepEqual(EXPECTED_DEFAULT_MOMENTS, defaultMoments);
});

test('fn', t => {
  const filledSample = populateNullData(FIRST_SAMPLE_DATA);
  const EXPECTED_FILLED_SAMPLE = [
    { a: 3, b: 'mamma', c: null, d: DATES_D[0] },
    { a: 2, b: 'papà', c: 2, d: DATES_D[1] },
    { a: 1.5, b: 'cugino', c: 3, d: DATES_D[2] },
    { a: 1, b: 'papà', c: 4, d: DATES_D[3] }
  ];

  const moments = computeMoments(filledSample, INSTANCE_TYPES);
  const EXPECTED_MOMENTS: MomentsObject<Datum> = {
    a: { min: 1, max: 3, sum: 7.5, frequencies: {} },
    b: { frequencies: { mamma: 1, papà: 2, cugino: 1 }, min: null, max: null, sum: 0 },
    c: { min: 2, max: 4, sum: 9, frequencies: {} },
    d: { min: DATES_D[3], max: DATES_D[0], frequencies: {}, sum: 0 }
  };

  // Filled array tests
  t.notThrows(() => populateNullData(FIRST_SAMPLE_DATA));
  t.deepEqual(EXPECTED_FILLED_SAMPLE, filledSample);

  // Moments test
  t.notThrows(() => computeMoments(filledSample, INSTANCE_TYPES));
  t.deepEqual(EXPECTED_MOMENTS, moments);

  const firstDatum = juggledData[0];

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

  const { data: formattedJuggledData } = dataJuggler(FIRST_SAMPLE_DATA, {
    formatter,
    types: INSTANCE_TYPES
  });
  // Better typing for this

  const EXPECTED_YEAR = '2019';

  const EXPECTED_A = { raw: 3, scaled: 1, timesthree: '9' };

  const firstInstanceOfA = formattedJuggledData[0].a;
  const firstDateInstanceNormal = formattedJuggledData[0].d;

  t.deepEqual(EXPECTED_YEAR, firstDateInstanceNormal.year);
  t.deepEqual(EXPECTED_A, firstInstanceOfA);
});

test('parseDates', t => {
  const dates = [{ d: '2012-12-22' }, { d: '2013-12-22' }];
  t.notThrows(() => parseDates(dates, autoInferenceType(dates, {}), {} ));
  const inferObj = autoInferenceType(dates, {});
  const parsedDates = parseDates(dates, inferObj, {});

  t.deepEqual(parsedDates[0].d, 1356130800);
});

test('Conditional Map', t => {
  const c = conditionalValueMap(
    { 'd': 3, 'b': true},
    (_, v):  v is number => isNumber(v),
    (_, v) => v * 2
  )

  const exp = {'d': 6, 'b': true}
  t.deepEqual(c, exp)
})

test('Custom Parser', t => {
  const types = autoInferenceType(WITH_DATE_SAMPLE_DATA, {})

  const wrongParser = {
    d: (day: string) => dayjs(day, 'DD-MM-YYYY').unix()
  }
  const parsedDates = parseDates(WITH_DATE_SAMPLE_DATA, types, wrongParser)

  const correctParser = {
    d: (day: string) => dayjs(day, 'YYYY-MM-DD').unix()
  }

  const correctParseDates = parseDates(WITH_DATE_SAMPLE_DATA, types, correctParser)

  const incomingWrong = parsedDates[0].d
  const incomingCorrect = correctParseDates[0].d
  t.true(isNaN(incomingWrong))
  t.deepEqual(incomingCorrect, dayjs('2018-02-20').unix())
})

test('juggle with parser', t => {

  const dset = [{timestamp: '2012-02-02'}, {timestamp: '2012-02-03'}]

  const parsed = parseDates(dset, autoInferenceType(dset), { timestamp: (day: string) => dayjs(day, 'YYYY-MM-DD').unix()})

  t.deepEqual(parsed[0].timestamp, dayjs(dset[0].timestamp, 'YYYY-MM-DD').unix())

  const { data: correctlyParsedData } = dataJuggler(dset, {
    parser: {
      timestamp: (day: string) => dayjs(day, 'YYYY-MM-DD').unix()
    }
  })

  const { data: wronglyParsedData } = dataJuggler(dset, {
    parser: {
      timestamp: (day: string) => dayjs(day, 'MM-DD-YYYY').unix()
    }
  })
  t.deepEqual(correctlyParsedData[0].timestamp.raw, dayjs(dset[0].timestamp, 'YYYY-MM-DD').unix())
  t.deepEqual(wronglyParsedData[0].timestamp.raw, null)
})

test('Infer cont column with almost all null', t => {
  const d = [{a: null}, {a: null}, {a: 3}]
  const { types } = dataJuggler(d)
  t.deepEqual(types.a, 'continuous')
})

test('Infer categorical column with almost all null', t => {
  const d = [{a: null}, {a: null}, {a: 'ciao'}]
  const { types } = dataJuggler(d)
  t.deepEqual(types.a, 'categorical')
})

test('Infer date column with almost all null, should be not date!', t => {
  const d = [{a: null}, {a: null}, {a: '12-02-2018'}]
  const { types } = dataJuggler(d)

  t.notDeepEqual(types.a, 'date')
})


// DATES

test('Detect single date', t => {
  const date = '17-02-2019'
  const parserFn = (p: string) => dayjs(p, 'DD-MM-YYYY').unix()
  const wrong = detectValue(date, (i) => i)
  const right = detectValue(date, parserFn)

  t.true(dayjs(parserFn(date) * 1000).isValid())
  t.notDeepEqual(wrong, 'date')
  t.deepEqual(right, 'date')

})

test('Frequencies type object', t => {
  const obj = {
    categorical: 0,
    continuous: 0,
    date: 3,
    unknown: 0
  }

  const dFr = selectTypeFromFrequencies(obj)
  t.deepEqual(dFr, 'date')
})

test('Infer date column, should be date!', t => {
  const d = [{a: '2018-02-02'}, {a: '2018-03-09'}, {a: '2018-03-22'}]


  const { data, types } = dataJuggler(d)


  t.deepEqual(types.a, 'date')
  t.deepEqual(data[0].a.raw, 1517526000)
})

test('Infer date column, with custom parser, should be date!', t => {
  const d = [{a: '13/02/2018'}, {a: '15/02/2018'}, {a: '12/02/2018'}]
  const { types } = dataJuggler(d, { parser: { a: (x: string) => dayjs(x, 'DD/MM/YYYY').unix() } })

  t.deepEqual(types.a, 'date')
})

test('Another date test', t => {
  const d = [{timestamp: "2017-06-25", value: 60.55}, {timestamp: "2017-06-26", value: 39.12}, {timestamp: "2017-06-27", value: 6.06}]
  const { data } = dataJuggler(d)

  t.deepEqual(data[0].timestamp.iso, '25-06-2017')
})

test('Date parser', t => {
  const d = [
    {timestamp: "2017-06-25", unix: 1557303452},
    {timestamp: "2017-06-26", unix: 1557303352},
    {timestamp: "2017-06-27", unix: 1557303552}
  ]

  const parsed = parseDates(d, autoInferenceType(d), {})

  t.deepEqual(parsed[0].timestamp, dayjs(d[0].timestamp).unix())
  t.deepEqual(parsed[0].unix, d[0].unix)
})

test('Date moments', t => {
  const d = [
    {timestamp: "2017-06-25", unix: 1557303452},
    {timestamp: "2017-06-26", unix: 1557303352},
    {timestamp: "2017-06-27", unix: 1557303552}
  ]

  const { moments, types, data } = dataJuggler(d, { types: { unix: 'date', timestamp: 'date' } })

  t.deepEqual(types, { timestamp: 'date', unix: 'date' })
  t.deepEqual((moments.timestamp as any).max, dayjs('2017-06-27').unix())
  t.deepEqual(data[0].timestamp.scaled, 0)
})