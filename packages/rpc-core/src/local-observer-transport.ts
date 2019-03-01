import {EventEmitter} from "events"; 
import {RequestPayload, ResponsePayload, RpcTransport} from "./interfaces";


export interface LocalObserverTransportOpts {
  messageEventName: string;
}
const DefaultOpts = {
  messageEventName: 'LocalRpcEvent'
};

export declare abstract class LocalObserverTransport {
  protected constructor(eventEmitter: EventEmitter, opts: Partial<LocalObserverTransportOpts>);
}

/**
 * This is mostly for internal testing but does have a use/role in production, as syntactical sugar for events.
 * For example, rather than `myObserver.emit('ShowErrorAlert', 'Server is offline')` you might set up RPC with this transport
 * and then make use of with something like: alerts.show('Server is offline')
 *
 * 
 */
export default class LocalObserverRpcTransport implements RpcTransport, LocalObserverRpcTransport {
  private readonly observer: EventEmitter;
  private readonly eventName: string;
  private _isStopped = false;
  private _eventListener?: (payload: RequestPayload | ResponsePayload) => void;

  constructor(eventEmitter: EventEmitter, opts=<Partial<LocalObserverTransportOpts>>{}) {
    if (!_isEventEmitter(eventEmitter)) {
      console.error('LocalObserverTransport expecting an EventEmitter for its first param. Got:', eventEmitter);
      throw new Error('InvalidArgument constructing LocalObserverTransport');
    }
    this.observer = eventEmitter;
    opts = Object.assign({}, DefaultOpts, opts);
    this.eventName = opts.messageEventName || DefaultOpts.messageEventName;
  }

  listen(handler: (payload: RequestPayload | ResponsePayload) => void): void {
    this._removeExistingListener();
    this._eventListener = (payload: RequestPayload | ResponsePayload) => {
      if (!this._isStopped) {
        handler(payload);
      }
    };
    this.observer.on(this.eventName, this._eventListener);
  }

  sendMessage(payload: RequestPayload | ResponsePayload): void {
    if (!this._isStopped) {
      this.observer.emit(this.eventName, payload);
    }
  }

  stopTransport(): void {
    this._isStopped = true;
    this._removeExistingListener();
  }

  _removeExistingListener() {
    this._eventListener && this.observer.removeListener(this.eventName, this._eventListener);
  }
}

function _isEventEmitter(obj: any): boolean {
  return typeof(obj === 'object') && [ 'on', 'emit', 'removeListener' ].every(m => typeof obj[m] === 'function');
}