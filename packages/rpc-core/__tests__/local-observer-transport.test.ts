import LocalObserverTransport from '../src/local-observer-transport';
import {IRpcPayload} from "../src/rpc-core";
const EventEmitter = require('events');


describe('@wranggle/rpc-core/local-observer-transport', () => {
  let testData;

  beforeEach(() => {
    testData = null;
  });
  const buildTransport = () => new LocalObserverTransport(new EventEmitter());
  const testMessageHandler = (payload: IRpcPayload) => {
    testData = payload;
  };

  test('should send itself messages', () => {
    const transport = buildTransport();
    transport.listen(testMessageHandler);
    transport.sendMessage({ mockNeeded: true });  // todo: mock IRpcPayload
    expect(testData).not.toBe(null);
    expect(testData.mockNeeded).toBeTruthy();
  });
  
});