import {IRpcTransport} from "rpc-core/src/rpc-core";
import {IRequestPayload, IResponsePayload} from "rpc-core/src/internals/router";
const chromeApi = require('./chrome-manifest-2-api.js');


export interface IChromeTransportOpts {
  /**
   * Shortcut to set both `sendToTabId` and `receiveFromTabId` options. Use this in the main extension (not the content script / tab)
   * when you want your WranggleRpc instance to communicate with only a single tab.
   *
   * There are various ways to get the tabId in a chrome extension. For example, if in the extension popup you can do something like:
   *     `chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => console.log(tabs[0]);`
   */
  forTabId?: number;

  /**
   * Sends messages from main extension only to content script of the passed-in tab.
   * This option cannot be set in a content script / tab, only in the context of your full extension.
   * When set, messages are sent using `chrome.tabs.sendMessage`. See https://developer.chrome.com/extensions/tabs#method-sendMessage
   * If not set, messages are sent using `chrome.runtime.sendMessage`. See https://developer.chrome.com/apps/runtime#method-sendMessage
   *
   */
  sendToTabId?: number;

  /**
   * When set, messages not originating from the specified tab are ignored.
   */
  receiveFromTabId?: number;

  /**
   * By default, messages received from other browser extensions are ignored. Set this option to true to permit them.
   * The presence of a "permitMessage" filter is required in this case.
   */
  skipExtensionIdCheck?: boolean;

  /**
   * An optional filter for ignoring incoming messages. Return true to accept message, anything else to reject.
   * @param payload
   */
  permitMessage?: (payload: (IRequestPayload | IResponsePayload), chromeSender: any) => boolean;
}

type ChromeListener = (payload: (IRequestPayload | IResponsePayload), sender: any) => void;

export default class ChromeTransport implements IRpcTransport {
  private _stopped = false;
  private _opts: IChromeTransportOpts;
  private readonly _isContentScript: boolean;
  private readonly _chromeExtensionId!: string;
  private _messageHandler?: ChromeListener;


  constructor(opts=<IChromeTransportOpts>{}) {
    if (!chromeApi.hasChromeExtensionApi()) {
      throw new Error('Invalid environment: expecting a Chromium extension');
    }
    // TODO: use firefox `browser` API directly. (but they're also compatible w/ Chrome API so just using that in first pass)
    this._isContentScript = chromeApi.isContentScript();
    this._chromeExtensionId = chromeApi.getChromeRuntimeId();
    this._opts = this._initOpts(opts);
  }

  listen(onMessage: (payload: (IRequestPayload | IResponsePayload)) => void): void {
    if (typeof onMessage !== 'function') {
      throw new Error('Invalid message handler');
    }
    this._removeListener();
    const { skipExtensionIdCheck, receiveFromTabId, permitMessage } = this._opts;
    const chromeRuntimeId = this._chromeExtensionId;
    this._messageHandler = (payload, sender) => {
      if (skipExtensionIdCheck || chromeRuntimeId !== (sender || {}).id) {
        // console.debug('Ignoring message because sender.id does not match chrome.runtime.id.');
        return;
      }
      if (receiveFromTabId) {
        const tabId = sender && sender.tab && sender.tab.id;
        if (receiveFromTabId !== tabId) {
          return;
        }
      }
      if (typeof permitMessage === 'function' && permitMessage(payload, sender) !== true) {
        return;
      }
      onMessage(payload);
    };
    
    chromeApi.addMessageListener(this._messageHandler);
  }

  sendMessage(payload: IRequestPayload | IResponsePayload): void {
    if (this._stopped) {
      return;
    }
    if (this._opts.sendToTabId) {
      chromeApi.sendMessageToTab(this._opts.sendToTabId, payload, chromeApi.warnIfErrorCb());
    } else {
      chromeApi.sendRuntimeMessage(payload, chromeApi.warnIfErrorCb());
    }
  }

  stopTransport(): void {
    this._stopped = true;
    this._removeListener();
  }

  _removeListener(): void {
    this._messageHandler && chromeApi.removeMessageListener(this._messageHandler);
  }

  _initOpts(opts: IChromeTransportOpts) {
    if (opts.skipExtensionIdCheck && typeof opts.permitMessage !== 'function') {
      throw new Error('When "skipExtensionIdCheck" is enabled, you must provide a custom "permitMessage" filter function');
    }
    opts.receiveFromTabId = opts.receiveFromTabId || opts.forTabId;
    opts.sendToTabId = opts.sendToTabId || opts.forTabId;
    if (this._isContentScript && (opts.receiveFromTabId || opts.sendToTabId)) {
      console.warn('The "forTabId", "sendToTabId", and "receiveFromTabId" options can only be applied in the main browser extension context, not in a content script. Ignoring.');
    }
    return opts;
  }
}