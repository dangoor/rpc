import Rpc, {IRpcOpts} from '../src/rpc-core';
import {RemotePromise} from "../src/flight-receipt";


interface IMyRemote {
  echo(...args: any[]): RemotePromise<any>;
  hello(name: string): RemotePromise<string>;
}

describe('@wranggle/rpc-core', () => {
  const buildRpc = (opts=<IRpcOpts>{}) => new Rpc<IMyRemote>({ channel: 'myTest' });
  const buildRpcRemote = (opts=<IRpcOpts>{}) => buildRpc(opts).remoteInterface();


  test('quick temp test of setup', async () => {
    const remote = buildRpcRemote();
    const greeting = await remote.hello('You');

  });
  
});
