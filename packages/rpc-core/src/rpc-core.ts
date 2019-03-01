import RemoteRequest from "./internal/remote-request";
import Router from "./internal/router";
import RequestHandler from "./internal/request-handler";
import {registerTransport} from "./internal/transport-construction";
import {DelegateOpts, IDict, RequestOpts, RpcTransport, RpcOpts, WranggleRpcTs, RemotePromise} from "./interfaces";

const kvid = require('kvid');



const DefaultRpcOpts = {
  channel: 'CommonChannel',
  requireRemoteMethodRegistration: false,
  // later: option to change from bi-directional (both initiating and responding to requests) to request-only or respond-only
};


export default class WranggleRpc<T> implements WranggleRpcTs<T> {
  private _rootOpts = <RpcOpts>{};
  private _requestOptsByMethod = <IDict<RequestOpts>>{};
  // private logger = <ILogger>console;

  private readonly router: Router;
  private readonly requestHandler = new RequestHandler();

  constructor(rpcOpts?: Partial<RpcOpts>) {
    this.router = new Router({ onValidatedRequest: this.requestHandler.onValidatedRequest.bind(this.requestHandler) });
    if (typeof rpcOpts === 'string') { // hmm, not an especially useful constructor signature but looks good in the readme example
      rpcOpts = { transport: rpcOpts };
    }
    this.opts(Object.assign({ senderId: kvid(8) }, DefaultRpcOpts, rpcOpts));
  }

  addRequestHandlerDelegate(delegate: any, opts?: DelegateOpts) {
    this.requestHandler.addRequestHandlerDelegate(delegate, opts);
  }

  addRequestHandler(methodName: string, fn: (...args: any[]) => any, context?: any): void {
    this.requestHandler.addRequestHandler(methodName, fn, context);
  }

  addRequestHandlers(fnByMethodName: IDict<(...args: any[]) => any>, context?: any): void {
    this.requestHandler.addRequestHandlers(fnByMethodName, context);
  }

  useTransport(transportOpts: RpcTransport | object | string) {
    this.router.useTransport(transportOpts);
  }

  opts(opts: Partial<RpcOpts>): void {
    this.router.routerOpts(opts);
    this.requestHandler.requestHandlerOpts(opts);
    Object.assign(this._rootOpts, opts);
  }

  remoteInterface(): T {
    const itself = this;
    return new Proxy({}, {
      get: function (obj: any, methodName: string) {
        return (...userArgs: any[]) => itself.makeRemoteRequest(methodName, userArgs);
      }
    }) as T;
  }

  makeRemoteRequest(methodName: string, userArgs: any[], requestOpts = <RequestOpts>{}): RemotePromise<any> {
    const rootOpts = this._rootOpts;
    requestOpts = Object.assign({}, rootOpts.allRequestOpts, this._requestOptsByMethod[methodName], requestOpts);
    const req = new RemoteRequest(methodName, userArgs, requestOpts);
    return this.router.sendRemoteRequest(req);
  }

  setDefaultRequestOptsForMethod(methodName: string, requestOpts: RequestOpts): void {
    this._requestOptsByMethod[methodName] = Object.assign((this._requestOptsByMethod[methodName] || {}), requestOpts);
  }

  // todo: checkConnectionStatus(opts = <IConnectionStatusOpts>{}): Promise<IConnectionStatus> {
  //   return this.router.checkConnectionStatus(opts); // TODO: not yet implemented
  // }

  get senderId(): string {
    return this._rootOpts.senderId;
  }

  static registerTransport(transportType: string, transportFactory: (opts: any) => RpcTransport): void {
    registerTransport(transportType, transportFactory);
  }
}


