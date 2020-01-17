import test from 'ava';
import { isNumber } from 'lodash';
import { conditionalValueMap } from '../parseObjects';

// ----------------------------------------------------------

test('conditionalValueMap', t => {
  const conditionalMap = conditionalValueMap(
    { d: 3, b: true },
    (_, v): v is number => isNumber(v),
    (_, v) => v * 2
  );

  t.deepEqual(conditionalMap, { d: 6, b: true });
});

// ----------------------------------------------------------
