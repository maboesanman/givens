import {
  givenCache,
  givenProps,
  givenTrace,
} from './types';
import evaluate from './evaluate';
import isValid from './isValid';
import GivenError from './givenError';
import getContextInfo from './getContextInfo';

const getGivenFunc = () => {
  const given = <T, K extends keyof T>(key: K, func: () => T[K]): void => {
    const contextInfo = getContextInfo(given);
    if (!contextInfo.allowed) {
      throw new GivenError(contextInfo.message, given);
    }

    if (!isValid(key as string)) {
      throw new GivenError(`key "${key}" is not allowed`, given);
    }

    const props = (given as any).__props__ as givenProps<T>;
    const cache = (given as any).__cache__ as givenCache<T>;
    const trace = (given as any).__trace__ as givenTrace<T>;

    // push function onto prop stack
    const push = () => {
      // add a getter with this key to the global given object if it is missing
      // eslint-disable-next-line no-prototype-builtins
      if (!given.hasOwnProperty(key)) {
        props[key] = [];

        // make sure to pass the correct ssi for easier debugging
        const getter = () => evaluate<T, K>(key, props, cache, trace, getter);
        Object.defineProperty(given, key, {
          get: getter,
          configurable: true,
          enumerable: true,
        });
      }

      props[key]!.push(func);
      delete cache[key];
    };

    // pop function off prop stack
    const pop = () => {
      props[key]!.pop();

      // remove keys that no longer have values.
      if (props[key]!.length === 0) {
        delete props[key];
        delete (given as any)[key];
      }
    };

    if (typeof beforeAll === 'function') {
      beforeAll(push);
    } else if (typeof before === 'function') {
      before(`givens setup ${key}`, push);
    } else {
      throw new GivenError('no test runner found', given);
    }

    if (typeof afterAll === 'function') {
      afterAll(pop);
    } else if (typeof after === 'function') {
      after(`givens teardown ${key}`, pop);
    } else {
      throw new GivenError('no test runner found', given);
    }
  };
  if (typeof afterEach === 'function') {
    // clear the cache after every test
    afterEach(() => {
      const cache = (given as any).__cache__;
      Object.keys(cache).forEach((key: any) => {
        delete cache[key];
      });
    });
  } else {
    throw new GivenError('no test runner found', getGivenFunc);
  }
  return given;
};

export default getGivenFunc;
