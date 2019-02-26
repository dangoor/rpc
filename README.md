# WranggleRpc

WranggleRpc is a TypeScript/JavaScript library for calling code from one window/context that is running in a 
 different window/context. This is a common activity when building: 

* Electron apps (communicating between the UI and Node processes)
* Browser extensions (communicating between content pages, popup pages, service/background pages)
* Web pages (communicating between iframes and Node-based web and websocket servers)  
 
Normally developers send messages back and forth between the contexts, manually handling them as events. One side will send 
 a message, the other side listens for it, acts on it, and sends back a response, which the original side must listen for, and 
 so on. It gets tangled and ugly quickly. WranggleRpc makes it nice. 


### Quick Example

Pretend a content script in a Chromium extension needs to run functions that live in the extension's background script, a different
 context:
 
```
import WranggleRpc from '@wranggle/rpc';
const remoteControl = new WranggleRpc('chrome').remoteInterface();

async function screenshotIfDesired() {
  const userPrefs = await remoteControl.getUserPrefs(); 
  if (userPrefs.screenshot) {
    await remoteControl.takeScreenshot();
  } 
} 
``` 

In the above example, it uses the code of a different window almost like they were imported locally. 
 If you are using TypeScript, you can specify an interface (eg `new WranggleRpc<MyRemoteInterface>(opts)`) to get autocomplete
 and type checking on your remote calls. 

That remote endpoint (in the browser extension background context) needs to register the requests it handles, but this can be 
 done quite easily, using by registering the functions directly or by delegating entire objects/models, eg:
 
```
import WranggleRpc from '@wranggle/rpc';
const rpc = new WranggleRpc('chrome'); // note: in most cases we'd add additional options here. See ChromeTransport below. 

rpc.addRequestHandlerDelegate(userPrefs);   
rpc.addRequestHandler(takeScreenshot, someFunctionThatUsesChromeApi);
```  

In the above example, we assume "userPrefs" is an instance of some fictional UserPreferences class, one that offers other methods,
 such as a "savePreference" which the content script can now use seamlessly. (note: you can refine/control method access, see below.)      

  
## Transports

WranggleRpc is not a metal-on-the-wire style framework like Thrift/AMP, but rather a candy-coating for the message-passing
 transports you already use. 
 
The main _@wranggle/rpc_ package ships with:

* PostMessageTransport: messaging over window.postMessage. For windows/iframes.
* ElectronTransport: messaging over the Electron.js ipc system.
* ChromeTransport: messaging over chrome.runtime or chrome.tabs Chromium APIs 
* WebSocketTransport: messaging over websocket 
* RelayTransport: bridge between two other transports, when a message needs to go through an intermediate window/context.
        
You can also create your own custom transports. 


   