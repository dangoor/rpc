import {IRpcTransport} from "@wranggle/rpc-core/src/rpc-core";
import {IRequestPayload, IResponsePayload} from "@wranggle/rpc-core/src/internals/router";


export default class RelayTransport implements IRpcTransport {
  listen(onMessage: (payload: (IRequestPayload | IResponsePayload)) => void): void {
  }

  sendMessage(payload: IRequestPayload | IResponsePayload): void {
  }

  stopTransport(): void {
  }

}