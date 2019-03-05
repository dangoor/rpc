import {RequestPayload, ResponsePayload} from "rpc-core/src/interfaces";
import { EventEmitter } from 'events';
import LocalObserverTransport from 'rpc-core/src/local-observer-transport';
import Relay from "../src/relay";
import WranggleRpc from "rpc-core/src/rpc-core";


describe('@wranggle/rpc-relay', () => {
  let leftRpc: WranggleRpc<any>, rightRpc: WranggleRpc<any>;
  let middleLeftTransport: LocalObserverTransport, middleRightTransport: LocalObserverTransport;
  let relayTransport: Relay;

  const buildRpc = () => {
    const leftObserver = new EventEmitter();
    const rightObserver = new EventEmitter();
    const leftTransport = new LocalObserverTransport({
      observer: leftObserver,
      messageEventName: 'leftEvent' });
    leftRpc = new WranggleRpc<any>({ transport: leftTransport, senderId: 'fakeLeft' });

    const rightTransport = new LocalObserverTransport({
      observer: rightObserver,
      messageEventName: 'rightEvent'
    });
    rightRpc = new WranggleRpc<any>({ transport: rightTransport, senderId: 'fakeRight' });

    middleLeftTransport = new LocalObserverTransport({
      observer: leftObserver,
      messageEventName: 'leftEvent'
    });
    middleRightTransport = new LocalObserverTransport({
      observer: rightObserver,
      messageEventName: 'rightEvent'
    });

    relayTransport = new Relay({
      left: middleLeftTransport,
      right: middleRightTransport,
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
    middleLeftTransport.stopTransport = jest.fn();
    middleRightTransport.stopTransport = jest.fn();
    relayTransport.stopTransports();
    expect(middleLeftTransport.stopTransport).toHaveBeenCalled();
    expect(middleRightTransport.stopTransport).toHaveBeenCalled();
  });
  
  // maybe todo: test('adds relayId to payload transportMeta', () => { });

});

