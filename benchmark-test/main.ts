const { performance: perf } = require('perf_hooks')
const _ = require('lodash')
const { formatMs } = require('./utils.ts')
const { dataJuggler } = require('../src/lib/juggler.ts')
const dataset = require('./datasets/dataset.json')

function computeMeanFuncExecutionTime(n: number, func: Function) {
  const mss = _.times(n).map((index: number) => {
    const t0 = perf.now();
    func()
    const t1 = perf.now()
    const ms = t1 - t0
    console.log(`⏳ ${index + 1}/${n}:\t${formatMs(ms)}`)
    return ms
  })
  const meanMs = _.mean(mss)
  console.log(`⌛️ mean: ${formatMs(meanMs)}`)
}

computeMeanFuncExecutionTime(20, () => dataJuggler(dataset))
