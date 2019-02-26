import {IDict, IRpcTransport} from "../rpc-core";

type TransportFactory = (opts: any) => IRpcTransport;
const transportFactoryByType = <IDict<TransportFactory>>{};

export function registerTransport(transportType: string, transportFactory: TransportFactory): void {
  transportFactoryByType[transportType] = transportFactory;
}


export function buildTransport(val: any): IRpcTransport | void{
  if (!val) {
    throw new Error('Invalid transport options');
  }
  if (typeof val === 'string') {
    val = { transportType: val };
  }
  let transport;
  if (_isTransport(val)) {
    transport = val as IRpcTransport;
  } else {
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

function _hasTransportType(transportType: string): boolean {
  return !!(transportType && transportFactoryByType[transportType]);
}

function _isTransport(val: any): boolean {
  if (typeof val !== 'object') {
    return false;
  }
  return val && [ 'sendMessage', 'listen', 'stopTransport' ].every(m => typeof val[m] === 'function');
}