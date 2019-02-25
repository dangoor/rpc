import FlightReceipt, {RemotePromise, Status, TimeoutErrorCode} from "../src/flight-receipt";
import {waitMs} from "./test-support/time-support";
import {IRequestPayload} from "../src/router";
import {buildFakeRequestPayload} from "./test-support/fake-payload-support";


describe('@wranggle/rpc-core/flight-receipt', () => {


  const buildFlightReceipt = (requestPayload=<Partial<IRequestPayload>>{}) =>
    new FlightReceipt({ ...buildFakeRequestPayload('fakeMethod'), ...requestPayload });


  describe('RemotePromise', () => {

    test('looks like ES6/ES2015 promise', () => { // https://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects
      const remotePromise = buildFlightReceipt()._decoratedPromise();
      expect(typeof remotePromise.then).toBe('function');
      expect(typeof remotePromise.then).toBe('function');
      expect(typeof remotePromise.then).toBe('function');
      // maybe check Symbol..
    });

    test('behaves like a promise', async () => {
      const flightReceipt = buildFlightReceipt();
      const remotePromise = flightReceipt._decoratedPromise();
      setTimeout(() => flightReceipt._remoteResponseReceived(null, 'good'), 5);
      const val = await remotePromise;
      expect(val).toBe('good');
    });

    describe('provides public FlightReceipt methods', () => {
      let remotePromise, flightReceiptInstance;

      const mockResolve = (result?: any) => flightReceiptInstance._remoteResponseReceived(null, result);

      beforeEach(() => {
        flightReceiptInstance = buildFlightReceipt();
        remotePromise = flightReceiptInstance._decoratedPromise();
      });

      test('isPending', () => {
        expect(remotePromise.isPending()).toBe(true);
        mockResolve();
        expect(remotePromise.isPending()).toBe(false);
      });

      test('resolveNow', async () => {
        remotePromise.resolveNow('hurry');
        expect(remotePromise.isPending()).toBe(false);
        const val = await remotePromise;
        expect(val).toBe('hurry');
      });

      test('ignore late-arriving resolution when forcing with `resolveNow`', async () => {
        setTimeout(() => remotePromise.resolveNow('good'), 1);
        setTimeout(() => mockResolve('bad'), 3);
        await waitMs(7);
        const val = await remotePromise;
        expect(val).toBe('good');
      });

      test('info', () => {
        let info = remotePromise.info();
        expect(info.status).toBe(Status.Pending);
        expect(info.requestId).toBeDefined();
        expect(info.requestedAt).toBeDefined(); // to be date
        expect(info.completedAt).toBeUndefined();
        mockResolve();
        info = remotePromise.info();
        expect(info.status).toBe(Status.RemoteResult);
        expect(info.completedAt).toBeDefined();
      });

      test('rejectNow', async () => {
        expect(remotePromise.isPending()).toBe(true);
        let reason;
        try {
          remotePromise.rejectNow('testForceRejectingRemotePromise');
          await remotePromise;
        } catch (err) {
          reason = err;
        }
        expect(reason).toBe('testForceRejectingRemotePromise');
        expect(remotePromise.isPending()).toBe(false);
        expect(remotePromise.info().status).toBe(Status.ForcedError);
      });

      describe('timeouts', () => {
        // note: RemoteRequest calls updateTimeout if a root or method-scoped default was set.
        // The user can also set it on the RemotePromise, tested here.

        test('applying updateTimeout', async () => {
          setTimeout(() => remotePromise.resolveNow('good'), 10);
          remotePromise.updateTimeout(1);
          let reason;
          try {
            await remotePromise;
          } catch (err) {
            reason = err;
          }
          await waitMs(15);
          expect(reason).toBe(TimeoutErrorCode);
        });

        test('modify timeout', async () => {
          setTimeout(() => {
            remotePromise.resolveNow('good');
          }, 20);
          remotePromise.updateTimeout(10);
          remotePromise.updateTimeout(30);
          await waitMs(40);
          const result = await remotePromise;
          expect(result).toBe('good');
        });
      });
    });



    test('immediately self-resolves when rsvp false', async () => {
      const flightReceipt = buildFlightReceipt({ rsvp: false });
      const remotePromise = flightReceipt._decoratedPromise();
      await remotePromise;
      expect(remotePromise.isPending()).toBe(false);
      expect(remotePromise.info().status).toBe(Status.SkipRsvp);
    });
  });

  // todo: updateTimeout


});
