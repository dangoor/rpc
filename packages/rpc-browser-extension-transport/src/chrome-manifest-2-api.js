



function hasChromeExtensionApi() {
  return !!global.chrome || !!chrome.runtime;
}

function getChromeRuntimeId() {
  return chrome.runtime.id;
}
function isContentScript() {
  return typeof chrome.runtime.sendMessage === 'function' &&
    typeof chrome.runtime.getPlatformInfo !== 'function';
}

function sendRuntimeMessage(payload, cb) {
  chrome.runtime.sendMessage(payload, cb);
}

function sendMessageToTab(tabId, payload, cb) {
  chrome.tabs.sendMessage(tabId, payload, cb);
}

function addMessageListener(listener) {
  chrome.runtime.onMessage.addListener(listener)
}

function removeMessageListener(listener) {
  chrome.runtime.onMessage.removeListener(listener);
}

function warnIfErrorCb() {
  return () => {
    if (chrome.runtime.lastError) {
      console.warn(chrome.runtime.lastError);
    }
  }
}


module.exports = {
  getChromeRuntimeId,
  addMessageListener,
  hasChromeExtensionApi,
  isContentScript,
  removeMessageListener,
  sendMessageToTab,
  sendRuntimeMessage,
  warnIfErrorCb,
};
