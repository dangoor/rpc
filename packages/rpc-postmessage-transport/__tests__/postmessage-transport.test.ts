import WranggleRpc, {IDict} from 'rpc-core/src/rpc-core';
import {IRequestPayload, IResponsePayload} from "rpc-core/src/internals/router";
import PostmessageTransport from "../src/postmessage-transport";
import { EventEmitter } from 'events';


const SomeOrigin = 'https://test.local';


describe('@wranggle/rpc-postmessage-transport', () => {

  describe('shouldReceive', () => {
    let lastMessage;
    let mockWindow;

    beforeEach(()=> {
      lastMessage = null;
      mockWindow = null;
    });

    const buildTransportAndFixturing = (shouldReceiveOpt: any) => {
      mockWindow = new MockWindow();
      const transport = new PostmessageTransport({
        targetWindow: mockWindow,
        sendToOrigin: SomeOrigin,
        shouldReceive: shouldReceiveOpt,
      });
      transport.listen((payload: IRequestPayload | IResponsePayload) => {
        lastMessage = payload;
      });
      return transport;
    };

    test('origin string', () => {
      buildTransportAndFixturing(SomeOrigin);
      mockWindow.fakeReceive({ aa: 11 }, 'otherOrigin');
      expect(!!lastMessage).toBe(false);
      mockWindow.fakeReceive({ bb: 22 }, SomeOrigin);
      expect(lastMessage.bb).toBe(22);
    });

    test('origin function filter', () => {
      const myOriginFilter = (origin: string) => !!([ 'https://test.local', 'http://test.local' ].find(val => val === origin));
      buildTransportAndFixturing(myOriginFilter);
      mockWindow.fakeReceive({ aa: 11 }, 'https://other.local');
      expect(!!lastMessage).toBe(false);
      mockWindow.fakeReceive({ bb: 22 }, 'http://test.local');
      expect(lastMessage.bb).toBe(22);
    });

  });

  test('includes correct targetOrigin when calling postMessage', () => {
    const mockWindow = new MockWindow();
    const transport = new PostmessageTransport({
      targetWindow: mockWindow,
      sendToOrigin: 'https://iframes.test.local',
      shouldReceive: SomeOrigin,
    });

    mockWindow.postMessage = jest.fn();
    const payload = { hi: 5 };
    // @ts-ignore
    transport.sendMessage(payload);
    expect(mockWindow.postMessage).toHaveBeenCalledWith(payload, 'https://iframes.test.local');
  });


  // todo: test both sendToOrigin and shouldReceive default to location.origin. (need to mock and restore global.location.origin)

});


class MockWindow {
  observer = new EventEmitter();
  _remoteWindowByOrigin = <IDict<MockWindow>>{};

  fakeReceive(data: any, origin: string) {
    this.observer.emit('message', { data, origin } )
  }

  addEventListener(name, listener) {
    this.observer.on(name, listener);
  }
  postMessage(data, origin) {
    const mockWindow = this._remoteWindowByOrigin[origin];
    mockWindow && mockWindow.fakeReceive(data, origin);
  }
  removeEventListener(methodName, cb) {
    this.observer.removeListener(methodName, cb);
  }

}
