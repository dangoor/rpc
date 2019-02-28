import {IRpcTransport} from "rpc-core/src/rpc-core";
import {IRequestPayload, IResponsePayload} from "rpc-core/src/internals/router";
const kvid = require('kvid');


export interface IRelayTransportOpts {

  /**
   * One of the two endpoints to bridge
   */
  left: IRpcTransport;

  /**
   * One of the two endpoints to bridge
   */
  right: IRpcTransport;

  /**
   * Optional. Value used as payload's senderId. A random id will be used unless overriden here.
   */
  relayId?: string;

}


export default class RelayTransport {
  private readonly _relayId: string;
  private readonly _left: IRpcTransport;
  private readonly _right: IRpcTransport;

  constructor(opts: IRelayTransportOpts) {
    this._relayId = opts.relayId || kvid(10);
    this._left = opts.left;
    this._right = opts.right;
  }

  /**
   * In the middle layer, you can instantiate and start the RelayTransport directly, without creating a WranggleRpc instance,
   * since it does not make or respond to requests on its own.
   *
   */
  start() {
    this._startRelay(this._left, this._right);
    this._startRelay(this._right, this._left);
  }


  // listen(unused: (payload: (IRequestPayload | IResponsePayload)) => void): void {
  //   console.warn('RelayTransport does not need to be used on WranggleRpc directly. It can only relay, it cannot make its own remote requests or handle requests');
  // }

  // sendMessage(payload: IRequestPayload | IResponsePayload): void {
  //   throw new Error('RelayTransport cannot make its own remote requests, it can only relay messages between other endpoints.')
  // }

  stopTransport(): void {
    this._left.stopTransport();
    this._right.stopTransport();
  }

  _startRelay(from: IRpcTransport, to: IRpcTransport): void {
    from.listen((payload: IRequestPayload | IResponsePayload) => {
      payload.transportMeta.relays = (payload.transportMeta.relays || []).concat([ this._relayId ]);
      to.sendMessage(payload);
    });
  }
}