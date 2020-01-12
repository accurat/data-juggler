import test from 'ava';
import dayjs from 'dayjs';
import { toNumber, toString } from 'lodash'
import { FormatterObject, autoInferenceType } from '../dataInference';
import { dataJuggler } from '../..';
import { InferObject } from '../../types/types';
import { parseDates } from '../parse';

// ----------------------------------------------------------

test('Juggler with custom formatter', t => {
  // dataset
  const dataset = [
    { a: 3, b: 'mom', d: '2018-02-20' },
    { a: 2, b: 'dad', c: 2, d: '2018-03-20' },
    { a: 1.5, b: 'cousin', c: 3, d: '2019-06-22' },
    { a: 1, b: 'dad', c: 4, d: '2029-02-20' }
  ]
  type Datum = typeof dataset[0]
  const instanceTypes: InferObject<Datum> = {
    a: 'continuous',
    b: 'categorical',
    c: 'continuous',
    d: 'date'
  }

  const formatter: FormatterObject<Datum> = {
    a: [{
        formatter: d => toString(toNumber(d.raw) * 3),
        name: 'timesthree'
      }],
    d: [{
        formatter: d => d.dateTime && dayjs.isDayjs(d.dateTime) ? d.dateTime.format('YYYY') : '',
        name: 'year'
      }]
  };

  const { data: formattedJuggledData } = dataJuggler(dataset, { types: instanceTypes, formatter });
  
  // test
  t.deepEqual({ raw: 3, scaled: 1, logScale: 1, timesthree: '9' }, formattedJuggledData[0].a);
  console.log(formattedJuggledData[0].d.year);
  t.deepEqual('2018', formattedJuggledData[0].d.year);
});

// ----------------------------------------------------------


test('Juggler with custom formatter with min and min parameters', t => {
  const dataset = [{ a: 2 }, { a: 3 }, { a: 4 }];
  type Datum = typeof dataset[0]

  const formatter: FormatterObject<Datum> = {
    a: [
      {
        name: 'double',
        formatter: d => toString(toNumber(d.raw) * 2)
      },
      {
        name: 'boundaries',
        formatter: (d, moments) =>
          `${moments.min} < ${d.raw} < ${moments.max}`
      }
    ]
  }

  const { data } = dataJuggler(dataset, { formatter });

  t.deepEqual(data[0].a.double, '4');
  t.deepEqual(data[1].a.boundaries, '2 < 3 < 4');
});


// ----------------------------------------------------------

test('Juggler with parser', t => {
  // dataset
  const dataset = [
    { timestamp: '2012-02-02' }, 
    { timestamp: '2012-02-03' }
  ];
  
  // test
  const parsedDataset = parseDates(dataset, autoInferenceType(dataset), {
    timestamp: (day: string) => dayjs(day, 'YYYY-MM-DD').unix()
  });
  t.deepEqual(parsedDataset[0].timestamp, dayjs(dataset[0].timestamp, 'YYYY-MM-DD').unix());

  const { data: correctlyParsedData } = dataJuggler(dataset, {
    parser: { timestamp: (day: string) => dayjs(day, 'YYYY-MM-DD').unix()  }
  });

  const { data: wronglyParsedData } = dataJuggler(dataset, {
    parser: { timestamp: (day: string) => dayjs(day, 'MM-DD-YYYY').unix() }
  });

  t.deepEqual(correctlyParsedData[0].timestamp.raw, dayjs(dataset[0].timestamp, 'YYYY-MM-DD').unix());
  t.deepEqual(wronglyParsedData[0].timestamp.raw, null);
});

// ----------------------------------------------------------

test('Infer continuous column with almost all null', t => {
  const dataset = [{ a: null }, { a: null }, { a: 3 }];

  const { types } = dataJuggler(dataset);
  t.deepEqual(types.a, 'continuous');
});

// ----------------------------------------------------------

test('Infer categorical column with almost all null', t => {
  const dataset = [{ a: null }, { a: null }, { a: 'hi' }];

  const { types } = dataJuggler(dataset);
  t.deepEqual(types.a, 'categorical');
});

// ----------------------------------------------------------

test('Infer date column with almost all null, should be not date!', t => {
  const dataset = [{ a: null }, { a: null }, { a: '12-02-2018' }];

  const { types } = dataJuggler(dataset);
  t.notDeepEqual(types.a, 'date');
});

// ----------------------------------------------------------

test('Infer date column, should be date!', t => {
  const dataset = [{ a: '2018-02-02' }, { a: '2018-03-09' }, { a: '2018-03-22' }];

  const { data, types } = dataJuggler(dataset);
  t.deepEqual(types.a, 'date');
  t.deepEqual(data[0].a.raw, 1517526000);
});

// ----------------------------------------------------------

test('Infer date column with custom parser, should be date!', t => {
  const dataset = [{ a: '13/02/2018' }, { a: '15/02/2018' }, { a: '12/02/2018' }];

  const { types } = dataJuggler(dataset, {
    parser: { a: (x: string) => dayjs(x, 'DD/MM/YYYY').unix() }
  });

  t.deepEqual(types.a, 'date');
});

// ----------------------------------------------------------

test('Test iso date', t => {
  const dataset = [
    { timestamp: '2017-06-25', value: 60.55 },
    { timestamp: '2017-06-26', value: 39.12 },
    { timestamp: '2017-06-27', value: 6.06 }
  ];

  const { data } = dataJuggler(dataset);
  t.deepEqual(data[0].timestamp.iso, '25-06-2017');
});

// ----------------------------------------------------------

test('Juggler with dates moments (string dates and timestamps)', t => {
  const dataset = [
    { timestamp: '2017-06-25', unix: 1557303452 },
    { timestamp: '2017-06-26', unix: 1557303352 },
    { timestamp: '2017-06-27', unix: 1557303552 }
  ];

  const { moments, types, data } = dataJuggler(dataset, {
    types: { unix: 'date', timestamp: 'date' }
  });

  t.deepEqual(types, { timestamp: 'date', unix: 'date' });
  t.deepEqual((moments.timestamp).max, dayjs('2017-06-27').unix());
  t.deepEqual(data[0].timestamp.scaled, 0);
});

// ----------------------------------------------------------

test('Juggler with null values', t => {
  const dataset = [
    { timestamp: '2017-06-25', v: 12 },
    { timestamp: '2017-06-26', v: null },
    { timestamp: '2017-06-27', v: 13 }
  ];

  const { data } = dataJuggler(dataset);

  t.deepEqual(data[0].v.scaled, 0);
  t.deepEqual(data[1].v.scaled, null);
  t.deepEqual(data[2].v.scaled, 1);
});

// ----------------------------------------------------------

test('Juggler with scaling functions', t => {
  const d = [
    { timestamp: '2017-06-25', v: 12, x: 0 },
    { timestamp: '2017-06-26', v: null, x: 1 },
    { timestamp: '2017-06-27', v: 13, x: 2 }
  ];

  const infer = {
    timestamp: 'date',
    v: 'continuous',
    x: 'continuous'
  } as const;

  const { data, types, scalers } = dataJuggler(d, { types: infer });

  t.deepEqual(types.timestamp, 'date');
  t.deepEqual(types.v, 'continuous');

  t.deepEqual(data[0].timestamp.scaled, 0);
  t.deepEqual(data[0].v.scaled, 0);
  t.deepEqual(data[0].x.scaled, 0);

  const rescaleX = scalers.x(0, 4);
  t.deepEqual(rescaleX(data[2].x.scaled), 0.5);
  t.deepEqual(rescaleX(data[0].x.scaled), 0);
  t.deepEqual(rescaleX(2), 1);

  const rescaleV = scalers.v(0, 13);
  t.deepEqual(rescaleV(data[2].v.scaled), 1);
});

// ----------------------------------------------------------

test('Juggler with log scale', t => {
  const d = [
    { timestamp: '2017-06-25', v: 12, x: 0 },
    { timestamp: '2017-06-26', v: null, x: 1 },
    { timestamp: '2017-06-27', v: 13, x: 2 }
  ];

  const { data } = dataJuggler(d);

  t.deepEqual(data[0].x.logScale, -Infinity);
  t.true(data[1].x.logScale !== null && data[1].x.logScale > 0.93 && data[1].x.logScale < 0.95);
  t.deepEqual(data[2].x.logScale, 1);
});

// ----------------------------------------------------------

test('Test frequencies for mixed data (string, number, boolean, date)', t => {
  const dataset = [
    { mix: 'cat' },
    { mix: 'cat' },
    { mix: 'monkey' },
    { mix: 'llama5' },
    { mix: '3mouse' },
    { mix: '1 bear' },
    { mix: '2017-06-25' },
    { mix: 5 },
    { mix: 10 },
    { mix: false },
  ];

  const { moments, types } = dataJuggler(dataset);

  t.deepEqual(types.mix, 'categorical')
  t.deepEqual((moments.mix).frequencies, { 
    'cat': 2, 
    'monkey': 1, 
    'llama5': 1, 
    '3mouse': 1, 
    '1 bear': 1, 
    '2017-06-25': 1, 
    '5': 1, 
    '10': 1, 
    'false': 1 
  })

})

// ----------------------------------------------------------

test('Test frequencies for bool data', t => {
  const dataset = [
    { bool: true },
    { bool: false },
    { bool: true },
    { bool: true },
  ];

  const { moments, types } = dataJuggler(dataset);

  t.deepEqual(types.bool, 'categorical')
  t.deepEqual((moments.bool).frequencies, { 'true': 3, 'false': 1 })

})

// ----------------------------------------------------------

test('Test type cat-1 is not a date', t => {
  const dataset = [
    { cat: 'cat-1', date: '2017-06-25' },
];

  const { types } = dataJuggler(dataset);

  t.deepEqual(types.cat, 'categorical')
  t.deepEqual(types.date, 'date')

})

// ----------------------------------------------------------