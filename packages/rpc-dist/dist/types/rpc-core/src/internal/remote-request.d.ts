import FlightReceipt from "./flight-receipt";
import { RequestOpts, RequestPayload, RemotePromise } from "../interfaces";
export default class RemoteRequest {
    private requestOpts;
    private _receipt?;
    readonly nodejsCallback?: (...args: any[]) => void;
    readonly methodName: string;
    readonly userArgs: any[];
    readonly requestId: string;
    private _payload?;
    constructor(methodName: string, userArgs: any[], requestOpts: RequestOpts);
    opts(requestOpts: RequestOpts): void;
    isRsvp(): boolean;
    buildPayload(endpointBaseData: Partial<RequestPayload>): RequestPayload;
    dataForPayload(): Partial<RequestPayload>;
    flightReceipt(): RemotePromise<any> | FlightReceipt;
    responseReceived(error: any, ...result: any[]): void;
    private _ensureFlightReceipt;
    private _initTimeout;
    private _clearTimeout;
}
