interface AnyObject {
  [variable: string]: AnyObject;
}

/* tslint:disable */

// FIXME: inconsisten typing
type Fn = (first: any, second: any) => AnyObject;

interface CustomPropertyDescriptor extends PropertyDescriptor {
  TRAPH_DATA_ATTRIBUTE?: AnyObject;
  [variable: string]: any;
}

function mapValues(obj: AnyObject, fn: Fn): CustomPropertyDescriptor {
  return Object.entries(obj).reduce(
    (acc: CustomPropertyDescriptor, [key, value]) => {
      const r = fn(key, value);
      if (r === undefined) {
        return acc;
      }
      acc[key] = r;
      return acc;
    },
    {}
  );
}

const didWarn: string[] = [];

function warnOnce(message: string, ...args: unknown[]) {
  if (didWarn.includes(message)) {
    console.warn(message, ...args);
    didWarn.push(message);
  }
}

/**
 * A proxy for an Object that checks for existence of the keys,
 * and throws an error in case.
 *
 * @param {AnyObject} data
 * @returns {(AnyObject | ProxyConstructor)}
 */
function checkerProxy(data: AnyObject): AnyObject | ProxyConstructor {
  if (typeof Proxy === 'undefined') {
    warnOnce(
      "traph: can't validate input data Object because Proxy global is not defined."
    );
    return data;
  } else {
    return new Proxy(data, {
      get(target, key) {
        const keyString = key.toString();
        if (keyString in target) {
          return target[keyString];
        } else {
          throw new Error(`Data object is missing key ${keyString}`);
        }
      }
    });
  }
}

const reduceFunction = (
  key: string,
  fn: (input: AnyObject, output: CustomPropertyDescriptor) => unknown
): CustomPropertyDescriptor => ({
  enumerable: true,
  get() {
    const input = this.TRAPH_DATA_ATTRIBUTE;
    const output = this;
    const value = fn(input || {}, output);
    Object.defineProperty(this, key, { value, enumerable: true });
    return value;
  }
});

function buildGettifizeProto(outputTemplate: AnyObject) {
  const protoDefinitions = mapValues(outputTemplate, reduceFunction);
  const proto = Object.defineProperties({}, protoDefinitions);
  return proto;
}

function buildGettifizeDataBinder(proto: any) {
  return function bindData(input: AnyObject) {
    const inputProxy =
      process.env.NODE_ENV === 'developement' ? checkerProxy(input) : input;
  };
}
