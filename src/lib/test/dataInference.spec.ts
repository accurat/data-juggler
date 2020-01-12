import test from 'ava';
import dayjs from 'dayjs';
import { noop } from 'lodash'
import { autoInferenceType, detectValue, selectTypeFromFrequencies, isDateValid } from '../dataInference';
import { InferObject } from '../../types/types';

// ----------------------------------------------------------

test('autoInferenceType', t => {
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
  t.notDeepEqual(wrong, 'date');
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
  const parserFn = (d: string) => dayjs(d, 'DD-MM-YYYY').unix()

  t.is(isDateValid('1900-10-23', noop), true)
  t.is(isDateValid('2002-5-5', noop), true)
  t.is(isDateValid('2008-09-31', noop), true)
  t.is(isDateValid('1600-12-25', noop), true)
  t.is(isDateValid('1942-11-1', noop), true)
  t.is(isDateValid('2000-10-10', noop), true)
  t.is(isDateValid('17-02-2019', parserFn), true)

  t.is(isDateValid('17-02-2019', noop), false)
  t.is(isDateValid('cat-1', noop), false)
  t.is(isDateValid('0000-01-01', noop), false)
  t.is(isDateValid('0100-10-23', noop), false)
  t.is(isDateValid('2009-23-5', noop), false)
  t.is(isDateValid('1942-11-0', noop), false)
  t.is(isDateValid('1942-00-25', noop), false)
  t.is(isDateValid('2000-10-00', noop), false)
})

// ----------------------------------------------------------