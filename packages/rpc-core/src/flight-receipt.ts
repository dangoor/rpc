import {IResponseResolver} from "./remote-request";


interface IRequestStatus {

}

export interface RemotePromise<T> extends Promise<T> {
  status(): IRequestStatus;
  resolveNow(...results: any[]): void;
}

export default class FlightReceipt {
  private responseResolver: IResponseResolver;

  constructor(responseResolver: IResponseResolver) {
    this.responseResolver = responseResolver;
  }

  status(): IRequestStatus {
    // todo: implement
    return {};
  }

  resolveNow(...results: any[]): void {
    this.responseResolver.resolve(...results);
  }

  rejectNow(reason: any): void {
    this.responseResolver.reject(reason);
  }

  updateTimeout(ms: number): void {
    // todo: implement. cancel existing if present. pass in callback from RemoteRequest?
  }

  decoratePromise(promise: Promise<any>): void {
    Object.getOwnPropertyNames(FlightReceipt.prototype).forEach(methodName => {
      if (methodName !== 'constructor' && methodName.charAt(0) !== '_' && typeof this[methodName] === 'function' && !promise[methodName]) {
        promise[methodName] = (...args) => this[methodName].apply(this, args);
      }
    });
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



}
