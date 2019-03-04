import {IDict, RpcTransport} from "./interfaces";


export type TransportFactory = (opts: any) => RpcTransport;

export function registerTransport(transportType: string, transportFactory: TransportFactory): void {
  getTransportRegistry()[transportType] = transportFactory;
}



// am currently having build trouble... this registry belongs on @wranggle/rpc-core but importing it in a way that makes ts
// happy is breaking jest and there's no time for configurations right now, so putting it on global for now.
export function getTransportRegistry(): IDict<TransportFactory> {
  // @ts-ignore
  global.__wranggleRpcTransportShortcuts__ = global.__wranggleRpcTransportShortcuts__ || {};
  // @ts-ignore
  return global.__wranggleRpcTransportShortcuts__;
}
