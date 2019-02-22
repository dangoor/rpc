import FlightReceipt from "./flight-receipt";


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
  private readonly _id: string;
  private requestOpts: IRequestOpts;
  // private readonly _remotePromise: RemotePromise;
  private readonly nodejsCallback?: (...args: any[]) => void;
  private responseResolver: IResponseResolver;
  private _receipt: FlightReceipt;

  constructor(methodName: string, userArgs: any[], requestOpts: IRequestOpts) {
    this._id = 'todo123'; // todo: this.messageId = kvid(12);
    if (typeof userArgs[userArgs.length - 1] === 'function') {
      this.nodejsCallback = userArgs.pop();
    }
    this.opts(Object.assign({}, DefaultRequestOpts, requestOpts));
    this.responseResolver = this._initResponseResolver();

    this._initTimeout();
  }

  opts(requestOpts: IRequestOpts): void {
    this.requestOpts = Object.assign(this.requestOpts || {}, requestOpts);
  }

  isRsvp(): boolean {
    return !!this.requestOpts.rsvp;
  }

  get messageId() {
    return this._id;
  }

  flightReceipt(): Promise<any> | FlightReceipt {
    if (!this._receipt) {
      this._receipt = new FlightReceipt(this.responseResolver);
    }
    if (this.nodejsCallback) {
      return this._receipt;
    } else {
      const promise = this.responseResolver.promise;
      this._receipt.decoratePromise(promise);
      return promise;
    }
  }

  getResponseResolver(): IResponseResolver {
    return this.responseResolver;
  }


  _initResponseResolver(): IResponseResolver {
    let promise, resolve, reject;
    if (this.isRsvp()) {
      promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
    } else {
      promise = Promise.resolve();
      resolve = () => {};
      reject = () => {};
    }
    return { promise, resolve, reject };
  }

  private _initTimeout() {
    // todo: stash on this._timeout

  }
  private _clearTimeout() {
    // todo: clearTimeout(this._timeout). // call if value changes or if force-resolved
  }
}

export interface IResponseResolver {
  promise: Promise<any>;
  resolve: (result?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
}

