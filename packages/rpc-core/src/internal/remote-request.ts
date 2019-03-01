import FlightReceipt from "./flight-receipt";
import {RequestOpts, RequestPayload, RemotePromise} from "../interfaces";
import buildPromiseResolver, {PromiseResolver} from "../util/promise-resolver";


const kvid = require('kvid');


const DefaultRequestOpts = {
  timeout: -1,
  rsvp: true,
};


export default class RemoteRequest {
  private requestOpts!: RequestOpts;
  private _receipt?: FlightReceipt;
  private readonly _requestResolver: PromiseResolver;
  readonly nodejsCallback?: (...args: any[]) => void;
  readonly methodName: string;
  readonly userArgs: any[];
  readonly requestId: string;
  private _payload?: RequestPayload;
  private _wasSent = false;

  constructor(methodName: string, userArgs: any[], requestOpts: RequestOpts) {
    if (typeof userArgs[userArgs.length - 1] === 'function') {
      this.nodejsCallback = userArgs.pop();
    }
    this.methodName = methodName;
    this.userArgs = userArgs;
    this.requestId = kvid(12);

    this._requestResolver = buildPromiseResolver();
    this.opts(Object.assign({}, DefaultRequestOpts, requestOpts));

    this._initTimeout();
  }

  opts(requestOpts: RequestOpts): void {
    this.requestOpts = Object.assign(this.requestOpts || {}, requestOpts);
  }

  isRsvp(): boolean {
    return !!this.requestOpts.rsvp;
  }

  buildPayload(endpointBaseData: Partial<RequestPayload>): RequestPayload {
    const { requestId, methodName, userArgs } = this;
    const payload = Object.assign(endpointBaseData, {
      requestId, methodName, userArgs,
      rsvp: this.isRsvp(),
      transportMeta: {},
    }) as RequestPayload;
    this._payload = payload;
    return payload;
  }

  dataForPayload(): Partial<RequestPayload> {
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

  markAsSent(): void {
    this._wasSent = true;
    this._requestResolver.resolve();
  }

  responseReceived(error: any, ...result: any[]): void {
    this._ensureFlightReceipt()._remoteResponseReceived(error, ...result);
  }

  private _ensureFlightReceipt(): FlightReceipt {
    if (!this._payload) {
      throw new Error('Cannot get receipt before request data initialized');
    }
    if (!this._receipt) {
      this._receipt = new FlightReceipt({
        payload: this._payload,
        nodejsCallback: this.nodejsCallback,
        promiseSent: this._requestResolver.promise,
        updateRequestOpts: (opts: RequestOpts) => {
          if (this._wasSent) {
            throw new Error('RPC request was already sent');
          }
        }
      });
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


