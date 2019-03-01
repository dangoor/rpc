import { CommonPayload } from "./internal/router";
export declare abstract class WranggleRpc<T> {
    protected constructor(rpcOpts?: Partial<RpcOpts>);
    /**
     * Incoming requests are passed to methods on the specified `delegate` object if it passes the `DelegateOpts` filters specified.
     *
     */
    addRequestHandlerDelegate(delegate: any, opts?: DelegateOpts): void;
    /**
     * Add a function to handle incoming request messages.
     *
     * @param methodName. String that is a legitimate js variable name. (No spaces and such.)
     * @param fn Function that runs the remotely-passed arguments. This function can return a value or a promise.
     * @param context. Optional. Sets the "this" context of your function. Note/reminder: arrow functions do not have a "this" binding,
     *   so use a full "function" when setting this option.
     */
    addRequestHandler(methodName: string, fn: (...args: any[]) => any, context?: any): void;
    /**
     * Shortcut to addRequestHandler. Accepts an object of methodName-function pairs.
     * Note: methodName/keys starting with underscore "_" are skipped here, but can be added with a direct call to `addRequestHandler`
     * @param fnByMethodName
     * @param context
     */
    addRequestHandlers(fnByMethodName: IDict<(...args: any[]) => any>, context?: any): void;
    /**
     * Set the RpcTransport for sending and receiving messages.
     *
     * @param transportOpts
     */
    useTransport(transportOpts: RpcTransport | object | string): void;
    opts(opts: Partial<RpcOpts>): void;
    remoteInterface(): T;
    makeRemoteRequest(methodName: string, userArgs: any[], requestOpts: RequestOpts): RemotePromise<any>;
    /**
     * zzz
     * @param methodName
     * @param requestOpts
     */
    setDefaultRequestOptsForMethod(methodName: string, requestOpts: RequestOpts): void;
}
export interface RpcOpts {
    channel: string;
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
     * A string including on message payload.  Generated randomly by default but can be specified here for debug purposes.
     * Value must be different from the other endpoint.
     */
    senderId: string;
    /**
     * Shortcut for calling `wranggleRpc.useTransport`.
     */
    transport: RpcTransport | object | string;
}
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
}
export interface DelegateOpts {
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
    shouldRun?: (delegate: object, methodName: string, ...methodArgs: any[]) => boolean;
    /**
     * Override `this` binding on the delegate object when it is called.
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
}
export interface RequestPayload extends CommonPayload {
    requestId: string;
    userArgs: any[];
    rsvp: boolean;
}
export interface ResponsePayload extends CommonPayload {
    respondingTo: string;
    error?: any;
    responseArgs?: any[];
}
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
export declare enum RequestStatus {
    Pending = "Pending",
    RemoteError = "RemoteError",
    RemoteResult = "RemoteResult",
    ForcedError = "ForcedError",
    ForcedResult = "ForcedResult",
    TimeoutError = "TimeoutError",
    SkipRsvp = "SkipRsvp"
}
