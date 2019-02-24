import Router, {IRequestPayload, IResponsePayload} from '../src/router';
import RemoteRequest from '../src/remote-request';
import {buildFakeRequestPayload, buildFakeResponsePayload, DefaultFakeChannel } from "./test-support/fake-payload-support";
import {IRpcTransport} from "../src/rpc-core";



describe('@wranggle/rpc-core/router', () => {


  describe('messages', () => {
    const FakeChannel = DefaultFakeChannel;
    let transport, router, lastValidatedRequestReceived;

    const receiveFakeRequest = (methodName: string, ...userArgs: any[]) => transport.fakeReceive(buildFakeRequestPayload(methodName, ...userArgs));

    const MockOnValidatedRequestHandler = (methodName: string, userArgs: any[]): Promise<any> => {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      lastValidatedRequestReceived = { methodName, userArgs, promise, resolve, reject } ;
      return promise;
    };

    const mockRouter = (handler=MockOnValidatedRequestHandler): Router => {
      transport = new MockTransport();
      const router = new Router({ onValidatedRequest: handler});
      router.routerOpts({ transport, channel: FakeChannel, senderId: 'fakeSenderId' });
      return router;
    };

    beforeEach(() => {
      lastValidatedRequestReceived = null;
      router = mockRouter();
    });

    describe('sending requests', () => {

      test('proper payload data over transport', () => {
        router.sendRemoteRequest(new RemoteRequest('boo', [ 1, 2 ], {}));
        expect(transport.sent.length).toBe(1);
        const payload = transport.sent[0];
        const { requestId, channel, senderId, protocol, methodName, userArgs, rsvp } = payload;
        expect(requestId.length).toBe(12);
        expect(channel).toBe(FakeChannel);
        expect(senderId).toBe('fakeSenderId');
        expect(protocol).toBe('WranggleRpc-1');
        expect(methodName).toBe('boo');
        expect(userArgs).toEqual([ 1, 2 ]);
        expect(rsvp).toBe(true);
      });

      test('returns RemotePromise', () => {
        const val = router.sendRemoteRequest(new RemoteRequest('aa', [], {}));
        expect(typeof val.then).toBe('function');
        expect(typeof val.isPending).toBe('function');
      });

      test('tracks pending requests', () => {
        expect(router.pendingRequestIds().length).toBe(0);
        router.sendRemoteRequest(new RemoteRequest('fn', [], { rsvp: true }));
        expect(router.pendingRequestIds().length).toBe(1);
      });

      test('does not track requests when rsvp disabled', () => {
        router.sendRemoteRequest(new RemoteRequest('fn', [], { rsvp: false }));
        expect(router.pendingRequestIds().length).toBe(0);
      });
    });

    describe('receiving requests', () => {
      test('pass validated message to request handler', () => {
        receiveFakeRequest('method_b', 22);
        expect(lastValidatedRequestReceived).toBeDefined();
        expect(lastValidatedRequestReceived).toBeDefined();
        const { methodName, userArgs } = lastValidatedRequestReceived;
        expect(methodName).toBe('method_b');
        expect(userArgs).toEqual([ 22 ]);
      });

      test('send response when request handler resolves', async () => {
        receiveFakeRequest('someMethod', 'someArg');
        const { promise, resolve, reject } = lastValidatedRequestReceived;
        const pendingRequestId = transport.received[0].requestId;
        setTimeout(() => resolve('someResult'), 3);
        const val = await promise;
        expect(val).toBe('someResult');
        expect(transport.sent.length).toBe(1);
        const payload = transport.sent[0];
        expect(payload.respondingTo).toBe(pendingRequestId);
        expect(payload.responseArgs).toEqual([ 'someResult' ]);
      });

      
      // todo: should ignore duplicate requests
      // todo: reject
    });

    describe('receiving response', () => {
      const receiveFakeReply = (requestId: string, methodName: string, responseArgs: any[]) => {
        const responsePayload = buildFakeResponsePayload(methodName, ...responseArgs);
        responsePayload.respondingTo = requestId;
        transport.fakeReceive(responsePayload);
      };

      test('resolves RemotePromise', async () => {
        const remotePromise = router.sendRemoteRequest(new RemoteRequest('someGreeting', [], {}));
        setTimeout(() => {
          receiveFakeReply(router.pendingRequestIds()[0], 'someGreeting', [ null, 'howdy' ]);
        }, 3);
        const val = await remotePromise;
        expect(val).toBe('howdy');
      });

      test('update pending request list', async () => {
        const pendingCount = () => router.pendingRequestIds().length;
        expect(pendingCount()).toBe(0);
        router.sendRemoteRequest(new RemoteRequest('any', [], {}));
        expect(pendingCount()).toBe(1);
        receiveFakeReply(router.pendingRequestIds()[0], 'any', []);
        expect(pendingCount()).toBe(0);
      });
    });

  });


   // todo: cur:
  // describe('filtering messages on transport', () => {
  //
  // });
  //
  // describe('ignoring other traffic on transport', () => {
  //   test('malformed message payloads', async () => {
  //
  //   });
  //
  //   test('messages on other rpc channels', async () => {
  //
  //   });
  //
  //   test('echo messages sent by itself', async () => {
  //
  //   });
  // });
  //


});

type Payload = IRequestPayload | IResponsePayload;
class MockTransport implements IRpcTransport {
  sent = <Payload[]>[];
  received = <Payload[]>[];
  _onMessage?: (payload: Payload) => void;

  fakeReceive(payload: Payload) {
    this.received.push(payload);
    this._onMessage && this._onMessage(payload);
  }
  listen(onMessage: (payload: Payload) => void): void {
    this._onMessage = onMessage;
  }

  sendMessage(payload: IRequestPayload | IResponsePayload): void {
    this.sent.push(payload);
  }
  stopTransport(): void {
  }

}