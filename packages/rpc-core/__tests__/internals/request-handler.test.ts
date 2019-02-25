import RequestHandler, {MissingMethodErrorCode} from "../../src/internals/request-handler";
import {waitMs} from "../test-support/time-support";


describe('@wranggle/rpc-core/request-handler', () => {
  let requestHandler;


  const fixturedBuild = () => {
    const handler = new RequestHandler();
    handler.addRequestHandlerDelegate(new SomeDelegatedClass());
    return handler;
  };

  beforeEach(() => {
    requestHandler = fixturedBuild();
  });

  test('use requested sync request handler', async () => {
    const result = await requestHandler.onValidatedRequest('hi', [ 'there' ]);
    expect(result).toBe('hi there');
  });

  test('async request handlers', async () => {
    const result = await requestHandler.onValidatedRequest('slowEcho', [ 2, 'hi' ]);
    expect(result).toBe('HI_hi');
  });
  
  test('prefer named handler over delegate', async () => {
    requestHandler.addRequestHandler('hi', (val) => `Higher ${val}`);
    const result = await requestHandler.onValidatedRequest('hi', [ 'priority' ]);
    expect(result).toBe('Higher priority');
  });

  test('reject missing methods', () => {
    return requestHandler.onValidatedRequest('missing').catch(err => {
      expect(err.errorCode).toBe(MissingMethodErrorCode);
    });
  });

  test('search multiple delegates', async () => {
    requestHandler.addRequestHandlerDelegate(new AnotherDelegatedClass());
    const result = await requestHandler.onValidatedRequest('more');
    expect(result).toBe(true);
  });

  test('ignore inherited methods by default', async () => {
    requestHandler.addRequestHandlerDelegate(new ChildDelegateClass());
    let error;
    try {
      await requestHandler.onValidatedRequest('more');
    } catch (reason) {
      error = reason;
    }
    expect(error.errorCode).toBe(MissingMethodErrorCode);
  });

  test('ignore inherited methods by default', async () => {
    requestHandler.addRequestHandlerDelegate(new ChildDelegateClass());
    let error;
    try {
      await requestHandler.onValidatedRequest('more');
    } catch (reason) {
      error = reason;
    }
    expect(error.errorCode).toBe(MissingMethodErrorCode);
  });

  test('reject when shouldRun filter option returns false', () => {
    requestHandler.addRequestHandlerDelegate(new AnotherDelegatedClass(), { shouldRun: () => false });
    return requestHandler.onValidatedRequest('more').catch(reason => {
      expect(reason.errorCode).toBe(MissingMethodErrorCode);
    });
  });

  test('permit method when shouldRun filter option returns true', async () => {
    requestHandler.addRequestHandlerDelegate(new AnotherDelegatedClass(), { shouldRun: () => true });
    const result = await requestHandler.onValidatedRequest('more');
    expect(result).toBe(true);
  });
  
  test('permit inherited methods when option enabled', async () => {
    requestHandler.addRequestHandlerDelegate(new ChildDelegateClass(), { ignoreInherited: false });
    const result = await requestHandler.onValidatedRequest('more');
    expect(result).toBe(true);
  });

  test('use delegate object as context by default', async () => {
    requestHandler.addRequestHandlerDelegate(new AnotherDelegatedClass());
    await requestHandler.onValidatedRequest('count');
    const result = await requestHandler.onValidatedRequest('count');
    expect(result).toBe(2);
  });

  test('accept passed in context as an option', async () => {
    requestHandler.addRequestHandlerDelegate(new AnotherDelegatedClass(), { context: { _count: 400 }});
    const result = await requestHandler.onValidatedRequest('count');
    expect(result).toBe(401);
  });

  test('do not permit calls to "constructor"', () => {
    return requestHandler.onValidatedRequest('constructor', 'val').catch(reason => {
      expect(reason.errorCode).toBe(MissingMethodErrorCode);
    });
  });
  
});


class SomeDelegatedClass {

  constructor(val?: any) {
    if (val) {
      throw new Error('Should not call constructor');
    }
  }

  hi(val: string) {
    return `hi ${val}`;
  }

  async slowEcho(ms: number, val: any): Promise<any> {
    await waitMs(ms);
    return `${val.toUpperCase()}_${val.toLowerCase()}`;
  }
}


class AnotherDelegatedClass {
  _count = 0;

  hi(val: string) {
    return `goodbye ${val}`;
  }

  more(): boolean {
    return true;
  }

  count() {
    this._count += 1;
    return this._count;
  }
}

class ChildDelegateClass extends AnotherDelegatedClass {

}