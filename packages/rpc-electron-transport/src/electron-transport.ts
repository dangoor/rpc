import {ResponsePayload, RpcTransport} from "rpc-core/src/interfaces";
import {RequestPayload} from "rpc-core/src/interfaces";


export interface ElectronTransportOpts {
  /**
   * A reference to the Electron IPC object responsible for sending messages.
   *
   * If for a WranggleRpc endpoint in a renderer/ui process (sending to the main process) you would use the _ipcRenderer_ from: `const { ipcRenderer } = require('electron')`
   *
   * If for an endpoint in the Main process (sending to a renderer) you would use _webContents_ (eg `myBrowserWindow.webContents`
   *   after creating the `new BrowserWindow()`)
   */
  sender: SenderInstance;

  /**
   * A reference to the Electron IPC object responsible for receiving messages.
   *
   * If for a WranggleRpc endpoint in a renderer/ui process, you would use the _ipcRenderer_ from: `const { ipcRenderer } = require('electron')`
   *
   * If for an endpoint in the Main process, it would again be _ipcMain_ from: `const { ipcMain } = require('electron')`
   */
  receiver: ReceiverInstance;

  /**
   * Electron IPC channel name. Optional.
   */
  electronChannel?: string;
}

const DefaultChannel = 'ElectronTransportForWranggleRpc';


export default class ElectronTransport implements RpcTransport {
  private _isStopped = false;
  private readonly sender: SenderInstance;
  private readonly receiver: ReceiverInstance;
  private readonly channel: string;
  private _payloadHandler?: (payload: RequestPayload | ResponsePayload) => void;

  constructor(opts: ElectronTransportOpts) {
    if (!opts || !_isIpcSender(opts.sender)) {
      throw new Error('ElectronTransport expecting ipc reference with a function to "send"');
    }
    if (!_isIpcReceiver(opts.receiver)) {
      throw new Error('ElectronTransport expecting ipc receiver reference with functions "on" and "removeListener"');
    }
    this.sender = opts.sender;
    this.receiver = opts.receiver;
    this.channel = opts.electronChannel || DefaultChannel;
  }

  listen(rpcHandler: (payload: (RequestPayload | ResponsePayload)) => void): void {
    this._removeExistingListener();
     this._payloadHandler = (payload: RequestPayload | ResponsePayload) => {
      if (!this._isStopped) {
        rpcHandler(payload);
      }
    };
    this.receiver.on(this.channel, this._payloadHandler);
  }

  sendMessage(payload: RequestPayload | ResponsePayload): void {
    if (this._isStopped) {
      return;
    }
    this.sender.send(this.channel, payload);
  }

  stopTransport(): void {
    this._isStopped = true;
    this._removeExistingListener();
  }

  _removeExistingListener() {
    this._payloadHandler && this.receiver.removeListener(this.channel, this._payloadHandler);
  }

}


function _isIpcReceiver(obj: any): boolean {
  return obj && [ 'on', 'removeListener'].every(m => typeof obj[m] === 'function')
}

function _isIpcSender(obj: any): boolean {
  return obj && typeof obj.send === 'function';
}



type Listener = (data: any) => void;

interface SenderInstance {
  send: (channel: string, data: any) => void;
}

interface ReceiverInstance {
  on: (channel: string, listener: Listener) => void;
  removeListener: (channel: string, listener: Listener) => void;
}
