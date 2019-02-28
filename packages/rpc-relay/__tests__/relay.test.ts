const EventEmitter = require('events');
import WranggleRpc from '@wranggle/rpc-core/src/rpc-core';
import LocalObserverTransport from '@wranggle/rpc-core/src/local-observer-transport';
import {IRequestPayload, IResponsePayload} from "@wranggle/rpc-core/src/internals/router";
import RelayTransport from "../src/relay";


describe('@wranggle/rpc-relay', () => {
  let leftRpc, rightRpc;
  let leftTransport, rightTransport;
  let relayTransport;

  const buildRpc = () => {
    leftTransport = new LocalObserverTransport(new EventEmitter(), { messageEventName: 'leftEvent' });
    rightTransport = new LocalObserverTransport(new EventEmitter(), { messageEventName: 'rightEvent' });
    leftRpc = new WranggleRpc({ transport: leftTransport, senderId: 'fakeLeft' });
    rightRpc = new WranggleRpc({ transport: rightTransport, senderId: 'fakeRight' });
    _mockCrossoverMessaging(leftTransport, rightTransport);
    _mockCrossoverMessaging(rightTransport, leftTransport);

    relayTransport = new RelayTransport({
      left: leftTransport,
      right: rightTransport,
      relayId: 'fakeMiddle'
    });
  };


  test('rpc through relay', async () => {
    buildRpc();
    rightRpc.addRequestHandler('sing', () => 'do re me');
    const result = await leftRpc.remoteInterface().sing();
    expect(result).toBe('do re me');
  });

  test('stopTransport stops left and right sides', () => {
    buildRpc();
    leftTransport.stopTransport = jest.fn();
    rightTransport.stopTransport = jest.fn();
    relayTransport.stopTransport();
    expect(leftTransport.stopTransport).toHaveBeenCalled();
    expect(rightTransport.stopTransport).toHaveBeenCalled();
  });
  
  // maybe todo: test('adds relayId to payload transportMeta', () => { });

});



function _mockCrossoverMessaging(from: LocalObserverTransport, to: LocalObserverTransport) {
  from.sendMessage = (payload: IRequestPayload | IResponsePayload) => {
    // @ts-ignore
    to.observer.emit(to.eventName, payload);
  };
}


