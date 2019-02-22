import {EventEmitter} from "events";
import {IRpcPayload, IRpcTransport} from "./rpc-core";


export interface ILocalObserverTransportOpts {
  messageEventName: string;
}
const DefaultOpts = {
  messageEventName: 'LocalRpcEvent'
};

/**
 * This is mostly for internal testing but does have a use/role in production, as syntactical sugar for events.
 * For example, rather than `myObserver.emit('ShowErrorAlert', 'Server is offline')` you might set up RPC with this transport
 * and then make use of with something like: alerts.show('Server is offline')
 *
 * 
 */
export default class LocalObserverTransport implements IRpcTransport {
  private readonly observer: EventEmitter;
  private readonly eventName: string;
  private _isStopped = false;
  private eventListener;

  constructor(eventEmitter: EventEmitter, opts=<Partial<ILocalObserverTransportOpts>>{}) {
    this.observer = eventEmitter;
    opts = Object.assign({}, DefaultOpts, opts);
    this.eventName = opts.messageEventName;
  }

  listen(handler: (payload: IRpcPayload) => void): void {
    this._removeExistingListener();
    this.eventListener = (payload: IRpcPayload) => {
      if (!this._isStopped) {
        handler(payload);
      }
    };
    this.observer.on(this.eventName, this.eventListener);
  }

  sendMessage(payload: IRpcPayload): void {
    if (!this._isStopped) {
      this.observer.emit(this.eventName, payload);
    }
  }

  stopTransport(): void {
    this._isStopped = true;
    this._removeExistingListener();
  }

  _removeExistingListener() {
    this.eventListener && this.observer.off(this.eventName, this.eventListener);
  }
}