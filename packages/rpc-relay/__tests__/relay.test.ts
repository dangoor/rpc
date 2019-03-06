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
    rightRpc.addRequestHandler('sing', () => 'do re me');

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
    const result = await leftRpc.remoteInterface().sing();
    expect(result).toBe('do re me');
  });

  test('shouldRelay filter', async () => {
    buildRpc();
    relayTransport.opts({ shouldRelay: (payload: any) => true });
    const remotePromise_1 = leftRpc.remoteInterface().sing();
    remotePromise_1.updateTimeout(20);
    const result = await remotePromise_1;
    expect(result).toBe('do re me');
    relayTransport.opts({ shouldRelay: (payload: any) => false });
    const remotePromise_2 = leftRpc.remoteInterface().sing();
    remotePromise_2.updateTimeout(20);
    let fails;
    await remotePromise_2.catch(err => {
      fails = err;
    });
    expect(!!fails).toBe(true);
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

