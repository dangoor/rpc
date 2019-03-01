import { RequestPayload, ResponsePayload, RpcTransport } from "rpc-core/src/interfaces";
import { BrowserExtensionTransportOpts } from "./interfaces";
export default class ChromeTransport implements RpcTransport {
    private _stopped;
    private _opts;
    private readonly _isContentScript;
    private readonly _chromeExtensionId;
    private _messageHandler?;
    constructor(opts?: BrowserExtensionTransportOpts);
    listen(onMessage: (payload: (RequestPayload | ResponsePayload)) => void): void;
    sendMessage(payload: RequestPayload | ResponsePayload): void;
    stopTransport(): void;
    _removeListener(): void;
    _initOpts(opts: BrowserExtensionTransportOpts): BrowserExtensionTransportOpts;
}
