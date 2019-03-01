import RemoteRequest from "./remote-request";
import { IDict, RemotePromise, RpcOpts, RpcTransport, ConnectionStatus, ConnectionStatusOpts } from "../interfaces";
declare const Protocol = "WranggleRpc-1";
export interface CommonPayload {
    protocol: string;
    senderId: string;
    channel: string;
    methodName: string;
    transportMeta: IDict<any>;
}
interface IRouterOpts {
    onValidatedRequest: (methodName: string, userArgs: any[]) => Promise<any>;
}
export default class Router {
    private _pendingRequests;
    private _finishedRequestIds;
    private transport?;
    private _stopped;
    private _rootOpts;
    private _onValidatedRequest;
    private _preparseFilters;
    constructor(opts: IRouterOpts);
    useTransport(transportOpts: RpcTransport | object | string): void;
    stopTransport(): void;
    sendRemoteRequest(req: RemoteRequest): RemotePromise<any>;
    checkConnectionStatus(opts?: ConnectionStatusOpts): Promise<ConnectionStatus>;
    routerOpts(opts: Partial<RpcOpts>): void;
    pendingRequestIds(): string[];
    readonly senderId: string | undefined;
    readonly channel: string | undefined;
    private _onMessage;
    private _receiveRequest;
    private _handleRsvp;
    private _receiveResponse;
    private _basePayloadData;
    private _isForUs;
}
export { Protocol };
