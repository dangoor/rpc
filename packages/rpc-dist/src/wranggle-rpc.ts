import WranggleRpc from 'rpc-core/src/rpc-core';
import LocalObserverTransport from 'rpc-core/src/local-observer-transport';
import BrowserExtensionTransport from 'rpc-browser-extension-transport/src/browser-extension-transport';
import PostmessageTransport from 'rpc-postmessage-transport/src/postmessage-transport';
import TransportRelay from 'rpc-relay/src/relay-transports';


Object.assign(WranggleRpc, {
  BrowserExtensionTransport,
  LocalObserverTransport,
  PostmessageTransport,
  TransportRelay,
  WranggleRpc,
});
module.exports = WranggleRpc;

// note: rollup is yelling at me about mixing named and default exports (even for UMD output) so using module.exports instead of:
// export default WranggleRpc;
// export {
//   BrowserExtensionTransport,
//   LocalObserverTransport,
//   PostmessageTransport,
//   TransportRelay,
// }
