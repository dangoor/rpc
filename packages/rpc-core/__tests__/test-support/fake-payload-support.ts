import {IRequestPayload, IResponsePayload, Protocol} from "../../src/internals/router";

const DefaultFakeChannel = 'someFakeChannel';
const DefaultLocalSenderId = 'fakeLocalSide';
const DefaultRemoteSenderId = 'fakeRemoteSide';
const DefaultFakeRequestId = 'fakeRequest0001';

export function buildFakeRequestPayload(methodName: string, ...userArgs: any[]): IRequestPayload {
  return {
    methodName, userArgs,
    requestId: DefaultFakeRequestId,
    rsvp: true,
    senderId: DefaultLocalSenderId,
    channel: DefaultFakeChannel,
    protocol: Protocol,
  };
}

export function buildFakeResponsePayload(methodName: string, ...responseArgs: any[]): IResponsePayload {
  const error = responseArgs.shift();
  return {
    methodName,
    error, responseArgs,
    respondingTo: DefaultFakeRequestId,
    senderId: DefaultRemoteSenderId,
    channel: DefaultFakeChannel,
    protocol: Protocol,
  };
}


export {
  DefaultFakeChannel,
  DefaultLocalSenderId,
}