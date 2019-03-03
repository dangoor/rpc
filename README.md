# WranggleRpc

WranggleRpc is a TypeScript/JavaScript library for calling code from one window/process that is running in a 
 different window/process. This is a common activity when building: 

* Electron apps (communicating between the UI and Node processes)
* Browser extensions (communicating between content pages, popup pages, service/background pages)
* Web pages (communicating between iframes or WebSocket servers)  
 
Without WranggleRpc, things can easily get tangled and ugly: one side will send a message, the other side listens for it, 
 acts on it, and sends back a response, which the original side must listen for, and so on. 
WranggleRpc makes it nice.   


### Quick Example

In a Chrome extension, we see code in the page/browser-tab window using WranggleRpc to call methods that live 
 in the main extension's window:     
 
```
import WranggleRpc from '@wranggle/rpc';
const remote = new WranggleRpc({ transport: 'chrome' }).remoteInterface();

async function screenshotIfDesired() {
  const userPrefs = await remote.getUserPrefs();  
  if (userPrefs.screenshot) {
    await remote.takeScreenshot();
  } 
} 
``` 

The `getUserPrefs` and `takeScreenshot` methods run in a different window, in the main extension. Without the send/bind message 
 clutter, calling them isn't much trouble. 
If you are using TypeScript, you can specify a remote interface to get autocomplete and type checking on your 
 remote calls. (eg:`new WranggleRpc<MyRemoteInterface>(opts)`)  

Of course, the remote endpoint needs to declare the method call requests it will handle but we can delegate the calls to 
 entire model instances. Here's what that looks like:   
 
```
import WranggleRpc from '@wranggle/rpc';
const rpc = new WranggleRpc({ transport: 'chrome' }); // note: in most cases we'd use additional transport options here. See BrowserExtensionTransport below. 

rpc.addRequestHandlerDelegate(userPrefs);    
rpc.addRequestHandler(takeScreenshot, someFunctionThatUsesChromeApi);
```  

Above, we configure our code in the main browser extension's background window to handle the calls. The `userPrefs` object 
 (an instance of some fictional UserPreferences class) is declared a delegate. Its methods are called whenever any incoming 
 requests matches on method name. (Assuming it isn't filtered out. See defaults and options for controlling method access 
 below.) If the model also offers a `savePreference` method, our browser-tab code could call that too.  
   
We use `addRequestHandler` to register a specific function. It would be insecure to blindly delegate all requests 
 to the powerful Chromium browser extension API, so for `takeScreenshot` we only register a single function.  
      
  
## Transports

WranggleRpc is not a metal-on-the-wire style framework like Thrift/AMP, but rather a candy-coating for the message-passing
 you already use. 
You create an instance of WranggleRpc in each window/process endpoint, giving each a transport that handles the message-passing 
 under the hood. The transport's job is to send a message to the desired endpoint and receive messages back. 
     
The main _@wranggle/rpc_ package ships with the following transports:

* BrowserExtensionTransport: messaging over chrome.runtime or chrome.tabs.  
* ElectronTransport: messaging over the Electron.js ipc system.
* LocalObserverTransport: messaging over a shared EventEmitter. (When both WranggleRpc endpoints are in the same window/process.)
* PostMessageTransport: messaging over window.postMessage. (When communicating across browser windows/iframes.)
* WebSocketTransport: messaging over websocket. (Communicating between browser and WebSocket server) 

Additional, _Relay_ can be used as a bridge between two transports, when a message needs to hop across an intermediate window/process. 
You can also create your own custom transports. 

Each transport has its own configuration options. Take a look at the README for the ones you plan on using.

