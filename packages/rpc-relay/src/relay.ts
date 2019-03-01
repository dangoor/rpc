import {ResponsePayload, RpcTransport} from "rpc-core/src/interfaces";
import {RequestPayload} from "rpc-core/src/interfaces";
const kvid = require('kvid');


export interface RelayOpts {

  /**
   * One of the two endpoints to bridge
   */
  left: RpcTransport;

  /**
   * One of the two endpoints to bridge
   */
  right: RpcTransport;

  /**
   * Optional. A random id will be used unless overridden here.
   * Value is added to payload transportMeta data, for debugging or potential examination by a custom transport.
   */
  relayId?: string;

}


export default class RelayTransports {
  private readonly _relayId: string;
  private readonly _left: RpcTransport;
  private readonly _right: RpcTransport;

  constructor(opts: RelayOpts) {
    this._relayId = opts.relayId || kvid(10);
    this._left = opts.left;
    this._right = opts.right;
  }

  /**
   * In the middle layer, you instantiate and start the Relay.
   * When relaying, you do not create a WranggleRpc instance, since it does not make or respond to requests on its own.
   *
   */
  start() {
    this._startRelay(this._left, this._right);
    this._startRelay(this._right, this._left);
  }

  stopTransport(): void {
    this._left.stopTransport();
    this._right.stopTransport();
  }

  private _startRelay(from: RpcTransport, to: RpcTransport): void {
    from.listen((payload: RequestPayload | ResponsePayload) => {
      payload.transportMeta.relays = (payload.transportMeta.relays || []).concat([ this._relayId ]);
      to.sendMessage(payload);
    });
  }
}