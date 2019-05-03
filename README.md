# data-juggler 🤹‍♀️

_all life is fermentation - Feynman_

This library serves little purpose, like all of us and everything we do, but is a bit covered and tested, as you can see.

This libary was `__init__.py`iated with [typescript starter](https://github.com/bitjson/typescript-starter) and uses the devil 👹 tslint.

In the context, the idea is to generalize and abstract the data propagation within an application, that we magically create in all of our projects.
This library abstracts that, normalizes, counts, calculates and does many inefficient things that feed into our laziness.

## Usage

### Installations

```bash
yarn add data-juggler
```

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

const { data, moments } = dataJuggler(data, { types });
```

Launch the `dataJuggler` function with the sample data and instance types, and enjoy a beutiful dataset full of getters and stuff with everything that you need in it (this is, at least for now, a lie).

### Properties

You'll get your data back (don't worry) with added properties!

```javascript

const instance = data[0]

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
    iso: '2019-03-12',
    raw: 1552397832139,
    scaled: 1
  }
}
// true

```

On top of that you also get some getters for each variable that return the whole column, this could be cutted eventually in a censorship attempt by my boss.

Edit: the censorship did happen, this is not there anymore.

## The configuration object

The library accepts as a second parameter a config object of the form

```javascript
const config = {
  types,
  formatter: [{ 'height': [/*stuff*/]}],
  parser: { 'height': (cm: number) => /*more stuff*/ }
}

const { data, moments, types } = dataJuggler(data, {...config});

```

As in the example above the `types` object is rather explanatory! Let's look at the other ones, but first...

### Annoyed by having to pass the types yourself? Look no further!

If you feel adventurous you can only pass the data without any `types` in the `config` object and our advanced (read naive) detecting system will try and determine, mostly leveraging the awesome [dayjs](https://github.com/iamkun/dayjs) ⏰ library, the type for you and then pass it as key `types` in the object returned by the function.

### Custom formatter

You can also pass a custom formatter for each column type as follow.

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

const dataStore = dataJuggler(data, types, formatter);

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

### Custom parser

What if the data you are passing is not parsed correctly by the library. Once again, no worries! Just pass the parser yourself, the typechecker should prevent you from breaking everything, but hey, what do I know?

```javascript
  const { data: correctlyParsedData } = dataJuggler(datasetWithDates, {
    parser: {
      d: (day: string) => dayjs(day, 'YYYY-MM-DD').unix()
    }
  })
  const { data: wronglyParsedData } = dataJuggler(datasetWithDates, {
    parser: {
      d: (day: string) => dayjs(day, 'MM-DD-YYYY').unix()
    }
  })
```
