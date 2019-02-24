import { IDict, IRpcOpts} from "./rpc-core";


interface IRequestHandlerDelegateHolder {
  delegate: object;
  opts: IDelegateOpts;
}

export interface IDelegateOpts {

  /**
   * Ignores inherited methods, using Object.hasOwnProperty check.
   */
  ignoreInherited?: boolean;

  /**
   * Ignores methods beginning with an underscore "_".
   */
  ignoreWithUnderscorePrefix?: boolean;

  /**
   * Custom filter to determine if it's ok to call a method on the delegate object. It is applied after the above
   * built-in filters run/pass. When provided, the method runs if the filter returns `true`.
   * @param delegate
   * @param methodName
   * @param methodArgs
   */
  shouldRun?: (delegate: object, methodName: string, ...methodArgs: any[]) => boolean;

  context?: any;

}

export default class RequestHandler {
  private _rootOpts=<Partial<IRpcOpts>>{};
  private _requestHandlerDelegateHolders=<IRequestHandlerDelegateHolder[]>[];
  private _namedRequestHandlers = <IDict<(...args: any[]) => any>>{};


  requestHandlerOpts(opts: Partial<IRpcOpts>) {
    this._rootOpts = opts;
  }

  addRequestHandlerDelegate(delegate: any, opts?: IDelegateOpts): void {
    if (typeof delegate !== 'object') {
      throw new Error('Expecting an object containing request handlers');
    }
    opts = Object.assign({
      ignoreWithUnderscorePrefix: true,
      ignoreInherited: true,
      ignoreConstructor: true,
      context: delegate,
    }, opts);
    this._requestHandlerDelegateHolders.push({ delegate, opts });
  }

  // tmp - todo: cur: mv to requestHandler
  addRequestHandler(methodName: string, fn: (...args: any[]) => any): any {
    this._namedRequestHandlers[methodName] = fn;
  }

  // tmp - todo: cur: mv to requestHandler
  addRequestHandlers(fnByMethodName: IDict<(...args: any[]) => any>): any {
    Object.keys(fnByMethodName).forEach((methodName) => this.addRequestHandler(methodName, fnByMethodName[methodName]));
  }

  onValidatedRequest(methodName: string, userArgs: any[]): Promise<any> {
    let context;
    let fn = this._namedRequestHandlers[methodName];
    if (!fn) {
      const holder = this._requestHandlerDelegateHolders.find((holder: IRequestHandlerDelegateHolder): boolean => {
        const { delegate, opts } = holder;
        if (methodName === 'constructor') {
          return false;
        }
        if (typeof (delegate as any)[methodName] !== 'function') {
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
      if (holder) {
        fn = (<any>holder.delegate)[methodName];
        context = holder.opts.context;
      }
    }
    if (fn) {
      return Promise.resolve(fn.apply(context, userArgs))
    } else {
      return Promise.reject({ errorCode: 'MethodNotFound', methodName });
    }
  }
}