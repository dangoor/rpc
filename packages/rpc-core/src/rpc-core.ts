

interface IRpcOpts {
  channel: string;
}
const DefaultRpcOpts = {
  channel: 'CommonChannel',
};

export default class Rpc {
  private opts: IRpcOpts;

  constructor(opts: Partial<IRpcOpts>) {
    this.opts = Object.assign({}, DefaultRpcOpts, opts);
  }


}