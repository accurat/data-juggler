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
  { a: 3, b: 'mamma', d: 1552397833139 },
  { a: 2, b: 'papà', c: 2, d: 1552397832139 },
  { a: 1.5, b: 'cugino', c: 3, d: 15523912333139 },
  { a: 1, b: 'papà', c: 4 }
];

types = {
  a: 'continuous',
  b: 'categorical',
  c: 'continuous',
  d: 'date'
};
```

Then you can just launch the `dataStoreFactory` function with a name and teh sample data and instance types, and enjoy a beutiful mobx-state-tree store with everything that you need in it (this is, at least for now, a lie).

```javascript
import dayjs from 'dayjs';

const dataStore = dataStoreFactory('dataStore', data, types);
const d = dataStore.d;
const dPrime = {
  dateTime: dayjs(1552397833139),
  isValid: true,
  iso: '2019-03-12T14:37:13+01:00',
  raw: 1552397833139,
  scaled: 1
};

assert(d[0] === dPrime);

// All good! And much more that you can discover yourself by reading lib... :)
```

All of the feautures and representation of a datapoint are computed and lazy and whatnot.

## TODO

- [x] writing a README.md
- [ ] using [traph](https://github.com/caesarsol/traph)
- [ ] date comparison
- [ ] fetching with [ky](https://github.com/sindresorhus/ky)
