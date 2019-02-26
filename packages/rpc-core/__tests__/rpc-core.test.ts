import Rpc, {IRpcOpts} from '../src/rpc-core';
import {fakeFixturedConnection_1, FakeRemoteDelegate_1} from "./test-support/fake-connection-fixturing";
import {waitMs} from "./test-support/time-support";


describe('@wranggle/rpc-core', () => {

  test('basic round trip', async () => {
    const { remoteControl } = fakeFixturedConnection_1();
    const val = await remoteControl.downcaseString('Hello');
    expect(val).toBe('hello');
  });

  test('async request handler', async () => {
    const { remoteControl, remoteEndpoint } = fakeFixturedConnection_1();
    remoteEndpoint.rpc.addRequestHandler('waitThenUpcase', async (delay: number, input: string) => {
      await waitMs(delay);
      return input.toUpperCase();
    });
    const val = await remoteControl.waitThenUpcase(2, 'Hi');
    expect(val).toBe('HI');
  });

  test('MethodNotFound error for unknown methods', async () => {
    const { remoteControl } = fakeFixturedConnection_1();
    let error;
    try {
      const val = await remoteControl.whoAreYou();
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.errorCode).toBe('MethodNotFound');
    expect(error.methodName).toBe('whoAreYou');

  });

  test('MethodNotFound error for non-permitted methods', async () => {
    // note: more tests around this in request-handler.test.ts
    const { remoteControl } = fakeFixturedConnection_1();
    let error, val_1, val_2;
    expect(typeof FakeRemoteDelegate_1.prototype._secrets).toBe('function');
    expect(typeof FakeRemoteDelegate_1.prototype.downcaseString).toBe('function');
    try {
      val_1 = await remoteControl.downcaseString('Again');
      val_2 = await remoteControl._secrets();
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.errorCode).toBe('MethodNotFound');
    expect(error.methodName).toBe('_secrets');
    expect(val_1).toBe('again');
    expect(val_2).toBeUndefined();
  });
});

// todo: mocks to verify any not-yet used public methods reach their correct method. (registerTransport, setDefaultRequestOptsForMethod, etc)

