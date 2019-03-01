import {RequestPayload, ResponsePayload} from "rpc-core/src/interfaces";
const EventEmitter = require('events');
import LocalObserverTransport from 'rpc-core/src/local-observer-transport';
import Relay from "../src/relay";
import WranggleRpc from "rpc-core/src/rpc-core";


describe('@wranggle/rpc-relay', () => {
  let leftRpc: WranggleRpc<any>, rightRpc: WranggleRpc<any>;
  let leftTransport: LocalObserverTransport, rightTransport: LocalObserverTransport;
  let relayTransport: Relay;

  const buildRpc = () => {
    leftTransport = new LocalObserverTransport(new EventEmitter(), { messageEventName: 'leftEvent' });
    rightTransport = new LocalObserverTransport(new EventEmitter(), { messageEventName: 'rightEvent' });
    leftRpc = new WranggleRpc<any>({ transport: leftTransport, senderId: 'fakeLeft' });
    rightRpc = new WranggleRpc<any>({ transport: rightTransport, senderId: 'fakeRight' });
    _mockCrossoverMessaging(leftTransport, rightTransport);
    _mockCrossoverMessaging(rightTransport, leftTransport);

    relayTransport = new Relay({
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
  from.sendMessage = (payload: RequestPayload | ResponsePayload) => {
    // @ts-ignore
    to.observer.emit(to.eventName, payload);
  };
}


