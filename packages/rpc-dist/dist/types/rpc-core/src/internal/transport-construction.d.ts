import { RpcTransport } from "../interfaces";
declare type TransportFactory = (opts: any) => RpcTransport;
export declare function registerTransport(transportType: string, transportFactory: TransportFactory): void;
export declare function buildTransport(val: any): RpcTransport | void;
export {};
