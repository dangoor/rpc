import WranggleRpc from 'rpc-core/src/rpc-core';
import LocalObserverTransport, {LocalObserverTransportOpts} from 'rpc-core/src/local-observer-transport';
import BrowserExtensionTransport from 'rpc-browser-extension-transport/src/browser-extension-transport';
import PostmessageTransport from 'rpc-postmessage-transport/src/postmessage-transport';
import ElectronTransport from 'rpc-electron-transport/src/electron-transport';
import WebSocketTransport from 'rpc-websocket-transport/src/websocket-transport';
import Relay from 'rpc-relay/src/relay';
import {IDict, RpcTransport, RpcOpts } from "rpc-core/src/interfaces";


export default WranggleRpc; 
export {
  BrowserExtensionTransport,
  ElectronTransport,
  LocalObserverTransport,
  PostmessageTransport,
  Relay,
  WebSocketTransport,
  WranggleRpc,
}

type Klass = new (...args: any[]) => RpcTransport;

// todo: figure out how to extend/merge RpcOpts with transport shortcuts in typescript
// declare module "rpc-core/src/rpc-core" {
//   export class WranggleRpc {
//     protected constructor(rpcOpts?: Partial<RpcOptsWthTransports>);
//   }
// }
// export interface RpcOptsWthTransports extends RpcOpts {
//   localObserver?: LocalObserverTransportOpts;
// }
