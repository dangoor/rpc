# BrowserExtensionTransport

A WranggleRpc transport for browser extensions, sending and receiving messages over
messaging over either [chrome.runtime](https://developer.chrome.com/apps/runtime) or [chrome.tabs](https://developer.chrome.com/extensions/tabs).

Firefox and Edge also support these Chromium APIs. 


## Usage 

If you are using the full [@wranggle/rpc](https://www.npmjs.com/package/@wranggle/rpc) package, the BrowserExtensionTransport is already
 bundled within. You can import/require it with: 

```javascript
import { WranggleRpc, BrowserExtensionTransport } from '@wranggle/rpc';
// or
const { WranggleRpc, BrowserExtensionTransport } = require('@wranggle/rpc');
```

#### Unbundled Alternative
If you prefer using just the packages you need, the unbundled es6 is also available on NPM:

```bash
yarn add @wranggle/rpc-core @wranggle/rpc-browser-extension-transport
# or
npm install @wranggle/rpc-core @wranggle/rpc-browser-extension-transport 
```

Unbundled import:
```javascript
import WranggleRpc from '@wranggle/rpc-core';
import BrowserExtensionTransport from '@wranggle/rpc-browser-extension-transport';
```

#### Shortcut
When creating your WranggleRpc endpoint, you can use the `browserExtension` shorcut to also construct this transport. Eg:

```javascript
const rpc = new WranggleRpc({
  browserExtension: { forTabId: 50 }
})
```


