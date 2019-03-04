# WebSocketTransport

A WranggleRpc transport, sending and receiving messages over [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket). 


## Usage 

If you are using the full [@wranggle/rpc](https://www.npmjs.com/package/@wranggle/rpc) package, the WebSocketTransport is already
 bundled within. You can import/require it with: 

```javascript
import { WranggleRpc, WebSocketTransport } from '@wranggle/rpc';
// or
const { WranggleRpc, WebSocketTransport } = require('@wranggle/rpc');
```

#### Unbundled Alternative
If you prefer using just the packages you need, the unbundled es6 is also available on NPM:

```bash
yarn add @wranggle/rpc-core @wranggle/rpc-websocket-transport
# or
npm install @wranggle/rpc-core @wranggle/rpc-websocket-transport 
```

Unbundled import:
```javascript
import WranggleRpc from '@wranggle/rpc-core';
import WebSocketTransport from '@wranggle/rpc-websocket-transport';
```

#### Shortcut
When creating your WranggleRpc endpoint, you can use the `websocket` shorcut to also construct this transport. Eg:

```javascript
```

## Client-side endpoint

On the client-side (browser page or non-server process) you need to provide either a URL to the server or an existing socket.

Example:
```javascript
const transport = new WebSocketTransport({
  websocketUrl: 'ws://myWebsocketServer.example'
});
const rpc = new WranggleRpc({ transport });
```

#### Client-side option: `websocketUrl`
This option creates a new WebSocket connection using the [ReconnectingWebSocket](https://www.npmjs.com/package/reconnecting-websocket)
 library. 
 You can provide the URL as a string, a Promise resolving to one, or a function that returns one. 

 If you want to set options on ReconnectingWebSocket or create a socket some other way, use the `clientSocket` option.

#### Client-side option: `clientSocket`
This option lets you supply a socket rather have the transport create one for you. You can provide a browser-standard socket, your own ReconnectingWebSocket instance, or something else that is API compatible to either.
The option accepts a socket, a Promise of one, or a function returning one.


## Server-side endpoint

As connections are made, your WebSocket server will likely offer access to the socket object in a listener. You'll need that to set up your server-side WranggleRpc endpoint. For example:

```
wss.on('connection', (socket, request) => {
  if (isValidUser(request)) {
    const transport = new WebSocketTransport({ serverSocket: socket });
    const rpc = new WranggleRpc({ transport });
    setupMyRpcRequestHandlers(rpc);
  }
}
```

The `wss` in the above example is for a library like [ws](https://www.npmjs.com/package/ws) but other WebSocket servers should offer something similar.

The `serverSocket` attrib is required. 

