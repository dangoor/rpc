/// <reference types="node" />
import { EventEmitter } from "events";
import { RequestPayload, ResponsePayload, RpcTransport } from "./interfaces";
export interface LocalObserverTransportOpts {
    messageEventName: string;
}
/**
 * This is mostly for internal testing but does have a use/role in production, as syntactical sugar for events.
 * For example, rather than `myObserver.emit('ShowErrorAlert', 'Server is offline')` you might set up RPC with this transport
 * and then make use of with something like: alerts.show('Server is offline')
 *
 *
 */
export default class LocalObserverTransport implements RpcTransport {
    private readonly observer;
    private readonly eventName;
    private _isStopped;
    private _eventListener?;
    constructor(eventEmitter: EventEmitter, opts?: Partial<LocalObserverTransportOpts>);
    listen(handler: (payload: RequestPayload | ResponsePayload) => void): void;
    sendMessage(payload: RequestPayload | ResponsePayload): void;
    stopTransport(): void;
    _removeExistingListener(): void;
}
