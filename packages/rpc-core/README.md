# WranggleRpc Misc

The `@wranggle/rpc-core` package is the main `WranggleRpc` class, used to create an RPC endpoint.

Its main documentation is in the [topmost README](/wranggle/rpc) of this monorepo. This rpc-core README holds odds and ends that don't belong there.


## LocalObserverTransport

The LocalObserverTransport is used when both WranggleRpc endpoints are in the same window/process.

It can be used as syntactical sugar to replace event-based activities. For example, a project might use a shared observer to send `myObserver.emit('ShowErrorAlert', 'Server is offline')` and listen for that message in the view-related area that can display the message. You might set up WranggleRpc with a LocalObserverTransport to instead write `view.showAlert('Server is offline')`.

### LocalObserverTransport setup

The LocalObserverTransport is available in `@wranggle/rpc-core` and `@wranggle/rpc`. Eg:
```javascript
import { LocalObserverTransport } from `@wranggle/rpc-core`;
// or
const { LocalObserverTransport } = require(`@wranggle/rpc-core`);
```

### LocalObserverTransport construction

* **observer**: EventEmitter instance (*required*). Both endpoints must be passed the same observer. 

* **messageEventName** Optional string. The eventName used for sending and receiving rpc messages. 


## Custom Transport

They don't need to do much:

* `sendMessage(payload: RequestPayload | ResponsePayload): void`
  
* `listen(onMessage: (payload: RequestPayload | ResponsePayload) => void): void`;

* `stopTransport(): void;`


## Additional / secondary WranggleRpc methods

Secondary/uncommon methods:

* **makeRemoteRequest()** Sends a remote request directly from the `WrangglRpc` instance, rather than making the call on the `remoteInterface`. 
  ```javascript
  rpc.makeRemoteRequest('showUserMessage', [ 'Export complete' ], { rsvp: false });
  ```
  Type signature is `makeRemoteRequest(methodName: string, userArgs: any[], requestOpts = <RequestOpts>{}): RemotePromise`

* **getSenderId()** returns the *senderId* value the endpoint uses when sending requests

* **getTransport()** returns the *transport* model as set by `useTransport`

* **WranggleRpc.registerTransport(shortcut: string, (transportOpts: any) => RpcTransport)** static method for registering a shortcut and factory for a custom transport. 
