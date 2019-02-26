import WranggleRpc, {IRpcTransport} from '../../src/rpc-core';
import {IRequestPayload, IResponsePayload} from "../../src/internals/router";


describe('@wranggle/rpc-core/transport-construction', () => {

  beforeEach(() => {
    WranggleRpc.registerTransport('something', (opts: any) => new SomeTransport(opts));
  });

  const getTransport = (rpc: WranggleRpc<any>): SomeTransport => {
    // @ts-ignore
    return rpc.router.transport;
  };
  const getTransportConfig = (rpc: WranggleRpc<any>): any => {
    return (getTransport(rpc) || {} as any).constructorOpts;
  };
  const expectValidTransport = (rpc: WranggleRpc<any>) => {
    const transport = getTransport(rpc);
    expect(transport).toBeDefined();
    expect(transport.isSomeTransport).toBe(true);
    expect(typeof transport.constructorOpts).toBe('object');
  };


  test('permit late creation of transport', () => {
    const rpc = new WranggleRpc();
    const transport = new SomeTransport({ abc: true });
    rpc.useTransport(transport);
    expectValidTransport(rpc);
    expect(getTransportConfig(rpc).abc).toBe(true);
  });

  test('update transport as rpc option', () => {
    const rpc = new WranggleRpc({ transport: 'something' });
    expectValidTransport(rpc);
    const transport2 = new SomeTransport({ another: 2 });
    rpc.opts({ transport: transport2 });
    expectValidTransport(rpc);
    expect(getTransportConfig(rpc).another).toBe(2);
  });

  test('accepts "transportType" as an attrib in the options data', () => {
    const transportOpts_1 = {
      transportType: 'something',
      data: 'one',
    };
    const transportOpts_2 = {
      type: 'something',
      data: 'two',
    };
    const rpc = new WranggleRpc({ transport: transportOpts_1 });
    expectValidTransport(rpc);
    expect(getTransportConfig(rpc).data).toBe('one');
    rpc.opts({ transport: transportOpts_2 });
    expectValidTransport(rpc);
    expect(getTransportConfig(rpc).data).toBe('two');
  });

  test('transportType string', () => { // for drop this signature?
    // @ts-ignore
    const rpc = new WranggleRpc('something');
    expectValidTransport(rpc);
  });

});

class SomeTransport implements IRpcTransport {
  constructorOpts: any;
  isSomeTransport = true;

  constructor(opts: any) {
    this.constructorOpts = opts;
  }

  listen(onMessage: (payload: (IRequestPayload | IResponsePayload)) => void): void {
  }

  sendMessage(payload: IRequestPayload | IResponsePayload): void {
  }

  stopTransport(): void {
  }


}