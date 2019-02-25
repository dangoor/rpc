import {EventEmitter} from "events"; 
import {IRpcTransport} from "../rpc-core";
import {IRequestPayload, IResponsePayload} from "./router";


export interface ILocalObserverTransportOpts {
  messageEventName: string;
  // todo: option to preparse/filter
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
  private eventListener?: (payload: IRequestPayload | IResponsePayload) => void;

  constructor(eventEmitter: EventEmitter, opts=<Partial<ILocalObserverTransportOpts>>{}) {
    this.observer = eventEmitter;
    opts = Object.assign({}, DefaultOpts, opts);
    this.eventName = opts.messageEventName || DefaultOpts.messageEventName;
  }

  listen(handler: (payload: IRequestPayload | IResponsePayload) => void): void {
    this._removeExistingListener();
    this.eventListener = (payload: IRequestPayload | IResponsePayload) => {
      if (!this._isStopped) {
        handler(payload);
      }
    };
    this.observer.on(this.eventName, this.eventListener);
  }

  sendMessage(payload: IRequestPayload | IResponsePayload): void {
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