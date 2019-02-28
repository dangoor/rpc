// import WranggleRpc from '@wranggle/rpc-core';
import ChromeTransport from '../src/browser-extension-transport';
import { fakeSender, FakeChromeExtensionId } from './test-support/fake-sender-support';

jest.mock('../src/chrome-manifest-2-api.js', () => _setupCustomMock());

const noop = () => {};


describe('@wranggle/rpc-browser-extension-transport', () => {
  let lastSend, lastReceived;
  let fakeChromeListener;

  beforeEach(() => {
    _restoreMockSwitches();
    lastSend = null;
    lastReceived = null;
    fakeChromeListener = null;
    
    _setMockFunction('sendMessageToTab', (tabId, payload) => {
      lastSend = { tabId, payload, sendApi: 'chrome.tabs' };
    });
    _setMockFunction('sendRuntimeMessage', (payload) => {
      lastSend = { payload, sendApi: 'chrome.runtime' };
    });
    _setMockFunction('addMessageListener', (listener) => {
      fakeChromeListener = listener
    });
  });

  const fakeSend = (transport: ChromeTransport, payload: any) => {
    transport.sendMessage(payload);
  };
  const fakeReceive = (transport: ChromeTransport, payload: any, sender: any) => {
    if (!fakeChromeListener) {
      transport.listen((payload: any) => lastReceived = payload);
    }
    fakeChromeListener(payload, sender);
  };


  test('error if not in a chromium-compatible extension', () => {
    _setMockFunction('hasChromeExtensionApi', () => false);
    expect(() => new ChromeTransport({})).toThrow(/extension/);
  });

  test('sending from main to specified tab', () => {
    const transport = new ChromeTransport({ forTabId: 5 });
    expect(!!lastSend).toBe(false);
    fakeSend(transport, { hello: 'niceTab' });
    expect(lastSend.tabId).toBe(5);
    expect(lastSend.payload.hello).toBe('niceTab');
    expect(lastSend.sendApi).toBe('chrome.tabs');
  });

  test('sending from tab to main', () => {
    const transport = new ChromeTransport({ forTabId: 4 });
    fakeReceive(transport, { some: 'info'}, fakeSender(4));
    expect(lastReceived.some).toBe('info')
  });

  test('ignores messages from other tabs', () => {
    const transport = new ChromeTransport({ forTabId: 4 });
    fakeReceive(transport, { some: 'info'}, fakeSender(6));
    expect(!!lastReceived).toBe(false)
  });

  test('ignores messages from other extensions', () => {
    const transport = new ChromeTransport({ forTabId: 4 });
    fakeReceive(transport, { some: 'info'}, fakeSender(4, 'otherExtensionId'));
    expect(!!lastReceived).toBe(false)
  });

  test('requires messages pass custom permitMessage when provided', () => {
    const transport = new ChromeTransport({
      forTabId: 4,
      permitMessage: (payload, sender) => payload.transportMeta.allow === 'ok',
    });
    fakeReceive(transport, { aa: 11, transportMeta: { allow: 'ok' }}, fakeSender(4));
    expect(!!lastReceived).toBe(true);
    lastReceived = null;
    fakeReceive(transport, { bb: 22, transportMeta: { allow: 'no' }}, fakeSender(4));
    expect(!!lastReceived).toBe(false);
  });
});


function _setupCustomMock() {
  const myCustomShittyMock = {};
  [
    'hasChromeExtensionApi',
    'getChromeRuntimeId',
    'isContentScript',
    'addMessageListener',
    'removeMessageListener',
    'sendMessageToTab',
    'sendRuntimeMessage',
    'warnIfErrorCb'
  ].forEach(m => {
    myCustomShittyMock[m] = (...args: any) => _getMockFn(m).apply(null, args);
  });
  return myCustomShittyMock;
}

const __chromeApiMockFunctions = {
};
function _getMockFn(field): any {
  return __chromeApiMockFunctions[field];
}
function _setMockFunction(field: string, fn: any) {
  if (typeof fn !== 'function') {
    throw new Error(`Expecting a function as mock replacement for "${field}"'`);
  }
  __chromeApiMockFunctions[field] = fn;
}
function _restoreMockSwitches() {
  Object.assign(__chromeApiMockFunctions, {
    hasChromeExtensionApi: () => true,
    isContentScript: () => false,
    getChromeRuntimeId: () => FakeChromeExtensionId,
    addMessageListener: noop,
    removeMessageListener: noop,
    sendMessageToTab: noop,
    sendRuntimeMessage: noop,
    warnIfErrorCb: noop,
  });

}