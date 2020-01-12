import test from 'ava';
import dayjs from 'dayjs';
import { generateDefaultMoments, populateNullData, computeMoments } from '../stats'
import { InferObject, MomentsObject } from '../../types/types';
import { dateToTimestamp}  from '../dateUtils'
import { dataJuggler } from '../..';

// ----------------------------------------------------------

test('generateDefaultMoments', t => {
  const datasetWithStringDates = [
    { a: 3, b: 'mom', d: '2018-02-20' },
    { a: 2, b: 'dad', c: 2, d: '2018-03-20' },
    { a: 1.5, b: 'cousin', c: 3, d: '2019-06-22' },
    { a: 1, b: 'dad', c: 4, d: '2029-02-20' }
  ]
  type Datum = typeof datasetWithStringDates[0]
  const instanceTypes: InferObject<Datum> = {
    a: 'continuous',
    b: 'categorical',
    c: 'continuous',
    d: 'date'
  }

  const defaultMoments = generateDefaultMoments(instanceTypes);
  const expectedDefaultMoments: MomentsObject<Datum> = {
    a: { min: null, max: null, sum: 0, frequencies: {} },
    b: { min: null, max: null, sum: 0, frequencies: {} },
    c: { min: null, max: null, sum: 0, frequencies: {} },
    d: { min: null, max: null, sum: 0, frequencies: {} }
  };
  t.deepEqual(expectedDefaultMoments, defaultMoments);
});

// ----------------------------------------------------------

test('fns', t => {
  // dataset
  const dataset = [
    { a: 3, b: 'mom', d: dateToTimestamp('2018-02-20') },
    { a: 2, b: 'dad', c: 2, d: dateToTimestamp('2018-03-20') },
    { a: 1.5, b: 'cousin', c: 3, d: dateToTimestamp('2019-06-22') },
    { a: 1, b: 'dad', c: 4, d: dateToTimestamp('2029-02-20') }
  ]
  type Datum = typeof dataset[0]
  const instanceTypes: InferObject<Datum> = {
    a: 'continuous',
    b: 'categorical',
    c: 'continuous',
    d: 'date'
  }
  const { data: juggledData } = dataJuggler(dataset, { types: instanceTypes });

  // test
  const filledDataset = populateNullData(dataset);
  const expectedFilledDataset = [
    { a: 3, b: 'mom', c: null, d: dateToTimestamp('2018-02-20') },
    { a: 2, b: 'dad', c: 2, d: dateToTimestamp('2018-03-20') },
    { a: 1.5, b: 'cousin', c: 3, d: dateToTimestamp('2019-06-22') },
    { a: 1, b: 'dad', c: 4, d: dateToTimestamp('2029-02-20') }
  ];
  t.notThrows(() => populateNullData(dataset));
  t.deepEqual(expectedFilledDataset, filledDataset);

  const moments = computeMoments(filledDataset, instanceTypes);
  const expectedMoment: MomentsObject<Datum> = {
    a: { min: 1, max: 3, sum: 7.5, frequencies: {} },
    b: { min: null, max: null, sum: 0, frequencies: { mom: 1, dad: 2, cousin: 1 }},
    c: { min: 2, max: 4, sum: 9, frequencies: {} },
    d: { min: dataset[0].d, max: dataset[3].d, sum: 0, frequencies: {} }
  };
  t.notThrows(() => computeMoments(filledDataset, instanceTypes));
  t.deepEqual(expectedMoment, moments);

  const firstJuggledDatum = juggledData[0];
  t.deepEqual(firstJuggledDatum.a, { 
    raw: 3, 
    scaled: 1, 
    logScale: 1 
  });
  t.deepEqual(firstJuggledDatum.d, {
    raw: dataset[0].d, 
    scaled: 0, 
    logScale: 0,
    iso: '19-11-50107',
    isValid: true,
    dateTime: dayjs.unix(dataset[0].d)
  })
});

// ----------------------------------------------------------
