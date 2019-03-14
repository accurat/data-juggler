# mst-datastore

This library serves little purpose, like all of us and everything we do, but is a bit covered and tested, as you can see.

This libary was `__init__.py`iated with [typescript starter](https://github.com/bitjson/typescript-starter) and uses the devil 👹 tslint.

In the context, the idea is to generalize and abstract the overused and reused DataStore, that we magically create in all of our projects, with a fetching function and so on.
This library abstracts that, normalizes, counts, calculates and does many inefficient things that feed into our laziness.

## Usage

### Basic usage

The usage can be easily seen from the test, assume you are fetching some (csv like for now) data from an API and the columns have the following "type":

```javascript
data = [
  { height: 190, gender: 'male', timeOfMeasure: 1552397833139 },
  { height: 170, gender: 'female', age: 22, timeOfMeasure: 1552397832139 },
  { height: 164, gender: 'female', age: 20, timeOfMeasure: 15523912333139 },
  { height: 176, gender: 'female', age: 12 }
];

types = {
  height: 'continuous',
  gender: 'categorical',
  age: 'continuous',
  timeOfMeasure: 'date'
};

const dataStore = dataStoreFactory('dataStore', data, types);
```

Launch the `dataStoreFactory` function with a name and the sample data and instance types, and enjoy a beutiful mobx-state-tree store with everything that you need in it (this is, at least for now, a lie).

### Properties

The datastore will have a defult property `data`, i.e. an array of the decorated datum instances.

```javascript

const instance = dataStore.data[0]

instance === {
  height: {
    raw: 190,
    scaled: 1
  },
  gender: {
    raw: 'male',
  },
  timeOfMeasure: {
    dateTime: // the day js instance of the dataset,
    isValid: true,
    iso: '2019-03-12T14:37:13+01:00',
    raw: 1552397832139,
    scaled: 1
  }
}
// true

```

All of the feautures and representation of a datapoint are computed and lazy and whatnot.

On top of that you also get some getters for each variable that return the whole column, this could be cutted eventually in a censorship attempt by my boss.

### Custom formatter

You can also pass a custom formatter for each column type (in the next PR you will be able to pass multiple per column so stay tuned) as follow:

```javascript

formatter = {
  height: [{
    property: 'feet',
    compute: (datum) => datum * 0.0328084
  },
  {
    property: 'rescaled',
    compute: (datum, min, max) => datum / max
  }],
  timeOfMeasure: [{
    property: 'year',
    compute: (day) => day.format('YYYY')
  }]
}

//  if we look for the same instance as before

const dataStore = dataStoreFactory('dataStore', data, types, formatter);

instance === {
  height: {
    raw: 190,
    scaled: 1,
    // newly added
    feet: 6,233596
  },
  timeOfMeasure: {
    dateTime: // the day js instance of the dataset,
    isValid: true,
    raw: 1552397832139,
    scaled: 1
    // newly added
    year: '2019',
  }
}

// true

```

## TODO

- [x] writing a README.md
- [x] custom formatter
- [ ] using [traph](https://github.com/caesarsol/traph)
- [ ] date comparison
- [ ] fetching with [ky](https://github.com/sindresorhus/ky)
