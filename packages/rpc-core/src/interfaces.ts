import {CommonPayload} from "./internal/router";


export declare abstract class WranggleRpcTs<T> {
  
  protected constructor(rpcOpts?: Partial<RpcOpts>);

  addRequestHandlerDelegate(delegate: any, opts?: DelegatedRequestHandlerOpts): void;


  addRequestHandler(methodName: string, fn: (...args: any[]) => any, context?: any): void;


  addRequestHandlers(fnByMethodName: IDict<(...args: any[]) => any>, context?: any): void;


  remoteInterface(): T;


  useTransport(transportOrOpts: RpcTransport | object | string): void;


  opts(opts: Partial<RpcOpts>): void;


  makeRemoteRequest(methodName: string, userArgs: any[], requestOpts: RequestOpts): RemotePromise<any>;  // make generic? makeRemoteRequest<T>(methodName: string, userArgs: any[], requestOpts: RequestOpts): Promise<any> | RemotePromise<T>;


  setDefaultRequestOptsForMethod(methodName: string, requestOpts: RequestOpts): void;

  // todo:  checkConnectionStatus(opts: ConnectionStatusOpts): Promise<ConnectionStatus>;
}


export interface RpcOpts {
  /**
   * Channel name or id. Unless the remote endpoint uses the exact same *channel* value, WranggleRpc will ignore its remote requests. *channel*.
   */
  channel: string;

  /**
   * A default
   */
  allRequestOpts: RequestOpts;

  /**
   * Function/hook to modify or filter RPC request and response messages. It runs after the transport receives the message (and possibly does its own
   * filtering) and after WranggleRpc verifies it is a properly formatted message but before the data is used.
   *
   * It can return a modified payload or a boolean. Return false to invalidate and ignore the received message, return true
   * to use the passed-in payload.
   *
   */
  preparseAllIncomingMessages: (rawPayload: RequestPayload | ResponsePayload) => boolean | RequestPayload | ResponsePayload;


  /**
   * A string included on message payload.  Generated randomly by default but can be specified here for debug purposes.
   * Value must be different from the other endpoint.
   */
  senderId: string;


  /**
   * Shortcut for calling `wranggleRpc.useTransport`.
   */
  transport: RpcTransport | object | string;

  // todo: accept a logger
  // logger: ILogger;


// ~~~~~~~~~~~~~~~~~ placeholder hack. todo: move to packages/rpc-full
  // I'm getting near my self-imposed time cap for this project and am hitting build/typescript problems. So throwing existing transports in here for now. Thought I'd use declarations-merging to extend RpcOpts for each transport but my first attempts haven't worked.
  /**
   * Shortcut for constructing BrowserExtensionTransport instance.
   * todo: figure out how to extend typescript RpcOpts interface with actual constructor opts in that package.
   */
  chrome: TransportConstructionOpts,
  /**
   * Shortcut for constructing BrowserExtensionTransport instance.
   * todo: figure out how to extend typescript RpcOpts interface with actual constructor opts in that package.
   */
  browserExtension: TransportConstructionOpts,

  /**
   * Shortcut for constructing ElectronTransport instance.
   * todo: figure out how to extend typescript RpcOpts interface with actual constructor opts in that package.
   */
  electron: TransportConstructionOpts,

  /**
   * Shortcut for constructing PostmessageTransport instance.
   * todo: figure out how to extend typescript RpcOpts interface with actual constructor opts in that package.
   */
  postmessage: TransportConstructionOpts,

  /**
   * Shortcut for constructing PostmessageTransport instance.
   * todo: figure out how to extend typescript RpcOpts interface with actual constructor opts in that package.
   */
  postMessage: TransportConstructionOpts,


  /**
   * Shortcut for constructing LocalObserverTransport instance.
   * todo: figure out how to extend typescript RpcOpts interface with actual constructor opts in that package.
   */
  localObserver: TransportConstructionOpts,

  /**
   * Shortcut for constructing LocalObserverTransport instance.
   * todo: figure out how to extend typescript RpcOpts interface with actual constructor opts in that package.
   */
  websocket: TransportConstructionOpts,
}
type TransportConstructionOpts = any;

export interface IDict<T> {
  [key: string]: T;
}

export interface RemotePromise<T> extends Promise<T> {

  /**
   * Set or update timeout for a single request.
   * Note: you can set a default timeout for all WranggleRpc requests using `rpc.opts` or by method name using `wranggleRpc.setDefaultRequestOptsForMethod`
   * @param ms Duration in milliseconds.
   */
  updateTimeout(ms: number): void;

  /**
   * Has a response been received yet/
   */
  isPending(): boolean;

  /**
   * Further details about the remote request. (See `RequestInfo`)
   */
  info(): RequestInfo;

  resolveNow(...results: any[]): void;

  rejectNow(reason: any): void;
}

export interface RequestInfo {
  requestId: string;
  requestedAt: Date;
  completedAt?: Date;
  status: RequestStatus;
  requestPayload: RequestPayload;
  // include methodName and args?
}

export interface DelegatedRequestHandlerOpts {

  /**
   * Ignores inherited methods, using Object.hasOwnProperty checks.
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
  shouldRun?: Set<string> | string[] | ((methodName: string, delegate: object, ...methodArgs: any[]) => boolean);

  /**
   * Override `this` binding on the delegate object when it is called.
   */
  context?: any;
}

export interface NamedRequestHandlerOpts {

  /**
   * When true, a Node.js style callback is added as the last parameter. When false, the function's result is used for the response. Default is false.
   */
  useCallback?: boolean;

  /**
   * Set `this` binding on the function. Reminder: cannot set "this" for arrow functions.
   */
  context?: any;
}


export interface RequestOpts {
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


/**
 * Shortcut to setting up both messageSender and messageReceiver
 */
export interface RpcTransport {
  sendMessage(payload: RequestPayload | ResponsePayload): void;

  listen(onMessage: (payload: RequestPayload | ResponsePayload) => void): void;

  stopTransport(): void;

  endpointSenderId: string | void;

  // todo: reportDisconnect? connection status? decide where to keep features like heartbeat
}


export interface RequestPayload extends CommonPayload {
  requestId: string;
  userArgs: any[];
  rsvp: boolean;
}

export interface ResponsePayload extends CommonPayload {
  respondingTo: string;
  error?: any;
  resolveArgs?: any[];
}

export interface EndpointInfo {
  senderId: string;
}

// todo: find existing interface?
export interface ILogger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

export interface ConnectionStatus {

}
export interface ConnectionStatusOpts {
  timeout: number;
}

export enum RequestStatus {
  Pending = 'Pending',
  RemoteError = 'RemoteError',
  RemoteResult = 'RemoteResult',
  ForcedError = 'ForcedError',
  ForcedResult = 'ForcedResult',
  TimeoutError = 'TimeoutError',
  SkipRsvp = 'SkipRsvp',
}

// error exporting LocalObserverTransport.. todo: ts acrobatics
// but this is ok: export { LocalObserverTransportOpts } from './local-observer-transport';
