import RemoteRequest, {IRequestOpts} from "./remote-request";
import FlightReceipt from "./flight-receipt";


export interface IRpcOpts {
  channel: RpcChannel;
  transport?: IRpcTransport;

  allRequestOpts?: IRequestOpts;
  allMethodHandlerOpts?: IMethodHandlerOpts;

  /**
   * When true, this checks if the method being called has been locally registered before sending the command.
   * Default is false/off. When true, you need to register the permitted methods with `addRemoteMethodNames`.
   *
   */
  requireRemoteMethodRegistration?: boolean;


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
  sendMessage(payload: IRpcPayload): void;
  listen(onMessage: (payload: IRpcPayload) => void): void;
  stopTransport(): void;
  // todo: reportDisconnect? connection status? decide where to keep features like heartbeat
}

type MethodName = string;
type RpcChannel = string;


interface IDict<T> {
  [ key: string ]: T;
}

export interface IRequestHandlerObject {
  [ methodName: string]: (...args: any[]) => Promise<any> | void | FlightReceipt;
}

// export interface IRequestMakerObject extends IMethodByName {
// }
// interface IMethodByName {
//   [ methodName: string]: (...args: any[]) => Promise<any> | void;
// }

export interface IRpcPayload {
  // todo
}

interface IMethodHandlerOpts {
  /**
   * Optional function that can modify/filter received command data before it is passed to the handler function.
   * It is useful for enforcing app-level security.
   * The function is passed an array of arguments and should return the same. To override the values, an array must be returned.
   * If the function returns `undefined`, the original payload will be used.
   * If it returns anything else, it will return a `RequestRejected` error.
   *
   * @param commandPayload
   */
  preparseCommandPayload?: (commandArgs: any[]) => any[];
  
  /**
   * When requests are received, the args are passed to your requestHandler. You can specify ts "this" binding with this option.
   * If not set, WranggleRpc will use the object passed into addRequestHandler or null if added using a string method-name.
   *
   */
  context?: any;
}

export default class Rpc<T> {
  private _rootOpts: IRpcOpts;
  private _pendingRequests = <IDict<RemoteRequest>>{};
  private _requestOptsByMethod = <IDict<IRequestOpts>>{};
  private logger = <ILogger>console;
  readonly channel: RpcChannel;

  constructor(opts: Partial<IRpcOpts>) {
    this._rootOpts = Object.assign({}, DefaultRpcOpts) as IRpcOpts;
    this.opts(opts);
  }

  addRequestHandler(handlerObj: IRequestHandlerObject, isPermittedMethod?: (methodName: string) => boolean, opts?: IMethodHandlerOpts): any;
  addRequestHandler(handlerObj: IRequestHandlerObject, permittedMethods?: MethodName[], opts?: IMethodHandlerOpts): any;
  addRequestHandler(methodName: string, fn: (...args: any[]) => any, opts?: IMethodHandlerOpts): any;
  addRequestHandler(...args: any[]): void {
    // todo: implement
  }

  opts(opts: Partial<IRpcOpts>): void {
    [ 'messageSender', 'messageReceiver', 'logger' ].forEach(field => {
      if (opts[field]) {
        this[field] = opts[field];
        delete opts[field];
      }
    });
    if (opts.transport) {
      // todo: serialized construction
    }
    Object.assign(this.opts, opts);
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

  makeRemoteRequest(methodName: string, userArgs: any[], requestOpts?: IRequestOpts): Promise<any> | FlightReceipt {
    requestOpts = Object.assign({}, this._rootOpts.allRequestOpts, requestOpts); // todo: also this._requestOptsByMethod[methodName]
    const req = new RemoteRequest(methodName, userArgs, requestOpts);
    if (req.isRsvp()) {
      this._pendingRequests[req.messageId] = req;
    }
    this._putRequestOnWire(req);
    return req.flightReceipt();
  }

  _putRequestOnWire(req: RemoteRequest): void {
    // todo: implement
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
}


// todo: find existing interface?
interface ILogger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}