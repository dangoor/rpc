'use strict';

var RequestStatus;
(function (RequestStatus) {
    RequestStatus["Pending"] = "Pending";
    RequestStatus["RemoteError"] = "RemoteError";
    RequestStatus["RemoteResult"] = "RemoteResult";
    RequestStatus["ForcedError"] = "ForcedError";
    RequestStatus["ForcedResult"] = "ForcedResult";
    RequestStatus["TimeoutError"] = "TimeoutError";
    RequestStatus["SkipRsvp"] = "SkipRsvp";
})(RequestStatus || (RequestStatus = {}));

const { composeExtendedPromise } = require('../util/composition-util.js');
const TimeoutErrorCode = 'RemoteMethodTimeoutError'; // todo: to constants or custom error
class FlightReceipt {
    constructor(requestPayload, nodejsCallback) {
        this.status = RequestStatus.Pending;
        this.requestPayload = requestPayload;
        this.nodejsCallback = nodejsCallback;
        this.requestedAt = Date.now();
        this._responseResolver = this._initResponseResolver();
        if (this.rsvp === false) {
            this._markResolution(RequestStatus.SkipRsvp, null);
        }
    }
    isPending() {
        return this.status === RequestStatus.Pending;
    }
    info() {
        const { requestedAt, completedAt, status } = this;
        return Object.assign({}, this.requestPayload, { requestedAt: new Date(requestedAt), completedAt: completedAt ? new Date(completedAt) : void (0), status });
    }
    resolveNow(...results) {
        this._markResolution(RequestStatus.ForcedResult, null, ...results);
        // todo: _nodejsCallback case
    }
    rejectNow(reason) {
        this._markResolution(RequestStatus.ForcedError, reason);
        // todo: _nodejsCallback case
    }
    updateTimeout(ms) {
        if (typeof this._timer === 'number') {
            clearTimeout(this._timer);
        }
        if (typeof ms === 'number' && ms > 0) {
            // @ts-ignore
            this._timer = setTimeout(() => this._markResolution(RequestStatus.TimeoutError, TimeoutErrorCode), ms);
        }
    }
    get rsvp() {
        return this.requestPayload.rsvp;
    }
    _decoratedPromise() {
        const promise = this._responseResolver.promise;
        this._ensurePromiseDecorated(promise);
        // @ts-ignore
        return promise;
    }
    _remoteResponseReceived(error, ...result) {
        this._markResolution(error ? RequestStatus.RemoteError : RequestStatus.RemoteResult, error, ...result);
    }
    _initResponseResolver() {
        let promise, resolve, reject;
        promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        // @ts-ignore
        return { promise, resolve, reject };
    }
    _ensurePromiseDecorated(promise) {
        // @ts-ignore
        if (typeof promise.resolveNow === 'function') {
            return;
        }
        composeExtendedPromise(promise, this, FlightReceipt.prototype);
        // notes:
        // I first tried to make this class extend Promise. TypeScript made it awkward to stash the resolve/reject executor params
        // complaining about anything before super. Got past that with an extra superclass to do the stashing (alternatively it could
        // use plain js with prototype acrobatics) but the resulting behavior was broken. (eg, await would accept the promise but
        // would clobber any resulting value.) Lots posted on the subject but I decided to drop that line for now, just copying
        // the desired methods onto the promise.
        //
        // Alternatively, can maybe try `implements Promise`. ts declarations for them would be:
        // then!: <TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null) => Promise<TResult1 | TResult2>;
        // catch!: <TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null) => Promise<any | TResult>;
        // finally!: (onfinally?: (() => void) | undefined | null) => Promise<any>;
        // also: readonly [Symbol.toStringTag]: "Promise";
    }
    _markResolution(status, error, ...result) {
        if (!this.isPending()) {
            return; // warn/error/throw if resolved more than once? Maybe only if forced locally? (when you prob want to ignore the late-arriving remote response.)
        }
        this.completedAt = this.rsvp ? Date.now() : this.requestedAt;
        this.status = status;
        const { resolve, reject } = this._responseResolver;
        if (error) {
            reject(error);
        }
        else {
            resolve(...result);
        }
    }
}

const kvid = require('kvid');
const DefaultRequestOpts = {
    timeout: -1,
    rsvp: true,
};
class RemoteRequest {
    constructor(methodName, userArgs, requestOpts) {
        if (typeof userArgs[userArgs.length - 1] === 'function') {
            this.nodejsCallback = userArgs.pop();
        }
        this.methodName = methodName;
        this.userArgs = userArgs;
        this.requestId = kvid(12);
        this.opts(Object.assign({}, DefaultRequestOpts, requestOpts));
        this._initTimeout();
    }
    opts(requestOpts) {
        this.requestOpts = Object.assign(this.requestOpts || {}, requestOpts);
    }
    isRsvp() {
        return !!this.requestOpts.rsvp;
    }
    buildPayload(endpointBaseData) {
        const { requestId, methodName, userArgs } = this;
        const payload = Object.assign(endpointBaseData, {
            requestId, methodName, userArgs,
            rsvp: this.isRsvp(),
            transportMeta: {},
        });
        this._payload = payload;
        return payload;
    }
    dataForPayload() {
        const { requestId, methodName, userArgs } = this;
        return { requestId, methodName, userArgs, rsvp: this.isRsvp() };
    }
    flightReceipt() {
        const receipt = this._ensureFlightReceipt();
        if (this.nodejsCallback) {
            return receipt;
        }
        else {
            return receipt._decoratedPromise();
        }
    }
    responseReceived(error, ...result) {
        this._ensureFlightReceipt()._remoteResponseReceived(error, ...result);
    }
    _ensureFlightReceipt() {
        if (!this._payload) {
            throw new Error('Cannot get receipt before request data initialized');
        }
        if (!this._receipt) {
            this._receipt = new FlightReceipt(this._payload, this.nodejsCallback);
            const timeout = this.requestOpts.timeout;
            if (typeof timeout === 'number' && timeout > 0) {
                this._receipt.updateTimeout(timeout);
            }
        }
        return this._receipt;
    }
    _initTimeout() {
        // todo: stash on this._timeout
    }
    _clearTimeout() {
        // todo: clearTimeout(this._timeout). // call if value changes or if force-resolved
    }
}

const transportFactoryByType = {};
function registerTransport(transportType, transportFactory) {
    transportFactoryByType[transportType] = transportFactory;
}
function buildTransport(val) {
    if (!val) {
        throw new Error('Invalid transport options');
    }
    if (typeof val === 'string') {
        val = { transportType: val };
    }
    let transport;
    if (_isTransport(val)) {
        transport = val;
    }
    else {
        let transportType, transportOpts;
        if (_hasTransportType(val.transportType || val.type)) {
            transportType = val.transportType || val.type;
            transportOpts = val;
        }
        // else { // for now dropping support for signature like: { chrome: { forTabId: 20 } }
        //   transportType = Object.keys(val).find(_hasTransportType);
        //   transportOpts = transportType && val[transportType];
        // }
        if (transportOpts === true) {
            transportOpts = {};
        }
        if (transportType) {
            transport = transportFactoryByType[transportType](transportOpts);
        }
    }
    if (!transport) {
        console.warn('Unable to creat transport instance from passed in options:', val);
    }
    return transport;
}
function _hasTransportType(transportType) {
    return !!(transportType && transportFactoryByType[transportType]);
}
function _isTransport(val) {
    if (typeof val !== 'object') {
        return false;
    }
    return val && ['sendMessage', 'listen', 'stopTransport'].every(m => typeof val[m] === 'function');
}

const Protocol = 'WranggleRpc-1';
class Router {
    constructor(opts) {
        this._pendingRequests = {};
        this._finishedRequestIds = new Set(); // todo: @wranggle/rotating-cache to clear/expire (not very big but a memory leak as written.)
        this._stopped = false;
        this._rootOpts = {};
        this._preparseFilters = [];
        this._onValidatedRequest = opts.onValidatedRequest;
    }
    useTransport(transportOpts) {
        const transport = this.transport = buildTransport(transportOpts);
        transport && transport.listen(this._onMessage.bind(this));
        // todo: send handshake message?
    }
    stopTransport() {
        if (this.transport) {
            this.transport.stopTransport();
            this.transport = void (0);
        }
    }
    sendRemoteRequest(req) {
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
    checkConnectionStatus(opts = {}) {
        // todo: implement (do ping-pong check, making sure router does not call onValidatedRequest)
        // do not Reject for timeout, just mark data as bad connection. (Default timeout? 500?)
        // some data to include: isConnected; response time; lastMessageReceivedAt; pingPongResponseTime; endpoint data (senderId, protocol, channel) for local and for remote; timestamp;
        return Promise.resolve({ todo: 'implement this' });
    }
    routerOpts(opts) {
        this._rootOpts = Object.assign(this._rootOpts, opts);
        opts.transport && this.useTransport(opts.transport);
        if (typeof opts.preparseAllIncomingMessages === 'function') {
            this._preparseFilters.push(opts.preparseAllIncomingMessages);
        }
    }
    pendingRequestIds() {
        return Object.keys(this._pendingRequests);
    }
    get senderId() {
        return this._rootOpts.senderId;
    }
    get channel() {
        return this._rootOpts.channel;
    }
    _onMessage(payload) {
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
            }
            catch (err) {
                console.error('Error in preparseAllIncomingMessages filter. Invalidating incoming message.', err);
                current = false;
            }
            if (current === false) {
                parsedPayload = false;
            }
            else if (typeof current === 'object') {
                parsedPayload = current;
            }
        });
        if (parsedPayload.requestId) {
            this._receiveRequest(parsedPayload);
        }
        else if (parsedPayload.respondingTo) {
            this._receiveResponse(parsedPayload);
        }
    }
    _receiveRequest(payload) {
        const requestId = payload.requestId;
        if (this._finishedRequestIds.has(requestId)) {
            return; // warn/error of duplicate message?
        }
        this._finishedRequestIds.add(requestId);
        this._onValidatedRequest(payload.methodName, payload.userArgs)
            .then((...result) => this._handleRsvp(payload, null, result))
            .catch((reason) => this._handleRsvp(payload, reason, []));
    }
    _handleRsvp(requestPayload, error, responseArgs) {
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
        });
        this.transport.sendMessage(response);
    }
    _receiveResponse(response) {
        const requestId = response.respondingTo;
        const req = this._pendingRequests[requestId];
        if (!req || !req.isRsvp()) { // todo: log/warn?
            return;
        }
        delete this._pendingRequests[requestId];
        req.responseReceived(response.error, ...(response.responseArgs || []));
    }
    _basePayloadData() {
        const { channel, senderId } = this;
        return {
            channel, senderId,
            protocol: Protocol,
            transportMeta: {},
        };
    }
    _isForUs(payload) {
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

const MissingMethodErrorCode = 'MethodNotFound'; // todo: move to constants or a custom error type
const DefaultDelegateOpts = {
    ignoreWithUnderscorePrefix: true,
    ignoreInherited: true,
};
class RequestHandler {
    constructor() {
        this._rootOpts = {};
        this._requestHandlerDelegateHolders = [];
        this._namedRequestHandlerHolderByMethodName = {};
    }
    requestHandlerOpts(opts) {
        this._rootOpts = opts;
    }
    addRequestHandlerDelegate(delegate, opts) {
        if (typeof delegate !== 'object') {
            throw new Error('Expecting an object containing request handlers');
        }
        opts = Object.assign({ context: delegate }, DefaultDelegateOpts, opts);
        this._requestHandlerDelegateHolders.push({ delegate, opts });
    }
    addRequestHandler(methodName, fn, context) {
        // note: intentionally accepts "_" prefix method names
        this._namedRequestHandlerHolderByMethodName[methodName] = { fn, context };
    }
    addRequestHandlers(fnByMethodName, context) {
        Object.keys(fnByMethodName).forEach((methodName) => {
            if (methodName.charAt(0) !== '_') {
                this.addRequestHandler(methodName, fnByMethodName[methodName], context);
            }
        });
    }
    onValidatedRequest(methodName, userArgs) {
        let context;
        if (!methodName || methodName === 'constructor') {
            return Promise.reject({ errorCode: MissingMethodErrorCode, methodName });
        }
        userArgs = userArgs || [];
        let fn;
        const namedHolder = this._namedRequestHandlerHolderByMethodName[methodName];
        if (namedHolder) {
            fn = namedHolder.fn;
            context = namedHolder.context;
        }
        if (!fn) {
            const delegateHolder = this._requestHandlerDelegateHolders.find((holder) => {
                const { delegate, opts } = holder;
                if (typeof delegate[methodName] !== 'function') {
                    return false;
                }
                if (opts.ignoreWithUnderscorePrefix && methodName.charAt(0) === '_') {
                    return false;
                }
                if (opts.ignoreInherited && !(delegate.hasOwnProperty(methodName) || Object.getPrototypeOf(delegate).hasOwnProperty(methodName))) {
                    return false;
                }
                if (typeof opts.shouldRun === 'function' && opts.shouldRun(delegate, methodName, ...userArgs) !== true) {
                    return false;
                }
                return true;
            });
            if (delegateHolder) {
                fn = delegateHolder.delegate[methodName];
                context = delegateHolder.opts.context === undefined ? delegateHolder.delegate : delegateHolder.opts.context;
            }
        }
        if (!fn) {
            return Promise.reject({ errorCode: MissingMethodErrorCode, methodName });
        }
        else {
            try {
                return Promise.resolve(fn.apply(context, userArgs)).catch(reason => {
                    if (typeof reason === 'object' && (reason.stack || reason instanceof Error)) {
                        return Promise.reject(this._applyUncaughtErrorData(reason, { methodName }));
                    }
                    else {
                        return Promise.reject(reason);
                    }
                });
            }
            catch (err) {
                // console.warn(`Uncaught error in "${methodName}" request handler:`, err);
                return Promise.reject(this._applyUncaughtErrorData(err, { methodName }));
            }
        }
    }
    get senderId() {
        return this._rootOpts.senderId;
    }
    _applyUncaughtErrorData(err, extra) {
        const { message, fileName, lineNumber } = err;
        return Object.assign({
            errorCode: err.errorCode || (!err.name || err.name === 'Error' ? 'UncaughtError' : err.name),
            endpoint: this.senderId,
        }, err, { message, fileName, lineNumber }, extra);
    }
}

const kvid$1 = require('kvid');
const DefaultRpcOpts = {
    channel: 'CommonChannel',
    requireRemoteMethodRegistration: false,
};
class RpcCore {
    constructor(rpcOpts) {
        this._rootOpts = {};
        this._requestOptsByMethod = {};
        this.requestHandler = new RequestHandler();
        this.router = new Router({ onValidatedRequest: this.requestHandler.onValidatedRequest.bind(this.requestHandler) });
        if (typeof rpcOpts === 'string') { // hmm, not an especially useful constructor signature but looks good in the readme example
            rpcOpts = { transport: rpcOpts };
        }
        this.opts(Object.assign({ senderId: kvid$1(8) }, DefaultRpcOpts, rpcOpts));
    }
    addRequestHandlerDelegate(delegate, opts) {
        this.requestHandler.addRequestHandlerDelegate(delegate, opts);
    }
    addRequestHandler(methodName, fn, context) {
        this.requestHandler.addRequestHandler(methodName, fn, context);
    }
    addRequestHandlers(fnByMethodName, context) {
        this.requestHandler.addRequestHandlers(fnByMethodName, context);
    }
    useTransport(transportOpts) {
        this.router.useTransport(transportOpts);
    }
    opts(opts) {
        this.router.routerOpts(opts);
        this.requestHandler.requestHandlerOpts(opts);
        Object.assign(this._rootOpts, opts);
    }
    remoteInterface() {
        const itself = this;
        return new Proxy({}, {
            get: function (obj, methodName) {
                return (...userArgs) => itself.makeRemoteRequest(methodName, userArgs);
            }
        });
    }
    makeRemoteRequest(methodName, userArgs, requestOpts = {}) {
        const rootOpts = this._rootOpts;
        requestOpts = Object.assign({}, rootOpts.allRequestOpts, this._requestOptsByMethod[methodName], requestOpts);
        const req = new RemoteRequest(methodName, userArgs, requestOpts);
        return this.router.sendRemoteRequest(req);
    }
    setDefaultRequestOptsForMethod(methodName, requestOpts) {
        this._requestOptsByMethod[methodName] = Object.assign((this._requestOptsByMethod[methodName] || {}), requestOpts);
    }
    // todo: checkConnectionStatus(opts = <IConnectionStatusOpts>{}): Promise<IConnectionStatus> {
    //   return this.router.checkConnectionStatus(opts); // TODO: not yet implemented
    // }
    get senderId() {
        return this._rootOpts.senderId;
    }
    static registerTransport(transportType, transportFactory) {
        registerTransport(transportType, transportFactory);
    }
}

const DefaultOpts = {
    messageEventName: 'LocalRpcEvent'
};
/**
 * This is mostly for internal testing but does have a use/role in production, as syntactical sugar for events.
 * For example, rather than `myObserver.emit('ShowErrorAlert', 'Server is offline')` you might set up RPC with this transport
 * and then make use of with something like: alerts.show('Server is offline')
 *
 *
 */
class LocalObserverTransport {
    constructor(eventEmitter, opts = {}) {
        this._isStopped = false;
        if (!_isEventEmitter(eventEmitter)) {
            console.error('LocalObserverTransport expecting an EventEmitter for its first param. Got:', eventEmitter);
            throw new Error('InvalidArgument constructing LocalObserverTransport');
        }
        this.observer = eventEmitter;
        opts = Object.assign({}, DefaultOpts, opts);
        this.eventName = opts.messageEventName || DefaultOpts.messageEventName;
    }
    listen(handler) {
        this._removeExistingListener();
        this._eventListener = (payload) => {
            if (!this._isStopped) {
                handler(payload);
            }
        };
        this.observer.on(this.eventName, this._eventListener);
    }
    sendMessage(payload) {
        if (!this._isStopped) {
            this.observer.emit(this.eventName, payload);
        }
    }
    stopTransport() {
        this._isStopped = true;
        this._removeExistingListener();
    }
    _removeExistingListener() {
        this._eventListener && this.observer.removeListener(this.eventName, this._eventListener);
    }
}
function _isEventEmitter(obj) {
    return typeof (obj === 'object') && ['on', 'emit', 'removeListener'].every(m => typeof obj[m] === 'function');
}

const chromeApi = require('./chrome-manifest-2-api.js');
class ChromeTransport {
    constructor(opts = {}) {
        this._stopped = false;
        if (!chromeApi.hasChromeExtensionApi()) {
            throw new Error('Invalid environment: expecting a Chromium extension');
        }
        // TODO: use firefox `browser` API directly. (but they're also compatible w/ Chrome API so just using that in first pass)
        this._isContentScript = chromeApi.isContentScript();
        this._chromeExtensionId = chromeApi.getChromeRuntimeId();
        this._opts = this._initOpts(opts);
    }
    listen(onMessage) {
        if (typeof onMessage !== 'function') {
            throw new Error('Invalid message handler');
        }
        this._removeListener();
        const { skipExtensionIdCheck, receiveFromTabId, permitMessage } = this._opts;
        const chromeRuntimeId = this._chromeExtensionId;
        this._messageHandler = (payload, sender) => {
            if (skipExtensionIdCheck || chromeRuntimeId !== (sender || {}).id) {
                // console.debug('Ignoring message because sender.id does not match chrome.runtime.id.');
                return;
            }
            if (receiveFromTabId) {
                const tabId = sender && sender.tab && sender.tab.id;
                if (receiveFromTabId !== tabId) {
                    return;
                }
            }
            if (typeof permitMessage === 'function' && permitMessage(payload, sender) !== true) {
                return;
            }
            onMessage(payload);
        };
        chromeApi.addMessageListener(this._messageHandler);
    }
    sendMessage(payload) {
        if (this._stopped) {
            return;
        }
        if (this._opts.sendToTabId) {
            chromeApi.sendMessageToTab(this._opts.sendToTabId, payload, chromeApi.warnIfErrorCb());
        }
        else {
            chromeApi.sendRuntimeMessage(payload, chromeApi.warnIfErrorCb());
        }
    }
    stopTransport() {
        this._stopped = true;
        this._removeListener();
    }
    _removeListener() {
        this._messageHandler && chromeApi.removeMessageListener(this._messageHandler);
    }
    _initOpts(opts) {
        if (opts.skipExtensionIdCheck && typeof opts.permitMessage !== 'function') {
            throw new Error('When "skipExtensionIdCheck" is enabled, you must provide a custom "permitMessage" filter function');
        }
        opts.receiveFromTabId = opts.receiveFromTabId || opts.forTabId;
        opts.sendToTabId = opts.sendToTabId || opts.forTabId;
        if (this._isContentScript && (opts.receiveFromTabId || opts.sendToTabId)) {
            console.warn('The "forTabId", "sendToTabId", and "receiveFromTabId" options can only be applied in the main browser extension context, not in a content script. Ignoring.');
        }
        return opts;
    }
}

class PostmessageTransport {
    constructor(opts) {
        this._isStopped = false;
        const sendingWindow = opts.sendingWindow || opts.targetWindow;
        if (!sendingWindow || typeof sendingWindow.postMessage !== 'function') {
            throw new Error('Expecting a browser window or contentWindow. Passed in value is missing "postMessage"');
        }
        const receivingWindow = opts.receivingWindow || opts.targetWindow;
        if (!receivingWindow || typeof receivingWindow.addEventListener !== 'function') {
            throw new Error('Expecting a browser window or contentWindow. Passed in value is missing "addEventListener"');
        }
        if (!opts.sendToOrigin) {
            throw new Error('sendToOrigin required');
        }
        this._sendingWindow = sendingWindow;
        this._receivingWindow = receivingWindow;
        this._opts = opts;
    }
    listen(rpcHandler) {
        this._removeExistingListener();
        // @ts-ignore
        let shouldReceive = this._opts.shouldReceive || global.location.origin;
        this._windowEventListener = (evt) => {
            if (this._isStopped) {
                return;
            }
            const origin = evt.origin;
            let permitted = false;
            if (typeof shouldReceive === 'function') {
                permitted = shouldReceive(origin);
            }
            else if (typeof shouldReceive === 'string') {
                permitted = origin === shouldReceive;
            }
            if (permitted === true) {
                rpcHandler(evt.data);
            }
        };
        this._receivingWindow.addEventListener('message', this._windowEventListener);
    }
    sendMessage(payload) {
        if (this._isStopped) {
            return;
        }
        this._sendingWindow.postMessage(payload, this._opts.sendToOrigin);
    }
    stopTransport() {
        this._isStopped = true;
        this._removeExistingListener();
    }
    _removeExistingListener() {
        this._windowEventListener && this._receivingWindow.removeListener('message', this._windowEventListener);
    }
}

const kvid$2 = require('kvid');
class RelayTransport {
    constructor(opts) {
        this._relayId = opts.relayId || kvid$2(10);
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
    // listen(unused: (payload: (RequestPayload | ResponsePayload)) => void): void {
    //   console.warn('RelayTransport does not need to be used on WranggleRpc directly. It can only relay, it cannot make its own remote requests or handle requests');
    // }
    // sendMessage(payload: RequestPayload | ResponsePayload): void {
    //   throw new Error('RelayTransport cannot make its own remote requests, it can only relay messages between other endpoints.')
    // }
    stopTransport() {
        this._left.stopTransport();
        this._right.stopTransport();
    }
    _startRelay(from, to) {
        from.listen((payload) => {
            payload.transportMeta.relays = (payload.transportMeta.relays || []).concat([this._relayId]);
            to.sendMessage(payload);
        });
    }
}

Object.assign(RpcCore, {
    BrowserExtensionTransport: ChromeTransport,
    LocalObserverTransport,
    PostmessageTransport,
    TransportRelay: RelayTransport,
    WranggleRpc: RpcCore,
});
module.exports = RpcCore;
// note: rollup is yelling at me about mixing named and default exports (even for UMD output) so using module.exports instead of:
// export default WranggleRpc;
// export {
//   BrowserExtensionTransport,
//   LocalObserverTransport,
//   PostmessageTransport,
//   TransportRelay,
// }
