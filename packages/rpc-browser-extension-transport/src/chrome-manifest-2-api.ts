

type Callback = (...args: any[]) => void;

export function hasChromeExtensionApi() {
  // @ts-ignore
  return !!global.chrome || !!chrome.runtime;
}

export function getChromeRuntimeId() {
  return chrome.runtime.id;
}

export function isContentScript() {
  return typeof chrome.runtime.sendMessage === 'function' &&
    typeof chrome.runtime.getPlatformInfo !== 'function';
}

export function sendRuntimeMessage(payload: any, cb?: Callback) {
  chrome.runtime.sendMessage(payload, cb);
}

export function sendMessageToTab(tabId: number, payload: any, cb?: Callback) {
  chrome.tabs.sendMessage(tabId, payload, cb);
}

export function addMessageListener(listener: Callback) {
  chrome.runtime.onMessage.addListener(listener)
}

export function removeMessageListener(listener: Callback) {
  chrome.runtime.onMessage.removeListener(listener);
}

export function warnIfErrorCb() {
  return (err: any) => {
    if (chrome.runtime.lastError || err) {
      console.warn(chrome.runtime.lastError || err);
    }
    return Promise.resolve();
  }
}
