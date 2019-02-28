# WranggleRpc

WranggleRpc is a TypeScript/JavaScript library for calling code from one window/process that is running in a 
 different window/process. This is a common activity when building: 

* Electron apps (communicating between the UI and Node processes)
* Browser extensions (communicating between content pages, popup pages, service/background pages)
* Web pages (communicating between iframes or WebSocket servers)  
 
Without WranggleRpc, you send messages back and forth manually handling them as events. One side will send 
 a message, the other side listens for it, acts on it, and sends back a response, which the original side must listen for, and 
 so on. It gets tangled and ugly quickly. WranggleRpc makes it nice. 


### Quick Example

In a Chrome extension, code in the page/browser-tab side uses WranggleRpc to call methods that live in the main extension 
 with something like this:    
 
```
import WranggleRpc from '@wranggle/rpc';
const remote = new WranggleRpc('chrome').remoteInterface();

async function screenshotIfDesired() {
  const userPrefs = await remote.getUserPrefs();  
  if (userPrefs.screenshot) {
    await remote.takeScreenshot();
  } 
} 
``` 

The `getUserPrefs` and `takeScreenshot` methods run in a different window, in the main extension. Without the send/bind message 
 clutter it feels like locally imported code. 
If you are using TypeScript, you can specify a remote interface to get autocomplete and type checking on your 
 remote calls. (eg:`new WranggleRpc<MyRemoteInterface>(opts)`)  

The remote endpoint (the browser extension background window in this case) needs to declare the method call requests it 
 will handle. We can register individual functions or delegate the calls to entire model instances. Here's what both approaches 
 look like:  
 
```
import WranggleRpc from '@wranggle/rpc';
const rpc = new WranggleRpc('chrome'); // note: in most cases we'd use additional transport options here. See ChromeTransport below. 

rpc.addRequestHandlerDelegate(userPrefs);    
rpc.addRequestHandler(takeScreenshot, someFunctionThatUsesChromeApi);
```  

In the above example, the `userPrefs` object (an instance of some fictional UserPreferences class) is declared a delegate. When
 the method name of an incoming request matches one of its methods, that will be used to serve the request. (Assuming it 
 isn't filtered out. See defaults and options for controlling method access below.) If the model also offers a `savePreference`
 method, our browser-tab code can call that too.  

We use `addRequestHandler` to register a specific function. It would be a security blunder to blindly delegate all requests 
 to the powerful Chromium browser extension API, so for `takeScreenshot` we only expose the one that's needed. 
      
  
## Transports

WranggleRpc is not a metal-on-the-wire style framework like Thrift/AMP, but rather a candy-coating for the message-passing
 you already use. 
You create an instance of WranggleRpc in each window/process endpoint, giving each a transport that handles the message-passing 
 under the hood. The transport's job is to send a message to the desired endpoint and receive messages back. 
     
The main _@wranggle/rpc_ package ships with:

* BrowserExtensionTransport: messaging over chrome.runtime or chrome.tabs.  
* ElectronTransport: messaging over the Electron.js ipc system.
* LocalObserverTransport: messaging over a shared EventEmitter. (When both WranggleRpc endpoints are in the same window/process.)
* PostMessageTransport: messaging over window.postMessage. (When communicating across browser windows/iframes.)
* WebSocketTransport: messaging over websocket. (Communicating between browser and WebSocket server) 

Additional, _Relay_ can be used as a bridge between two transports, when a message needs to hop across an intermediate window/process. 
You can also create your own custom transports. 

Each transport has its own configuration options. Take a look at the README for the ones you plan on using.

