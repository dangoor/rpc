import RemoteRequest, {IRequestOpts} from "./remote-request";
import FlightReceipt from "./flight-receipt";
import Router, {IRequestPayload, IResponsePayload} from "./router";
const kvid = require('kvid');



export interface IRpcOpts {
  channel: string;
  transport: IRpcTransport;

  allRequestOpts: IRequestOpts;
  // allMethodHandlerOpts: IMethodHandlerOpts;

  /**
   * Function/hook to modify or filter RPC request and response messages. It runs after the transport receives the message (and possibly does its own
   * filtering) and after WranggleRpc verifies it is a properly formatted message but before the data is used.
   *
   * If your function returns false, the message is considered invalid. If true, the original payload is used unchanged.
   * Otherwise, it can return a modified payload.
   */
  preparseAllIncomingMessages?: (rawPayload: IRequestPayload | IResponsePayload) => boolean | IRequestPayload | IResponsePayload;


  /**
   * A string sent with every message. Generated randomly by default but can be specified here.
   */
  senderId: string;
  /**
   * When true, this checks if the method being called has been locally registered before sending the command.
   * Default is false/off. When true, you need to register the permitted methods with `addRemoteMethodNames`.
   *
   */
  requireRemoteMethodRegistration: boolean;

  logger: ILogger;
}



const DefaultRpcOpts = {
  channel: 'CommonChannel',
  requireRemoteMethodRegistration: false,
  // later: option to change from bi-directional (both initiating and responding to requests) to request-only or respond-only
};


export interface IRpcEndpointData {

}

/**
 * Shortcut to setting up both messageSender and messageReceiver
 */
export interface IRpcTransport {
  sendMessage(payload: IRequestPayload | IResponsePayload): void;
  listen(onMessage: (payload: IRequestPayload | IResponsePayload) => void): void;
  stopTransport(): void;
  // todo: reportDisconnect? connection status? decide where to keep features like heartbeat
}

type MethodName = string;


interface IRequestHandlerDelegateHolder {
  delegate: object;
  opts: IDelegateOpts;
}

export interface IDelegateOpts {

  /**
   * Ignores inherited methods, using Object.hasOwnProperty check.
   */
  ignoreInherited?: boolean;

  /**
   * Ignores methods beginning with an underscore "_".
   */
  ignoreWithUnderscorePrefix?: boolean;

  /**
   * Custom filter to determine if it's ok to call a method on the delegate object. It is applied after the above
   * built-in filters run/pass. When provided, the method runs if the filter returns `true`.
   * @param delegate
   * @param methodName
   * @param methodArgs
   */
  shouldRun?: (delegate: object, methodName: string, ...methodArgs: any[]) => boolean;

  context?: any;

}


// interface IMethodHandlerOpts {
//   /**
//    * Optional function that can modify/filter received command data before it is passed to the handler function.
//    * It is useful for enforcing app-level security.
//    * The function is passed an array of arguments and should return the same. To override the values, an array must be returned.
//    * If the function returns `undefined`, the original payload will be used.
//    * If it returns anything else, it will return a `RequestRejected` error.
//    *
//    * @param commandPayload
//    */
//   preparseCommandPayload?: (methodName: string, userArgs: any[]) => any[];
//
//   /**
//    * When requests are received, the args are passed to your requestHandler. You can specify ts "this" binding with this option.
//    * If not set, WranggleRpc will use the object passed into addRequestHandler or null if added using a string method-name.
//    *
//    */
//   context?: any;
// }

export default class Rpc<T> {
  private _rootOpts = <IRpcOpts>{};
  private _requestOptsByMethod = <IDict<IRequestOpts>>{};
  private _requestHandlerDelegateHolders=<IRequestHandlerDelegateHolder[]>[];
  private _namedRequestHandlers = <IDict<(...args: any[]) => any>>{};
  // private logger = <ILogger>console;

  private readonly router: Router;


  constructor(opts=<Partial<IRpcOpts>>{}) {
    this.router = new Router({ onValidatedRequest: this._onValidatedRequest.bind(this) });
    this.opts(Object.assign({ senderId: kvid(8) }, DefaultRpcOpts, opts));
  }

  /**
   * Incoming requests are passed to methods on the specified `delegate` object if it passes the `IDelegateOpts` filters specified.
   *
   */
  addRequestHandlerDelegate(delegate: any, opts?: IDelegateOpts) {
    if (typeof delegate !== 'object') {
      throw new Error('Expecting an object containing request handlers');
    }
    opts = Object.assign({
      ignoreWithUnderscorePrefix: true,
      ignoreInherited: true,
      ignoreConstructor: true,
      context: delegate,
    }, opts);
    this._requestHandlerDelegateHolders.push({ delegate, opts });
  }

  addRequestHandler(methodName: string, fn: (...args: any[]) => any): any {
    this._namedRequestHandlers[methodName] = fn;
  }

  addRequestHandlers(fnByMethodName: IDict<(...args: any[]) => any>): any {
    Object.keys(fnByMethodName).forEach((methodName) => this.addRequestHandler(methodName, fnByMethodName[methodName]));
  }


  opts(opts: Partial<IRpcOpts>): void {
    this.router.routerOpts(opts);
    Object.assign(this._rootOpts, opts);
  }

  remoteInterface(): T {
    const itself = this;
    const requireRegistration = this._rootOpts.requireRemoteMethodRegistration;
    return new Proxy({}, {
      get: function(obj: any, methodName: MethodName) {
        if (requireRegistration) {
          // todo: check if methodName allowed
        }
        return (...userArgs: any[]) => itself.makeRemoteRequest(methodName, userArgs);
      }
    }) as T;
  }

  makeRemoteRequest(methodName: string, userArgs: any[], requestOpts=<IRequestOpts>{}): Promise<any> | FlightReceipt {
    const rootOpts = this._rootOpts;
    requestOpts = Object.assign({}, rootOpts.allRequestOpts, requestOpts); // todo: also this._requestOptsByMethod[methodName]
    const req = new RemoteRequest(methodName, userArgs, requestOpts);
    return this.router.sendRemoteRequest(req);
  }


  setDefaultRequestOptsForMethod(methodName: MethodName, requestOpts: IRequestOpts): void {
    this._requestOptsByMethod[methodName] = Object.assign((this._requestOptsByMethod[methodName] || {}), requestOpts);
  }

  aboutThisEndpoint(): IRpcEndpointData {
    // todo: implement
    return {};
  }

  hasConnected(): boolean {
    // todo: implement
    return false;
  }

  _onValidatedRequest(methodName: string, userArgs: any[]): Promise<any> {
    let context;
    let fn = this._namedRequestHandlers[methodName];
    if (!fn) {
      const holder = this._requestHandlerDelegateHolders.find((holder: IRequestHandlerDelegateHolder): boolean => {
        const { delegate, opts } = holder;
        if (methodName === 'constructor') {
          return false;
        }
        if (typeof (delegate as any)[methodName] !== 'function') {
          return false;
        }
        if (opts.ignoreWithUnderscorePrefix && methodName.charAt(0) === '_') {
          return false;
        }
        if (opts.ignoreInherited && !(delegate.hasOwnProperty(methodName) || Object.getPrototypeOf(delegate).hasOwnProperty(methodName))) {
          return false;
        }
        if (typeof opts.shouldRun === 'function' && opts.shouldRun(delegate, methodName, ...userArgs) !== true) {
          return false;
        }
        return true;
      });
      if (holder) {
        fn = (<any>holder.delegate)[methodName];
        context = holder.opts.context;
      }
    }
    if (fn) {
      return Promise.resolve(fn.apply(context, userArgs))
    } else {
      return Promise.reject({ errorCode: 'MethodNotFound', methodName });
    }
  }
}


// todo: find existing interface?
export interface ILogger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

export interface IDict<T> {
  [ key: string ]: T;
}
