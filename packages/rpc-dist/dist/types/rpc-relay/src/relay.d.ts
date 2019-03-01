import { RpcTransport } from "rpc-core/src/interfaces";
export interface IRelayTransportOpts {
    /**
     * One of the two endpoints to bridge
     */
    left: RpcTransport;
    /**
     * One of the two endpoints to bridge
     */
    right: RpcTransport;
    /**
     * Optional. Value used as payload's senderId. A random id will be used unless overriden here.
     */
    relayId?: string;
}
export default class RelayTransport {
    private readonly _relayId;
    private readonly _left;
    private readonly _right;
    constructor(opts: IRelayTransportOpts);
    /**
     * In the middle layer, you can instantiate and start the RelayTransport directly, without creating a WranggleRpc instance,
     * since it does not make or respond to requests on its own.
     *
     */
    start(): void;
    stopTransport(): void;
    _startRelay(from: RpcTransport, to: RpcTransport): void;
}
