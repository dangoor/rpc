import WranggleRpcDefault from '../dist/wranggle-rpc';
import { WranggleRpc } from '../dist/wranggle-rpc';
import { EventEmitter } from 'events';


describe('@wranggle/rpc-full', () => {
  describe('dist build', () => {

    test('registers transport shortcuts', () => {
      const observer = new EventEmitter();
      const rpc = new WranggleRpc<any>({ localObserver: observer });
      expect(rpc).toBeDefined();
      const remotePromise = rpc.remoteInterface().thisMethodDoesNotExist();
      expect(typeof remotePromise.then).toBe('function');
    });

    test('named and default import', () => {
      expect(WranggleRpc).toEqual(WranggleRpcDefault);
    });
  });
});

