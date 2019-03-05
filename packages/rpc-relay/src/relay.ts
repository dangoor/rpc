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


export default class Relay {
  private readonly _relayId: string;
  private readonly _left: RpcTransport;
  private readonly _right: RpcTransport;

  constructor(opts: RelayOpts) {
    if (!opts.left || !opts.right) {
      throw new Error('Relay requires two transports, "left" and "right"');
    }
    this._relayId = opts.relayId || kvid(10);
    this._left = opts.left;
    this._right = opts.right;
    this.start(); // maybe an option to not start immediately
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

  stopTransports() {
    this._left.stopTransport();
    this._right.stopTransport();
  }

  stopTransport(): void {
    this.stopTransports();
  }

  private _startRelay(from: RpcTransport, to: RpcTransport): void {
    from.listen((payload: RequestPayload | ResponsePayload) => {
      if (payload.protocol && _startsWith(payload.protocol, 'WranggleRpc')) { // todo: check against actual Protocol (move that out of internals dir)
        const relayId = this._relayId;
        if (!Array.isArray(payload.transportMeta.relays) || !payload.transportMeta.relays.find(r => r === relayId)) {
          payload.transportMeta.relays = (payload.transportMeta.relays || []).concat([ this._relayId ]);
          to.sendMessage(payload);
        }
      }
    });
  }
}


function _startsWith(val: string, check: string) {
  return typeof val === 'string' && val.slice(0, check.length) === check;
}