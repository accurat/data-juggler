# mst-data-store

[![CodeFactor](https://www.codefactor.io/repository/github/accurat/mst-data-store/badge)](https://www.codefactor.io/repository/github/accurat/mst-data-store)

This library serves little purpose, like all of us and everything we do, but is a bit covered and tested, as you can see.

This libary was `__init__.py`iated with [typescript starter](https://github.com/bitjson/typescript-starter) and uses the devil 👹 tslint.

In the context, the idea is to generalize and abstract the overused and reused DataStore, that we magically create in all of our projects, with a fetching function and so on.
This library abstracts that, normalizes, counts, calculates and does many inefficient things that feed into our laziness.

## Usage

The usage can be easily seen from the test, assume you are fetching some (csv like for now) data from an API and the columns have the following "type":

```javascript
data = [
  { type: 'mamma', value: 3, time: 1552397833139 },
  { type: 'papà', value: 2, connectionsCount: 2, time: 1552397832139 },
  { type: 'cugino', value: 1.5, connectionsCount: 3, time: 15523912333139 },
  { type: 'papà', value: 1, connectionsCount: 4 }
];

types = {
  type: 'categorical',
  value: 'continuous',
  connectionsCount: 'continuous',
  time: 'date'
};
```

Then you can just launch the `dataStoreFactory` function with a name and teh sample data and instance types, and enjoy a beutiful mobx-state-tree store with everything that you need in it (this is, at least for now, a lie).

```javascript
import { DateTime } from 'luxon';

const dataStore = dataStoreFactory('dataStore', data, types);

const dFirst = dataStore.dataset[0].time; // Access the `time` column of the first datum
const dFirstExpected = {
  dateTime: DateTime.fromMillis(1552397833139),
  iso: '2019-03-12',
  locale: 'Mar 12, 2019, 2:37 PM',
  raw: 1552397833139,
  scaled: 1
};

assertDeepEqual(dFirst, dFirstExpected);

// All good! And much more that you can discover yourself by reading lib... :)
```

All of the feautures and representation of a datapoint are computed and lazy and whatnot.

## TODO

- [x] writing a README.md
- [ ] using [traph](https://github.com/caesarsol/traph)
- [ ] date comparison
- [ ] fetching with [ky](https://github.com/sindresorhus/ky)
