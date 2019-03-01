import { RequestPayload, ResponsePayload } from "rpc-core/src/interfaces";
export interface BrowserExtensionTransportOpts {
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
    permitMessage?: (payload: (RequestPayload | ResponsePayload), chromeSender: any) => boolean;
}
