interface AnyObject {
  [variable: string]: AnyObject;
}

type ReduceFn = (key: string, obj: AnyObject ) => AnyObject;

function mapValues(obj: AnyObject, fn: ReduceFn) {
  return Object.entries(obj).reduce((acc: AnyObject, [key, value]) => {
    const r = fn(key, value);
    if (r === undefined) { return acc }
    acc[key] = r;
    return acc;
  }, {});
}

let didWarn: Set<string> = new Set()

function warnOnce (message: string, ...args: unknown[]){
  if (didWarn.has(message)) {
    console.warn(message, ...args)
    didWarn.add(message)
  }
}

/**
 * A proxy for an Object that checks for existence of the keys,
 * and throws an error in case.
 * 
 * @param {AnyObject} data
 * @returns {(AnyObject | ProxyConstructor)}
 */
function checkerProxy (data: AnyObject): AnyObject | ProxyConstructor {
  if (typeof Proxy === 'undefined') {
    warnOnce("traph: can't validate input data Object because Proxy global is not defined.")
    return data
  } else {
    return new Proxy(data, {
      get (target, key) {
        const keyString = key.toString()
        if (keyString in target) {
          return target[keyString]
        } else {
          throw new Error (`Data object is missing key ${keyString}`)
        }
      }
    })
  }
}

const DATA_ATTRIBUTE = 'TRAPH_DATA_ATTRIBUTE'

const reduceFunction: ReduceFn = (key, fn): AnyObject => ({
  enumerable: true, 
  get () {
    const input = this[DATA_ATTRIBUTE]
    const output = this
    const value = fn(input, output)
    Object.defineProperty(this, key, {value, enumerable: true})
    return value
  }
}) 

function buildGettifizeProto(outputTemplate: AnyObject) {
 const protoDefinitions =  mapValues(outputTemplate, reduceFunction)
}