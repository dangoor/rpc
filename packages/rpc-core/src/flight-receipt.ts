import {IRequestPayload} from "./router";
const { composeExtendedPromise } = require('./util/composition-util.js');


interface IRequestInfo {
  requestId: string;
  requestedAt: Date;
  completedAt?: Date;
  status: Status;
  // todo: methodName and args
}

export interface RemotePromise<T> extends Promise<T> {
  isPending(): boolean;
  info(): IRequestInfo;
  resolveNow(...results: any[]): void;
  rejectNow(reason: any): void;
}


export enum Status {
  Pending = 'Pending',
  RemoteError = 'RemoteError',
  RemoteResult = 'RemoteResult',
  ForcedError = 'ForcedError',
  ForcedResult = 'ForcedResult',
  SkipRsvp = 'SkipRsvp',
}

export default class FlightReceipt {
  private readonly requestPayload: IRequestPayload;
  private readonly _responseResolver: IResponseResolver;
  private readonly nodejsCallback!: void | ((...args: any[]) => void);
  private readonly requestedAt: number;
  private completedAt?: number;
  private status = Status.Pending;

constructor(requestPayload: IRequestPayload, nodejsCallback?: (...args: any[]) => void) {
    this.requestPayload = requestPayload;
    this.nodejsCallback = nodejsCallback;
    this.requestedAt = Date.now();
    this._responseResolver = this._initResponseResolver();
    if (this.rsvp === false) {
      this._markResolution(Status.SkipRsvp, null);
    }
  }

  isPending(): boolean {
    return this.status === Status.Pending;
  }

  info(): IRequestInfo {
    const { requestedAt, completedAt, status } = this;
    return { ...this.requestPayload,
      requestedAt: new Date(requestedAt),
      completedAt: completedAt ? new Date(completedAt) : void(0),
      status
    };
  }

  resolveNow(...results: any[]): void {
    this._markResolution(Status.ForcedResult, null, ...results);
    // todo: _nodejsCallback case
  }

  rejectNow(reason: any): void {
    this._markResolution(Status.ForcedError, reason);
    // todo: _nodejsCallback case
  }

  updateTimeout(ms: number): void {
    // todo: implement. cancel existing if present. pass in callback from RemoteRequest?
  }

  get rsvp() {
    return this.requestPayload.rsvp;
  }
  
  _decoratedPromise(): RemotePromise<any> {
    const promise = this._responseResolver.promise;
    this._ensurePromiseDecorated(promise);
    // @ts-ignore
    return promise;
  }

  _remoteResponseReceived(error: any, ...result: any[]): void {
    this._markResolution(error ? Status.RemoteError : Status.RemoteResult, error, ...result);
  }

  _initResponseResolver(): IResponseResolver {
    let promise, resolve, reject;
    promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    // @ts-ignore
    return { promise, resolve, reject };
  }

  private _ensurePromiseDecorated(promise: Promise<any>): void {
    // @ts-ignore
    if (typeof promise.resolveNow === 'function') {
      return;
    }
    composeExtendedPromise(promise, this, FlightReceipt.prototype);

    // notes:
    // I first tried to make this class extend Promise. TypeScript made it awkward to stash the resolve/reject executor params
    // complaining about anything before super. Got past that with an extra superclass to do the stashing (alternatively it could
    // use plain js with prototype acrobatics) but the resulting behavior was broken. (eg, await would accept the promise but
    // would clobber any resulting value.) Lots posted on the subject but I decided to drop that line for now, just copying
    // the desired methods onto the promise.
    //
    // Alternatively, can maybe try `implements Promise`. ts declarations for them would be:
    // then!: <TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) => Promise<TResult1 | TResult2>;
    // catch!: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) => Promise<any | TResult>;
    // finally!: (onfinally?: (() => void) | undefined | null) => Promise<any>;
    // also: readonly [Symbol.toStringTag]: "Promise";
  }

  private _markResolution(status: Status, error: any, ...result: any[]): void {
    if (!this.isPending()) {
      return; // warn/error/throw if resolved more than once? Maybe only if forced locally? (when you prob want to ignore the late-arriving remote response.)
    }
    this.completedAt = this.rsvp ? Date.now() : this.requestedAt;
    this.status = status;
    const { resolve, reject } = this._responseResolver;
    if (error) {
      reject(error);
    } else {
      resolve(...result);
    }
  }

}

interface IResponseResolver {
  promise: Promise<any>;
  resolve: (result?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
}
