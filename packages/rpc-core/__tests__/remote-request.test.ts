import RemoteRequest from '../src/remote-request';
import FlightReceipt from '../src/flight-receipt';



describe('@wranggle/rpc-core/remote-request', () => {

  const buildRequest = (methodName: string, ...userArgs: any[]) => new RemoteRequest(methodName, userArgs, {});


  test('hold methodName and user args', () => {
    const req = buildRequest('someMethod', 4, 5, 6);
    const data = req.dataForPayload();
    expect(data.methodName).toBe('someMethod');
    expect(data.userArgs).toEqual([ 4, 5, 6 ]);
  });

  test('set correct defaults and a requestId', () => {
    const data = buildRequest('someMethod').dataForPayload();
    expect(typeof data.requestId).toBe('string');
    expect(data.rsvp).toBe(true);
  });

  test('honors rsvp false', () => {
    const req = new RemoteRequest('boo', [], { rsvp: false });
    expect(req.dataForPayload().rsvp).toBe(false);
  });

  test('flightReceipt call is idempotent', () => {
    const req = buildRequest('someMethod', 4, 5, 6);
    req.buildPayload({}); // can ignore root payload data here. (senderId, channel, protocol)
    const f1 = req.flightReceipt();
    const f2 = req.flightReceipt();
    expect(f1).toEqual(f2);
    expect(f1 instanceof FlightReceipt);
  });

  describe('enforce timeout', () => {
    // todo: implement
  })

});
