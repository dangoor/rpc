import RemoteRequest, {IRequestOpts} from "./internals/remote-request";
import FlightReceipt from "./internals/flight-receipt";
import Router, {IRequestPayload, IResponsePayload} from "./internals/router";
import RequestHandler, {IDelegateOpts} from "./internals/request-handler";
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



/**
 * Shortcut to setting up both messageSender and messageReceiver
 */
export interface IRpcTransport {
  sendMessage(payload: IRequestPayload | IResponsePayload): void;
  listen(onMessage: (payload: IRequestPayload | IResponsePayload) => void): void;
  stopTransport(): void;
  // todo: reportDisconnect? connection status? decide where to keep features like heartbeat
}


export default class Rpc<T> {
  private _rootOpts = <IRpcOpts>{};
  private _requestOptsByMethod = <IDict<IRequestOpts>>{};
  // private logger = <ILogger>console;

  private readonly router: Router;
  private readonly requestHandler = new RequestHandler();

  constructor(opts=<Partial<IRpcOpts>>{}) {
    this.router = new Router({ onValidatedRequest: this.requestHandler.onValidatedRequest.bind(this.requestHandler) });
    this.opts(Object.assign({ senderId: kvid(8) }, DefaultRpcOpts, opts));
  }

  /**
   * Incoming requests are passed to methods on the specified `delegate` object if it passes the `IDelegateOpts` filters specified.
   *
   */
  addRequestHandlerDelegate(delegate: any, opts?: IDelegateOpts) {
    this.requestHandler.addRequestHandlerDelegate(delegate, opts);
  }

  /**
   * Add a function to handle incoming request messages.
   *
   * @param methodName. String that is a legitimate js variable name. (No spaces and such.)
   * @param fn Function that runs the remotely-passed arguments. This function can return a value or a promise.
   * @param context. Optional. Sets the "this" context of your function. Note/reminder: arrow functions do not have a "this" binding,
   *   so use a full "function" when setting this option.
   */
  addRequestHandler(methodName: string, fn: (...args: any[]) => any, context?: any): void {
    this.requestHandler.addRequestHandler(methodName, fn, context);
  }

  /**
   * Shortcut to addRequestHandler. Accepts an object of methodName-function pairs.
   * Note: methodName/keys starting with underscore "_" are skipped here, but can be added with a direct call to `addRequestHandler`
   * @param fnByMethodName
   * @param context
   */
  addRequestHandlers(fnByMethodName: IDict<(...args: any[]) => any>, context?: any): void {
    this.requestHandler.addRequestHandlers(fnByMethodName, context);
  }

  opts(opts: Partial<IRpcOpts>): void {
    this.router.routerOpts(opts);
    this.requestHandler.requestHandlerOpts(opts);
    Object.assign(this._rootOpts, opts);
  }

  remoteInterface(): T {
    const itself = this;
    const requireRegistration = this._rootOpts.requireRemoteMethodRegistration;
    return new Proxy({}, {
      get: function(obj: any, methodName: string) {
        if (requireRegistration) {
          // todo: check if methodName allowed
        }
        return (...userArgs: any[]) => itself.makeRemoteRequest(methodName, userArgs);
      }
    }) as T;
  }

  makeRemoteRequest(methodName: string, userArgs: any[], requestOpts=<IRequestOpts>{}): Promise<any> | FlightReceipt {
    const rootOpts = this._rootOpts;
    requestOpts = Object.assign({}, rootOpts.allRequestOpts, this._requestOptsByMethod[methodName], requestOpts);
    const req = new RemoteRequest(methodName, userArgs, requestOpts);
    return this.router.sendRemoteRequest(req);
  }

  setDefaultRequestOptsForMethod(methodName: string, requestOpts: IRequestOpts): void {
    this._requestOptsByMethod[methodName] = Object.assign((this._requestOptsByMethod[methodName] || {}), requestOpts);
  }

  checkConnectionStatus(opts=<IConnectionStatusOpts>{}): Promise<IConnectionStatus> {
    return this.router.checkConnectionStatus(opts); // TODO: not yet implemented
  }

}



// todo: find existing interface?
export interface ILogger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

export interface IConnectionStatus {

}
export interface IConnectionStatusOpts {
  timeout: number;
}


export interface IDict<T> {
  [ key: string ]: T;
}
