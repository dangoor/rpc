# WranggleRpc

WranggleRpc is a JavaScript/TypeScript library for calling code that lives and runs in a different window/process. This is especially helpful when building: 

* **Browser extensions** which have content page windows, popup windows, and service/background windows that must interact
* **Electron apps** with their mix of Node and browser window processes 
* **Web pages** using iframes, WebSocket servers, or web/service workers
 
Without WranggleRpc, things can easily get tangled and ugly: one side will send a message, the other side listens for it, acts on it, and sends back a response, which the original side must listen for, and so on. 

WranggleRpc makes it nice.   


## Quick Example

In a Chrome extension, page-injected code might use WranggleRpc to run methods that live in the main extension's window with something like:     
 
```javascript
import { WranggleRpc } from '@wranggle/rpc';
const remote = new WranggleRpc('chrome').remoteInterface();

async function screenshotIfDesired() {
  const userPrefs = await remote.getUserPrefs();  
  if (userPrefs.screenshot) {
    await remote.takeScreenshot();
  } 
} 
``` 

The above `getUserPrefs` and `takeScreenshot` methods run in a different window, in the main extension. Without the normal send/bind message clutter, calling them isn't much trouble. 

If using TypeScript, you'll also enjoy autocomplete and type checking on your remote calls when you specify a remote interface on WranggleRpc. eg: `new WranggleRpc<MyRemoteInterface>(myOpts)`

Of course, the remote endpoint needs to declare the methods it will handle but we can simply provide the methods on an existing model. Let's take a look at the other endpoint, the code in the main browser extension: 
 
```javascript
import { WranggleRpc } from '@wranggle/rpc';
const rpc = new WranggleRpc('chrome'); // note: we'll want to set other options here (covered below)

rpc.addRequestHandlerDelegate(userPrefs); 

rpc.addRequestHandler('takeScreenshot', someFunctionThatUsesChromeApi);
```  

The above `addRequestHandlerDelegate` lets the other endpoint call any method on the `userPrefs` model. (With default filters applied, see [Request Handlers](#Request-Handlers) section below.) If the model also offered a `savePreference` method, our browser-tab code could call that too. 
   
We use `addRequestHandler` to register a specific function, rather than an entire model. It would be insecure to blindly delegate all requests to the powerful Chromium browser extension API so for `takeScreenshot` we only register a single function.  

  
## Transports

WranggleRpc is not a metal-on-the-wire style framework like Thrift/AMP, but rather a candy-coating for the message-passing you already use. 

You create an instance of WranggleRpc in each window/process, giving each endpoint a transport that handles the message-passing. The transport's job is to send and receive arbitrary message data between your two endpoints.
     
The main _@wranggle/rpc_ package ships with the following transports:

* [BrowserExtensionTransport](https://github.com/wranggle/rpc/tree/master/packages/rpc-browser-extension-transport/): messaging over [chrome.runtime](https://developer.chrome.com/apps/runtime) or [chrome.tabs](https://developer.chrome.com/extensions/tabs) (for Firefox, Chromium, Edge browser extensions) 
* [ElectronTransport](https://github.com/wranggle/rpc/tree/master/packages/rpc-electron-transport/): messaging over the [Electron.js](https://electronjs.org/docs/api) ipc system.
* [LocalObserverTransport](https://github.com/wranggle/rpc/tree/master/packages/rpc-core/#LocalObserverTransport): messaging over any shared, standard EventEmitter. (When both WranggleRpc endpoints are in the same window/process.)
* [PostMessageTransport](https://github.com/wranggle/rpc/tree/master/packages/rpc-post-message-transport/): messaging over window.postMessage. (When communicating across browser windows/iframes.)
* [WebSocketTransport](https://github.com/wranggle/rpc/tree/master/packages/rpc-websocket-transport/): messaging over [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket). (Communicating between WebSocket client and server) 

Additional, a [Relay](https://github.com/wranggle/rpc/tree/master/packages/rpc-relay) can be used as a bridge between any two transports, when a message needs to hop across an intermediate window/process. You can also create your own [custom transport](https://github.com/wranggle/rpc/tree/master/packages/rpc-core/#Custom-Transport). 

Each transport has its own configuration options. Take a look at the README for each of the ones you use.


## Usage

1. Add the package [@wranggle/rpc](https://www.npmjs.com/package/@wranggle/rpc) to your project:
    ```bash
    # From the command line using yarn:
    yarn add @wranggle/rpc
    
    # or with npm:
    npm install @wranggle/rpc 
    ```
    Note: if your project is set up to use ES6 and *import* statements, see the [individual package](#Individual-Packages) distribution alternative below. 

2. In each of your two JavaScript window/process endpoints, require or import  WranggleRpc:
    ```javascript
    import { WranggleRpc } from '@wranggle/rpc'; 
    // or:
    const { WranggleRpc } = require('@wranggle/rpc');  
    ```
 

3. In each window/process, instantiate WranggleRpc with the correct [transport](#Transports) plus any desired options. 
   
   Example: 
   ```javascript
   const rpc = new WranggleRpc({ 
     channel: 'blog-article-crud',
     transport: transportForThisEndpoint
   });
   ```
   
   When you create your `new WranggleRpc(opts)` endpoint, set your _opts_ using the [Options section](#WranggleRpc-options) below.
   
   You'll also want to add some [Request Handlers](#Request-Handlers).
   
   And make some [Remote Requests](#Remote-Requests).


## Request Handlers

When you make an RPC method call like `remote.liftSomething('heavy')` the other endpoint sees it as a request to run "liftSomething" and tries to find a matching handler for that method name. 

You can register entire models, sharing their methods with the other endpoint, or specific functions. These request handlers can return a value (or a Promise of one) which is sent back to the other endpoint, resolving the original call. 


#### Delegated approach: share methods of a model

In this approach, you delegate the methods of an entire model using `rpc.addRequestHandlerDelegate(delegate: object, opts?: DelegatedRequestHandlerOpts)`. 

For example:

```javascript
rpc.addRequestHandlerDelegate(currentBlogArticle, {
  ignoreWithUnderscorePrefix: true,
})
```
In the above example, methods name `create` and `update` on the *currentBlogArticle* model would run, but `_destroy` would not run.

Options for `addRequestHandlerDelegate`: 
* **shouldRun**: a whitelist of method names (as an array or Set). Eg:
  ```javascript
  rpc.addRequestHandlerDelegate(myModel, {
    shouldRun: [ 'create', 'update' ]
  })  
  ```
  Alternatively, provide a filter function. The function must return `true` for the method to run. Eg:
  ```javascript
  rpc.addRequestHandlerDelegate(myModel, {
    shouldRun: (methodName) => methodName === 'create' || methodName === 'update'
  });      
  ```
  The type signature of this filter function is: `(methodName: string, delegatedModel: object, ...userArgs: any[]) => boolean`

* **ignoreInherited**: When true, inherited methods are not run. Only methods on the current class can run, not its *super*. (Only methods on the immediate object and its prototype will run.) Default is *true*.
* **ignoreWithUnderscorePrefix**: when true, does not run method if it starts with an underscore "_". Default is *true*.

You can delegate multiple models if desired. WranggleRpc will run the first method it finds that passes all filters. 


#### Registering specific functions

You can add a specific function with `rpc.addRequestHandler()`. For example:
```javascript
rpc.addRequestHandler('liftSomething', myUsefulFunction);
```

If the other endpoint calls `remote.liftSomething('quickly, { carefully: true })`, our newly registerd `myUsefulFunction` will serve that request, receiving the same arguments sent in the call. The function can return a value or a promise (and so can be an `async function` too).

You can pass in options as a third parameter to *addRequestHandler*. *useCallback* will add a Node.js-style callback when calling the function, using that to resolve the method response (and ignore whateveer the handler function returns directly.) You can also provide a `context` to set "this" when running your function. (But remember that "this" cannot be changed for arrow functions.) The full type signature is: `rpc.addRequestHandler(methodName: string, handlerFn: (...args: any[] => any | Promise<any>), opts?: NamedRequestHandlerOpts) => RemotePromise`. 

A convenience meethod `rpc.addRequestHandlers(functionsByMethodName, optionalContext)` is also available. It loops over the passed in object, registering each function.


## WranggleRpc options

Set these options when you construct your WranggleRpc endpoint. You can also update them after construction using `rpc.opts(updatedOpts)`.

Main options:

* **allRequestOpts**. *RequestOpts object*. Sets default options for all remote requests sent from this endpoint. The defaults are refined/overriden with values set by the `setDefaultRequestOptsForMethod` method or set directly on a `RemotePromise`.
* **channel**: *string*. Unless the remote endpoint uses the exact same *channel* value, WranggleRpc will ignore its remote requests.
* **transport**: The value of this is passed to the WranggleRpc *useTransport* method, setting up the transport which is required before the endpoint can be used. 

Additionally, each transport adds its own shortcut to WranggleRpc options. For example, the "electron" options here are used as a shortcut for setting `transport` to `new ElectronTransport({ ipcSender: ipcRenderer })`:
```javascript
const rpc = new WranggleRpc({
  channel: 'os-file-dialogs',
  electron: { ipcSender: ipcRenderer } // explained in ElectronTransport's own README
})
```

Secondary options:

* **preparseAllIncomingMessages** A function/hook that lets you modify or filter raw RPC request and response payload messages. It runs after the transport receives the message and after WranggleRpc verifies it is a properly formatted message but before it is passed to a request handler. Eg:
  ```javascript
  const rpc = new WranggleRpc({ 
    preparseAllIncomingMessages: (payload) => _checkHmac(payoad.myMeta)
  })
  ```
  The function can return either a modified payload or `true` to mean use the passed-in payload, anything else means invalidate/ignore.
   

* **senderId** A string included on each message payload identifying the sender endpoint. It is generated randomly by default but can be specified here for debug purposes. The two endpoints must use different senderId values.
   

## WranggleRpc methods

The following methods are called on the WranggleRpc instance. (The "`rpc`" variable in most examples and refered to as an *endpoint* in most explanations.)

* **setDefaultRequestOptsForMethod(methodName: string, opts: RequestOptions)** Applies request options to all remote calls for a specific method name.  For example, a backend process might tell a frontend window to display a user message without needing a response, so we can set its *rsvp* option to *false*:
  ```javascript
  rpc.setDefaultRequestOptsForMethod('showUserMessage', { rsvp: false });
  rpc.remoteInterface().showUserMessage('Action complete!'); // now the other endpoint won't send back a response; the returned Promise resolves immediately
  ```

* **useTransport(transport: RpcTransport)** explicitly sets the RpcTransport for this endpoint. Usually you'll create and set the transport using a shortcut when constructing the WranggleRpc endpoint (as described on the transport's individual README.)

Covered in other sections:
* Request handler methods: see `addRequestHandler` and `addRequestHandlerDelegate` in Request Handler section.
* `remoteInterface()` See section on Remote Requests 
* `rpc.opts(opts: RpcOpts)` see section on WranggleRpc Options 


Secondary/uncommon methods:

* **makeRemoteRequest()** Sends a remote request directly from the `WrangglRpc` instance, rather than making the call on the `remoteInterface`. 
  ```javascript
  rpc.makeRemoteRequest('showUserMessage', [ 'Export complete' ], { rsvp: false });
  ```
  Type signature is `makeRemoteRequest(methodName: string, userArgs: any[], requestOpts = <RequestOpts>{}): RemotePromise`

* **getSenderId()** returns the *senderId* value the endpoint uses when sending requests

* **getTransport()** returns the *transport* model as set by `useTransport`

* **WranggleRpc.registerTransport(shortcut: string, (transportOpts: any) => RpcTransport)** static method for registering a shortcut and factory for a custom transport. 

## Remote Requests

You make your requests on WranggleRpc's `remoteInterface`, eg:
```javascript
const rpc = new WranggleRpc(myOpts);
const remote = rpc.remoteInterface();
remote.withSugar(3, 'lumps');
```

If using TypeScript, import and apply an interface during construction, where `new WranggleRpc<T>(opts)` gives you `remoteInterface(): T`. For example:
```javascript
import { MainProcessMethods } from 'src/main/api/interfaces.ts';
import { WranggleRpc } from '@wranggle/rpc';
const rpc = new WranggleRpc<MainProcessMethods>(myOpts);
const remote = rpc.remoteInterface(); // remote now has MainProcessMethods typings
```

When you make remote method calls, it returns a `RemotePromise`. It behaves like a normal Promise, resolving to whatever the remote method returns. eg: 
```javascript
const remotePromise = remote.recordWinner({ redTeam: 3, blueTeam: 2 });
remotePromise.then((teamRank) => this.teamRank = teamRank));
```
Since it is a Promise, we could replace "then" with "await" when in an async function: `this.rank = await remotePromise;`

The _RemotePromise_ also offers some additonal methods:

* _updateTimeout(durationInMs)_ Set or update timeout for a single request. Eg:
  ```javascript
  const remotePromise = remote.promptUserToSkipStep();
  remotePromise.updateTimeout(2500);
  ```
  If a response isn't received in the specified time in milliseconds, the RemotePromise will be rejected.
  (Note: you can set a default timeout by method name using `rpc.setDefaultRequestOptsForMethod` or a default for all rpc requests in `rpc.opts`. 
   
* _resolveNow(...results)_ force the RemotePromise to resolve immediately
* _rejectNow(reason)_ force reject the RemotePromise
* _info()_ returns info about about the remote request. (timestamps, status)



## Individual Packages

The `@wranggle/rpc` package bundles all of the transports plus their dependencies into a single CommonJs file. If your environment will accept ES6 and `import` statements, it's better to load just the modules you use. 
Each transport is available as a separate package on NPM and you can import WranggleRpc itself from [@wranggle/rpc-core](https://www.npmjs.com/package/@wranggle/rpc-core).
