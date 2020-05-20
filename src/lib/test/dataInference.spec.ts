import test from 'ava';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import {
  autoInferenceType,
  detectValue,
  selectTypeFromFrequencies,
  isFormatDateValid
} from '../dataInference';
import { InferObject } from '../../types/types';

// ----------------------------------------------------------

test('autoInferenceType', t => {
  const dataset = [
    { a: 3, b: 'mom', d: '2018-02-20' },
    { a: 2, b: 'dad', c: 2, d: '2018-03-20' },
    { a: 1.5, b: 'cousin', c: 3, d: '2019-06-22' },
    { a: 1, b: 'dad', c: 4, d: '2029-02-20' }
  ];

  type Datum = typeof dataset[0];
  const instanceTypes: InferObject<Datum> = {
    a: 'continuous',
    b: 'categorical',
    c: 'continuous',
    d: 'date'
  };

  t.notThrows(() => autoInferenceType(dataset, {}));
  const inferedType = autoInferenceType(dataset, {});
  t.deepEqual(inferedType, instanceTypes);
});

// ----------------------------------------------------------

test('Detect single date', t => {
  const date = '17-02-2019';

  const parserFn = (p: string) => dayjs(p, 'DD-MM-YYYY').unix();
  const wrong = detectValue(date, i => i);
  const right = detectValue(date, parserFn);

  t.true(dayjs(parserFn(date) * 1000).isValid());
  t.deepEqual(wrong, 'date');
  t.deepEqual(right, 'date');
});

// ----------------------------------------------------------

test('Frequencies date type object', t => {
  const frequencies = {
    categorical: 0,
    continuous: 0,
    date: 3,
    unknown: 0
  };

  const datumType = selectTypeFromFrequencies(frequencies);
  t.deepEqual(datumType, 'date');
});

// ----------------------------------------------------------

test('isDateValid', t => {
  const rightParser = (d: string) => dayjs(d, 'DD-MM-YYYY').unix();
  const wrongParser = (d: string) => dayjs(d, 'MM-DD-YYYY').unix();
  const defaultParser = (d: string) => dayjs(d, 'YYYY-MM-DD').unix();

  t.is(isFormatDateValid('1900-10-23'), true);
  t.is(isFormatDateValid('1942-11-1'), true);
  t.is(isFormatDateValid('2002-5-15'), true);
  t.is(isFormatDateValid('2000-01-10'), true);

  t.is(isFormatDateValid('2020-05-01 09:35'), true);
  t.is(isFormatDateValid('2020-05-01 09:35Z'), true);
  t.is(isFormatDateValid('2020-05-01T09:35'), true);
  t.is(isFormatDateValid('2020-05-01T09:35Z'), true);

  t.is(isFormatDateValid('2020-05-01 09:35:20'), true);
  t.is(isFormatDateValid('2019-01-15 13:12:29'), true);
  t.is(isFormatDateValid('2020-05-01 09:35:20Z'), true);
  t.is(isFormatDateValid('2020-05-01T09:35:20'), true);
  t.is(isFormatDateValid('2020-05-01T09:35:20Z'), true);

  t.is(isFormatDateValid('2020-05-01 09:35:20.000'), true);
  t.is(isFormatDateValid('2020-05-01 09:35:20.000Z'), true);
  t.is(isFormatDateValid('2020-05-01T09:35:20.000'), true);
  t.is(isFormatDateValid('2020-05-01T09:35:20.000Z'), true);
  t.is(isFormatDateValid('2020-05-13T08:24:45.701Z'), true);
  t.is(isFormatDateValid(new Date().toISOString()), true);

  t.is(isFormatDateValid('2016-01-01 11:31:23 AM'), true);
  t.is(isFormatDateValid('2016-01-01 11:31:23 am'), true);
  t.is(isFormatDateValid('2016-01-01 23:31:23 pm'), true);


  t.is(isFormatDateValid('17-02-2019', rightParser), true);
  t.is(isFormatDateValid('17-02-2019', wrongParser), true); // this shouldn't be right but we assume that if the user has written a parser, then the dates are in the correct format
  t.is(isFormatDateValid('17-02-2019', defaultParser), true); // this shouldn't be right but we assume that if the user has written a parser, then the dates are in the correct format

  // t.is(isFormatDateValid('2013-02-08 09:00:00+01:00'), true);
  // t.is(isFormatDateValid('2013-02-08 09:00:00+01:30'), true);
  // t.is(isFormatDateValid('2013-02-08 09:00:00+0100'), true);
  // t.is(isFormatDateValid('2013-02-08 09:00:00-01:00'), true);
  // t.is(isFormatDateValid('2013-02-08 09:00:00-0100'), true);

  t.is(isFormatDateValid('cat-1'), false);
  t.is(isFormatDateValid('2017-02-30'), false); 
  t.is(isFormatDateValid('2020-04-31'), false); 
  t.is(isFormatDateValid('2018-02-29'), false); 
  t.is(isFormatDateValid('2008-09-31'), false);
  t.is(isFormatDateValid('17-02-2019'), false);
  t.is(isFormatDateValid('0000-01-01'), false);
  t.is(isFormatDateValid('0100-10-23'), false);
  t.is(isFormatDateValid('2009-23-5'), false);
  t.is(isFormatDateValid('1942-11-0'), false);
  t.is(isFormatDateValid('1942-00-25'), false);
  t.is(isFormatDateValid('2000-10-00'), false);
  t.is(isFormatDateValid('2019-01-15 24:00:00'), false);
  t.is(isFormatDateValid('2019-01-15 23:60:00'), false);
  t.is(isFormatDateValid('2019-01-15 23:59:60'), false);
  t.is(isFormatDateValid('2019-01-15 13:12:29.0'), false);
  t.is(isFormatDateValid('2020-05-01 01:01:01.12'), false);
  t.is(isFormatDateValid('2016-01-01 11:31:23 PM'), false);
  t.is(isFormatDateValid('2020-05-01 00'), false);
  t.is(isFormatDateValid('2020-02-31'), false);
  t.is(isFormatDateValid('2016/01/01'), false);
  t.is(isFormatDateValid('2020-05-01 01:60:00'), false);
  t.is(isFormatDateValid('2020-05-01 60'), false);
  t.is(isFormatDateValid('2020-05-01 '), false);
  t.is(isFormatDateValid(new Date().toString()), false);
  t.is(isFormatDateValid('Wed May 13 2020 10:25:23 GMT+0200 (Central European Summer Time)'), false);
});

// ----------------------------------------------------------
