import Rpc, {IRpcOpts} from '../src/rpc-core';
import {RemotePromise} from "../src/flight-receipt";


interface IMyRemote {
  echo(...args: any[]): RemotePromise<any>;
  hello(name: string): RemotePromise<string>;
  tooSlow(): RemotePromise<boolean>;
}

describe('@wranggle/rpc-core', () => {
  describe('flight-receipt', () => {
    const buildRpc = (opts=<IRpcOpts>{}) => new Rpc<IMyRemote>({ channel: 'myTest' });
    const buildRpcRemote = (opts=<IRpcOpts>{}) => buildRpc(opts).remoteInterface();


    test('resolveNow', async () => {
      const remote = buildRpcRemote();
      const receipt = remote.tooSlow(); // todo: implement tooSlow method. Have it return true after a long timeout
      setTimeout(() => receipt.resolveNow(false), 5);
      const result = await receipt;
      expect(result).toBe(false);
    });

    // todo: status
    // todo: updateTimeout
    // todo: rejectNow
  });
});
