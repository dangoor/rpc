import FlightReceipt, {RemotePromise} from "./flight-receipt";
import {IRequestPayload} from "./router";
const kvid = require('kvid');


export interface IRequestOpts {
  /**
   * Time in ms. If set to a positive number, the request will result in a TimeoutError should it not receive a response in the specified time
   * Default -1, no timeout.
   */
  timeout?: number;

  /**
   * When true, expect a response from the remote RPC instance. A failure timeout will be set if that option was set.
   * When false, the request is immediately assumed to have succeeded or failed, based on if the rpc connection was established
   * or not.
   */
  rsvp?: boolean;
}

const DefaultRequestOpts = {
  timeout: -1,
  rsvp: true,
};


export default class RemoteRequest {
  private requestOpts!: IRequestOpts;
  private _receipt?: FlightReceipt;
  readonly nodejsCallback?: (...args: any[]) => void;
  readonly methodName: string;
  readonly userArgs: any[];
  readonly requestId: string;
  private _payload?: IRequestPayload;


  constructor(methodName: string, userArgs: any[], requestOpts: IRequestOpts) {
    if (typeof userArgs[userArgs.length - 1] === 'function') {
      this.nodejsCallback = userArgs.pop();
    }
    this.methodName = methodName;
    this.userArgs = userArgs;
    this.requestId = kvid(12);
    this.opts(Object.assign({}, DefaultRequestOpts, requestOpts));

    this._initTimeout();
  }

  opts(requestOpts: IRequestOpts): void {
    this.requestOpts = Object.assign(this.requestOpts || {}, requestOpts);
  }

  isRsvp(): boolean {
    return !!this.requestOpts.rsvp;
  }

  buildPayload(endpointBaseData: Partial<IRequestPayload>): IRequestPayload {
    const { requestId, methodName, userArgs } = this;
    const payload = Object.assign(endpointBaseData, {
      requestId, methodName, userArgs,
      rsvp: this.isRsvp(),
      transportMeta: {},
    }) as IRequestPayload;
    this._payload = payload;
    return payload;
  }

  dataForPayload(): Partial<IRequestPayload> {
    const { requestId, methodName, userArgs } = this;
    return { requestId, methodName, userArgs, rsvp: this.isRsvp() };
  }
  
  flightReceipt(): RemotePromise<any> | FlightReceipt {
    const receipt = this._ensureFlightReceipt();
    if (this.nodejsCallback) {
      return receipt;
    } else {
      return receipt._decoratedPromise();
    }
  }

  responseReceived(error: any, ...result: any[]): void {
    this._ensureFlightReceipt()._remoteResponseReceived(error, ...result);
  }

  private _ensureFlightReceipt(): FlightReceipt {
    if (!this._payload) {
      throw new Error('Cannot get receipt before request data initialized');
    }
    if (!this._receipt) {
      this._receipt = new FlightReceipt(this._payload, this.nodejsCallback);
      const timeout = this.requestOpts.timeout;
      if (typeof timeout === 'number' && timeout > 0) {
        this._receipt.updateTimeout(timeout);
      }
    }
    return this._receipt;
  }

  private _initTimeout() {
    // todo: stash on this._timeout

  }
  private _clearTimeout() {
    // todo: clearTimeout(this._timeout). // call if value changes or if force-resolved
  }
}


