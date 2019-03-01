import { ResponsePayload, RpcTransport } from "rpc-core/src/interfaces";
import { RequestPayload } from "rpc-core/src/interfaces";
export interface IPostmessageTransportOpts {
    /**
     * Target window to use for both sending and receiving messages. If they are different, use the `sendingWindow` and
     * `receivingWindow` options.
     *
     * Note: if using an iframe, remember to pass in its `contentWindow` (eg, myIframe.contentWindow) not the iframe DOM element.
     *
     */
    targetWindow?: any;
    /**
     * The `targetOrigin` value used when calling targetWindow.postMessage.
     * Use the origin / base url of the receiving window. Eg, `https://example.edu`
     *
     * If this option is not set, it will use the current origin (meaning both communicating windows must be on the same origin.)
     */
    sendToOrigin?: string;
    /**
     * Filter that determines if a message should be received.
     *
     * It a function is passed, it will called with the event.origin string of the received message and only accept
     *   the message if the function returns `true`
     * If a string is passed, it will expect the message origin to match it exactly. (Eg, "https://example.edu")
     *
     * If this option is not set, the transport will only accept messages originating from the same origin.
     *
     * @param origin
     */
    shouldReceive?: string | ((origin: string) => boolean);
    /**
     * If different windows are needed for sending and receiving, use this option to specify the target window for sending messages.
     */
    sendingWindow?: any;
    /**
     * If different windows are needed for sending and receiving, use this option to specify the window for receiving messages.
     */
    receivingWindow?: any;
}
export default class PostmessageTransport implements RpcTransport {
    private _sendingWindow;
    private _receivingWindow;
    private _opts;
    private _isStopped;
    private _windowEventListener?;
    constructor(opts: IPostmessageTransportOpts);
    listen(rpcHandler: (payload: (RequestPayload | ResponsePayload)) => void): void;
    sendMessage(payload: RequestPayload | ResponsePayload): void;
    stopTransport(): void;
    _removeExistingListener(): void;
}
