# WranggleRpc Relay

The Relay is used to resend a message from one transort to another transport from some window/process in the middle, one that is not the final endpoint. 

It is needed frequently in Wranggle's [process automation product](https://wranggle.com/), which sometimes even needs to use two relays. For example, when authoring a Wranggle automation script, an RPC message sent from a browser extension content script to the desktop authoring Studio's user interface needs to travel through the main browser extension window and again through the Studio's main Electron process to reach its final endpoint.

## Setup

If you are using the full [@wranggle/rpc](https://www.npmjs.com/package/@wranggle/rpc) package, the Relay is already bundled within. You can import/require it with: 

```javascript
import Relay from '@wranggle/rpc';
// or
const { Relay } = require('@wranggle/rpc');
```

#### Unbundled Alternative
If you prefer using just the packages you need, the unbundled es6 is also available on NPM:

```bash
yarn add @wranggle/rpc-relay
# or
npm install @wranggle/rpc-relay
```


Unbundled import:
```javascript
import Relay from '@wranggle/rpc-relay';
```

### Construction

The relay has two required fields: `left` and `right`. Each is a WranggleRpc transport. It doesn't matter which is which. Messages received on the left are sent on to the right and vice versa. 

You can use any type of WranggleRpc transport--in fact they're usually different types.

For example, here's a relay bridging a WebSocket server connection for a browser extension (the "left" side) with an Electron app's main-to-ui transport (the "right" side):

```
const Relay = require('@wranggle/rpc-relay');

const browserTransport = new WebSocketTransport({
  serverSocket: socket,
});

const uiTransport = new ElectronTransport({
  ipcSender: rendererWindow.webContents,
  ipcReceiver: ipcMain,
});

const relay new Relay({
  left: browserTransport,
  right: uiTransport,  
});
```


## Options and methods

* **shouldRelay**: Optional function that can block messages from being relayed. If applied, it must return `true` or the message will be dropped. It is passed the payload (for both requests and responses.) Type signature: `(payload: RequestPayload | ResponsePayload) => boolean` 

* `relay.stopTransports()`
