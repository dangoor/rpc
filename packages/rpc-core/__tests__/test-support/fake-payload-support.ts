import {Protocol} from "../../src/internal/router";
import {RequestPayload, ResponsePayload} from "../../src/interfaces";

const DefaultFakeChannel = 'someFakeChannel';
const DefaultLocalSenderId = 'fakeLocalSide';
const DefaultRemoteSenderId = 'fakeRemoteSide';
const DefaultFakeRequestId = 'fakeRequest0001';

export function buildFakeRequestPayload(methodName: string, ...userArgs: any[]): RequestPayload {
  return {
    methodName, userArgs,
    requestId: DefaultFakeRequestId,
    rsvp: true,
    senderId: DefaultLocalSenderId,
    channel: DefaultFakeChannel,
    transportMeta: {},
    protocol: Protocol,
  };
}

export function buildFakeResponsePayload(methodName: string, ...responseArgs: any[]): ResponsePayload {
  const error = responseArgs.shift();
  const resolveArgs = responseArgs;
  return {
    methodName,
    error, resolveArgs,
    respondingTo: DefaultFakeRequestId,
    senderId: DefaultRemoteSenderId,
    channel: DefaultFakeChannel,
    transportMeta: {},
    protocol: Protocol,
  };
}


export {
  DefaultFakeChannel,
  DefaultLocalSenderId,
}