import {EndpointInfo, ResponsePayload, RpcTransport} from "rpc-core/src/interfaces";
import {RequestPayload} from "rpc-core/src/interfaces";
import {registerTransport} from "rpc-core/src/transport-shortcut-registration";


export interface ElectronTransportOpts {
  /**
   * A reference to the Electron IPC object responsible for sending messages.
   *
   * If WranggleRpc endpoint is in a renderer/ui process (sending to the main process) you would use the _ipcRenderer_ from: `const { ipcRenderer } = require('electron')`
   *
   * If endpoint in in the Main process (sending to a renderer) you would use _webContents_ (eg `myBrowserWindow.webContents`
   *   after creating the `new BrowserWindow()`)
   */
  ipcSender: SenderInstance;

  /**
   * A reference to the Electron IPC object responsible for receiving messages.
   *
   * If WranggleRpc endpoint is in a renderer/ui process, you would use the _ipcRenderer_ from: `const { ipcRenderer } = require('electron')`
   *
   * If endpoint is in the Main process, it would again be _ipcMain_ from: `const { ipcMain } = require('electron')`
   */
  ipcReceiver: ReceiverInstance;

  /**
   * Optional. Electron IPC channel name used for both sending and receiving messages.
   */
  ipcChannel?: string;

  /**
   * Optional. Minor. Electron IPC channel name used for sending messages. The other endpoint should use this channel as
   * its ipcChannelReceiving.
   */
  ipcChannelSending?: string;

  /**
   * Optional. Minor. Electron IPC channel name used for receiving messages. The other endpoint should use this channel as
   * its ipcChannelSending.
   */
  ipcChannelReceiving?: string;
}

const DefaultElectronChannel = 'ElectronTransportForWranggleRpc';


export default class ElectronTransport implements RpcTransport {
  private _isStopped = false;
  private readonly sender: SenderInstance;
  private readonly receiver: ReceiverInstance;
  private readonly ipcChannelSending: string;
  private readonly ipcChannelReceiving: string;
  private _listenHandler?: (payload: RequestPayload | ResponsePayload) => void;
  private endpointId = 'unknown';

  constructor(opts: ElectronTransportOpts) {
    if (!opts || !_isIpcSender(opts.ipcSender)) {
      throw new Error('ElectronTransport expecting ipc reference with a function to "send"');
    }
    if (!_isIpcReceiver(opts.ipcReceiver)) {
      throw new Error('ElectronTransport expecting ipc receiver reference with functions "on" and "removeListener"');
    }
    this.sender = opts.ipcSender;
    this.receiver = opts.ipcReceiver;
    this.ipcChannelSending = opts.ipcChannelSending || opts.ipcChannel || DefaultElectronChannel;
    this.ipcChannelReceiving = opts.ipcChannelReceiving || opts.ipcChannel || DefaultElectronChannel;

  }

  listen(rpcHandler: (payload: (RequestPayload | ResponsePayload)) => void): void {
    this._removeExistingListener();
    this._listenHandler = (payload: RequestPayload | ResponsePayload) => {
      if (!this._isStopped) {
        rpcHandler(payload);
      }
    };

    this.receiver.on(this.ipcChannelReceiving, (evt: any, data: RequestPayload | ResponsePayload) => { // todo: Electron ts type for Event
      this._listenHandler && this._listenHandler(data)
    });
  }

  sendMessage(payload: RequestPayload | ResponsePayload): void {
    if (this._isStopped) {
      return;
    }
    this.sender.send(this.ipcChannelSending, payload);
  }

  updateEndpointInfo(info: EndpointInfo) {
    this.endpointId = info.senderId;
  }

  stopTransport(): void {
    this._isStopped = true;
    this._removeExistingListener();
  }

  _removeExistingListener() {
    this._listenHandler && this.receiver.removeListener(this.ipcChannelReceiving, this._listenHandler);
  }

}


function _isIpcReceiver(obj: any): boolean {
  return obj && [ 'on', 'removeListener'].every(m => typeof obj[m] === 'function')
}

function _isIpcSender(obj: any): boolean {
  return obj && typeof obj.send === 'function';
}


registerTransport('electron', (opts: ElectronTransportOpts) => new ElectronTransport(opts));


type ElectronListener = (evt: any, data: any) => void; // todo: Electron types (for Event)

interface SenderInstance {
  send: (channel: string, data: any) => void;
}

interface ReceiverInstance {
  on: (channel: string, listener: ElectronListener) => void;
  removeListener: (channel: string, listener: ElectronListener) => void;
}
