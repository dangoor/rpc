import RemoteRequest from "./remote-request";
import {IRpcTransport, IDict, IRpcOpts} from "../rpc-core";
import FlightReceipt, {RemotePromise} from "./flight-receipt";


const Protocol = 'WranggleRpc-1';


interface CommonPayload {
  protocol: string;
  senderId: string;
  channel: string;
  methodName: string;
  // perhaps add option: forEndpoint?: string;
}
export interface IRequestPayload extends CommonPayload {
  requestId: string;
  userArgs: any[];
  rsvp: boolean;
}
export interface IResponsePayload extends CommonPayload {
  respondingTo: string;
  error?: any;
  responseArgs?: any[];
}

interface IRouterOpts {
  onValidatedRequest: (methodName: string, userArgs: any[]) => Promise<any>;
}

type PreparseFilter = (rawPayload: IRequestPayload | IResponsePayload) => boolean | IRequestPayload | IResponsePayload;

export default class Router {
  private _pendingRequests = <IDict<RemoteRequest>>{};
  private _finishedRequestIds = new Set<string>(); // todo: @wranggle/rotating-cache to clear/expire (not very big but a memory leak as written.)
  private transport?: IRpcTransport | void;
  private _stopped = false;
  private _rootOpts = <Partial<IRpcOpts>>{};
  private _onValidatedRequest: (methodName: string, userArgs: any[]) => Promise<any>;
  private _preparseFilters = <PreparseFilter[]>[];

  constructor(opts: IRouterOpts) {
    this._onValidatedRequest = opts.onValidatedRequest;
  }

  useTransport(transport: IRpcTransport) {
    this.transport = transport;
    transport.listen(this._onMessage.bind(this));
    // todo: send handshake message
  }

  stopTransport(): void {
    if (this.transport) {
      this.transport.stopTransport();
      this.transport = void(0);
    }
  }

  sendRemoteRequest(req: RemoteRequest): RemotePromise<any> | FlightReceipt {
    if (!this.transport) {
      throw new Error('Rpc transport not set up');
    }
    if (req.isRsvp()) {
      this._pendingRequests[req.requestId] = req;
    }
    const requestPayload = req.buildPayload(this._basePayloadData());
    this.transport.sendMessage(requestPayload);
    return req.flightReceipt();
  }

  routerOpts(opts: Partial<IRpcOpts>) {
    this._rootOpts = Object.assign(this._rootOpts, opts);
    opts.transport && this.useTransport(opts.transport);
    if (typeof opts.preparseAllIncomingMessages === 'function') {
      this._preparseFilters.push(opts.preparseAllIncomingMessages);
    }
  }

  pendingRequestIds(): string[] {
    return Object.keys(this._pendingRequests);
  }

  get senderId() {
    return this._rootOpts.senderId;
  }

  get channel() {
    return this._rootOpts.channel;
  }
  
  private _onMessage(payload: any): void {
    if (this._stopped) {
      return;
    }
    if (!this._isForUs(payload)) {
      return;
    }
    let parsedPayload = payload;
    this._preparseFilters.forEach(filter => {
      let current;
      if (parsedPayload === false) {
        return;
      }
      try {
        current = filter.call(null, parsedPayload);
      } catch (err) {
        console.error('Error in preparseAllIncomingMessages filter. Invalidating incoming message.', err);
        current = false;
      }
      if (current === false) {
        parsedPayload = false;
      } else if (typeof current === 'object') {
        parsedPayload = current;
      }
    });
    if (parsedPayload.requestId) {
      this._receiveRequest(parsedPayload as IRequestPayload);
    } else if (parsedPayload.respondingTo) {
      this._receiveResponse(parsedPayload as IResponsePayload);
    }
  }

  private _receiveRequest(payload: IRequestPayload): void {
    const requestId = payload.requestId;
    if (this._finishedRequestIds.has(requestId)) {
      return; // warn/error of duplicate message?
    }
    this._finishedRequestIds.add(requestId);
    this._onValidatedRequest(payload.methodName, payload.userArgs)
      .then((...result: any[]) => this._handleRsvp(payload, null, result))
      .catch((reason: any) => this._handleRsvp(payload, reason, []));
  }

  private _handleRsvp(requestPayload: IRequestPayload, error: any, responseArgs: any[] | void): void {
    if (!requestPayload.rsvp) {
      return; // todo: log/debug option
    }
    if (!this.transport) {
      return;
    }
    const { requestId, methodName } = requestPayload;
    const response = Object.assign(this._basePayloadData(), {
      methodName,
      error, responseArgs,
      senderId: this.senderId,
      respondingTo: requestId,
    }) as IResponsePayload;
    this.transport.sendMessage(response);
  }

  private _receiveResponse(response: IResponsePayload): void {
    const requestId = response.respondingTo;
    const req = this._pendingRequests[requestId];
    if (!req || !req.isRsvp()) { // todo: log/warn?
      return;
    }
    delete this._pendingRequests[requestId];
    req.responseReceived(response.error, ...(response.responseArgs || []));
  }

  private _basePayloadData(): Partial<IRequestPayload | IResponsePayload> {
    const { channel, senderId } = this;
    return {
      channel, senderId,
      protocol: Protocol,
    };
  }

  private _isForUs(payload: CommonPayload): boolean {
    if (typeof payload !== 'object' || payload.protocol !== Protocol) {
      return false;
    }
    const { senderId, channel } = this;
    if (!payload.senderId || payload.senderId === senderId) { // ignore echos on channel. todo: option to log/warn?
      return false;
    }
    if (!payload.channel || payload.channel !== channel) {
      return false;
    }
    // todo: forEndpoint option? if (payload.forEndpoint && payload.forEndpoint !== senderId) { return false; }
    return true;
  }
}

export {
  Protocol
};