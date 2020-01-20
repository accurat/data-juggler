const { performance: perf} = require('perf_hooks')
const { dataJuggler } = require('../build/main/lib/juggler.js')
const dataset = require('./datasets/dataset.json')

function executeFuncNTimes(n, func) {
  const t0 = perf.now();
  for(let i = 0; i < n; i++) {
    func()
  }
  const t1 = perf.now()

  const ms = t1 - t0
  const s = ms / 1000

  console.log(`⏳ ${n} times:\t~`, Math.round(s), `s`)
}

executeFuncNTimes(1, () => dataJuggler(dataset))
executeFuncNTimes(2, () => dataJuggler(dataset))
