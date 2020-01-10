import test from 'ava';
import dayjs from 'dayjs'
import { isDateValid } from './utils/dataInference'
import { noop } from 'lodash'

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