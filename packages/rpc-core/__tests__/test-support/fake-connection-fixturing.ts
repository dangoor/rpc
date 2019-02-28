import LocalObserverTransport, {ILocalObserverTransportOpts} from '../../src/local-observer-transport';
import {EventEmitter} from 'events';
import {waitMs} from "./time-support";
import {IAnyAddedHandler, IFakeConnection, mockConnection, mockEndpoint} from "./mock-endpoint-support";


interface IFakeRemoteDelegate_1  {
  downcaseString(s: string): string;
  echo(...args: any[]): any;
  count(): number;
  waitThenReturnVal(ms, result): Promise<any>;
  [ key: string ]: (...args: any[]) => any;
}

// @ts-ignore
export class FakeRemoteDelegate_1 implements IFakeRemoteDelegate_1 {
  private _count = 0;

  downcaseString(s: string): string {
    return (s || '').toLowerCase()
  }

  echo(...args: any[]): any {
    return args;
  }

  count(): number {
    this._count += 1;
    return this._count;
  }

  async waitThenReturnVal(ms, result) {
    await waitMs(ms);
    return result;
  }

  _secrets() {
    return 'shhh!';
  }
}



export function fakeFixturedConnection_1(): IFakeConnection<IFakeRemoteDelegate_1> {
  return mockConnection<IFakeRemoteDelegate_1>({
    remoteRequestHandlerDelegate: (new FakeRemoteDelegate_1() as unknown) as IFakeRemoteDelegate_1
  });
}

export function buildLocalObserverTransport(opts=<Partial<ILocalObserverTransportOpts>>{}) {
  return new LocalObserverTransport(new EventEmitter(), opts);
}


