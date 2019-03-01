import { DelegateOpts, IDict, RpcOpts } from "../interfaces";
declare const MissingMethodErrorCode = "MethodNotFound";
export default class RequestHandler {
    private _rootOpts;
    private _requestHandlerDelegateHolders;
    private _namedRequestHandlerHolderByMethodName;
    requestHandlerOpts(opts: Partial<RpcOpts>): void;
    addRequestHandlerDelegate(delegate: any, opts?: DelegateOpts): void;
    addRequestHandler(methodName: string, fn: (...args: any[]) => any, context?: any): any;
    addRequestHandlers(fnByMethodName: IDict<(...args: any[]) => any>, context?: any): any;
    onValidatedRequest(methodName: string, userArgs: any[]): Promise<any>;
    readonly senderId: string | undefined;
    _applyUncaughtErrorData(err: any, extra: any): any;
}
export { MissingMethodErrorCode, };
