import LocalObserverTransport from '../src/local-observer-transport';
import {IRequestPayload, IResponsePayload} from "../src/internals/router";
const EventEmitter = require('events');


describe('@wranggle/rpc-core/local-observer-transport', () => {
  let testData;

  beforeEach(() => {
    testData = null;
  });

  const testMessageHandler = (payload: IRequestPayload | IResponsePayload) => {
    testData = payload;
  };

  test('sending itself messages', () => {
    const transport = new LocalObserverTransport(new EventEmitter());
    transport.listen(testMessageHandler);
    // @ts-ignore // todo: mock IRequestPayload
    transport.sendMessage({ mockNeeded: true });
    expect(testData).not.toBe(null);
    expect(testData.mockNeeded).toBeTruthy();
  });

  test('sending another instance a message with shared observer', () => {
    const sharedObserver = new EventEmitter();
    const transport_1 = new LocalObserverTransport(sharedObserver);
    const transport_2 = new LocalObserverTransport(sharedObserver);
    transport_1.listen(testMessageHandler);
    // @ts-ignore // todo: mock request or response payload
    transport_2.sendMessage({ aa: 11 });
    expect(testData.aa).toBe(11);
  });
});