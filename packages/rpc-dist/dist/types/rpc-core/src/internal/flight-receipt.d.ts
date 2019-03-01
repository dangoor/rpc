import { RequestInfo, RequestPayload, RemotePromise } from "../interfaces";
declare const TimeoutErrorCode = "RemoteMethodTimeoutError";
export default class FlightReceipt {
    private readonly requestPayload;
    private readonly _responseResolver;
    private readonly nodejsCallback;
    private readonly requestedAt;
    private completedAt?;
    private status;
    private _timer?;
    constructor(requestPayload: RequestPayload, nodejsCallback?: (...args: any[]) => void);
    isPending(): boolean;
    info(): RequestInfo;
    resolveNow(...results: any[]): void;
    rejectNow(reason: any): void;
    updateTimeout(ms: number): void;
    readonly rsvp: boolean;
    _decoratedPromise(): RemotePromise<any>;
    _remoteResponseReceived(error: any, ...result: any[]): void;
    _initResponseResolver(): IResponseResolver;
    private _ensurePromiseDecorated;
    private _markResolution;
}
interface IResponseResolver {
    promise: Promise<any>;
    resolve: (result?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
}
export { TimeoutErrorCode };
