import { DelegateOpts, IDict, RequestOpts, RpcTransport, RpcOpts, WranggleRpc, RemotePromise } from "./interfaces";
export default class RpcCore<T> implements WranggleRpc<T> {
    private _rootOpts;
    private _requestOptsByMethod;
    private readonly router;
    private readonly requestHandler;
    constructor(rpcOpts?: Partial<RpcOpts>);
    addRequestHandlerDelegate(delegate: any, opts?: DelegateOpts): void;
    addRequestHandler(methodName: string, fn: (...args: any[]) => any, context?: any): void;
    addRequestHandlers(fnByMethodName: IDict<(...args: any[]) => any>, context?: any): void;
    useTransport(transportOpts: RpcTransport | object | string): void;
    opts(opts: Partial<RpcOpts>): void;
    remoteInterface(): T;
    makeRemoteRequest(methodName: string, userArgs: any[], requestOpts?: RequestOpts): RemotePromise<any>;
    setDefaultRequestOptsForMethod(methodName: string, requestOpts: RequestOpts): void;
    readonly senderId: string;
    static registerTransport(transportType: string, transportFactory: (opts: any) => RpcTransport): void;
}
