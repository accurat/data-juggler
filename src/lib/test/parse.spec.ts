import test from 'ava';
import dayjs from 'dayjs';
import { isNaN } from 'lodash';
import { parseDates } from '../parse';
import { autoInferenceType } from '../dataInference';

// ----------------------------------------------------------

test('parseDates with string dates', t => {
  const dates = [{ d: '2012-12-22' }, { d: '2013-12-22' }];

  t.notThrows(() => parseDates(dates, autoInferenceType(dates, {}), {}));

  const inferObj = autoInferenceType(dates, {});
  const parsedDates = parseDates(dates, inferObj, {});

  t.deepEqual(parsedDates[0].d, 1356130800);
});

// ----------------------------------------------------------

test('parseDates with string dates and timestamps', t => {
  const dataset = [
    { timestamp: '2017-06-25', unix: 1557303452 },
    { timestamp: '2017-06-26', unix: 1557303352 },
    { timestamp: '2017-06-27', unix: 1557303552 }
  ];

  const parsedDataset = parseDates(dataset, autoInferenceType(dataset), {});

  t.deepEqual(parsedDataset[0].timestamp, dayjs(dataset[0].timestamp).unix());
  t.deepEqual(parsedDataset[0].unix, dataset[0].unix);
});

// ----------------------------------------------------------

test('Custom parser', t => {
  const dataset = [
    { a: 3, b: 'mom', d: '2018-02-20' },
    { a: 2, b: 'dad', c: 2, d: '2018-03-20' },
    { a: 1.5, b: 'cousin', c: 3, d: '2019-06-22' },
    { a: 1, b: 'dad', c: 4, d: '2029-02-20' }
  ];

  const types = autoInferenceType(dataset, {});

  const wrongParser = { d: (day: string) => dayjs(day, 'DD-MM-YYYY').unix() };
  const parsedDatesWithWrongParser = parseDates(dataset, types, wrongParser);
  const firstDateWrongParsed = parsedDatesWithWrongParser[0].d;

  const correctParser = { d: (day: string) => dayjs(day, 'YYYY-MM-DD').unix() };
  const parsedDatesWithCorrectParser = parseDates(
    dataset,
    types,
    correctParser
  );
  const firstDateCorrectParsed = parsedDatesWithCorrectParser[0].d;

  t.true(isNaN(firstDateWrongParsed));
  t.deepEqual(firstDateCorrectParsed, dayjs('2018-02-20').unix());
});

// ----------------------------------------------------------
