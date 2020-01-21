const { performance: perf} = require('perf_hooks')
const __ = require('lodash')
const { formatMs } = require('./utils.ts')
const { dataJuggler } = require('../build/main/lib/juggler.js')
const dataset = require('./datasets/dataset.json')

function computeMeanFuncExecutionTime(n, func) {
  const mss = __.times(n).map((index) => {
    const t0 = perf.now();
    func()
    const t1 = perf.now()
    const ms = t1 - t0
    console.log(`⏳ ${index + 1}/${n}:\t${formatMs(ms)}`)
    return ms
  })
  const meanMs = __.mean(mss)
  console.log(`⌛️ mean: ${formatMs(meanMs)}`)
}

computeMeanFuncExecutionTime(5, () => dataJuggler(dataset))
