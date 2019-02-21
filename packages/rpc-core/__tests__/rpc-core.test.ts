import Rpc from '../src/rpc-core';


describe('@wranggle/rpc-core', () => {
  test('quick temp test of setup', () => {
    expect(() => new Rpc({ channel: 'myTest' })).not.toThrow();
  });
});
