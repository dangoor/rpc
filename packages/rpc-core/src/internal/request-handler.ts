import {DelegateOpts, IDict, RpcOpts} from "../interfaces";


interface IRequestHandlerDelegateHolder {
  delegate: object;
  opts: DelegateOpts;
}

const MissingMethodErrorCode = 'MethodNotFound'; // todo: move to constants or a custom error type

const DefaultDelegateOpts = {
  ignoreWithUnderscorePrefix: true,
  ignoreInherited: true,
};

interface NamedRequestHandlerHolder {
  fn: (...args: any[]) => any;
  context: any;
}
export default class RequestHandler {
  private _rootOpts=<Partial<RpcOpts>>{};
  private _requestHandlerDelegateHolders=<IRequestHandlerDelegateHolder[]>[];
  private _namedRequestHandlerHolderByMethodName = <IDict<NamedRequestHandlerHolder>>{};


  requestHandlerOpts(opts: Partial<RpcOpts>) {
    this._rootOpts = opts;
  }

  addRequestHandlerDelegate(delegate: any, opts?: DelegateOpts): void {
    if (typeof delegate !== 'object') {
      throw new Error('Expecting an object containing request handlers');
    }
    opts = Object.assign({ context: delegate }, DefaultDelegateOpts, opts);
    this._requestHandlerDelegateHolders.push({ delegate, opts });
  }

  addRequestHandler(methodName: string, fn: (...args: any[]) => any, context?: any): any {
    // note: intentionally accepts "_" prefix method names
    this._namedRequestHandlerHolderByMethodName[methodName] = { fn, context };
  }

  addRequestHandlers(fnByMethodName: IDict<(...args: any[]) => any>, context?: any): any {
    Object.keys(fnByMethodName).forEach((methodName) => {
      if (methodName.charAt(0) !== '_') {
        this.addRequestHandler(methodName, fnByMethodName[methodName], context);
      }
    });
  }

  onValidatedRequest(methodName: string, userArgs: any[]): Promise<any> {
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
      const delegateHolder = this._requestHandlerDelegateHolders.find((holder: IRequestHandlerDelegateHolder): boolean => {
        const { delegate, opts } = holder;
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
      if (delegateHolder) {
        fn = (<any>delegateHolder.delegate)[methodName];
        context = delegateHolder.opts.context === undefined ? delegateHolder.delegate : delegateHolder.opts.context;
      }
    }
    if (!fn) {
      return Promise.reject({errorCode: MissingMethodErrorCode, methodName});
    } else {
      try {
        return Promise.resolve(fn.apply(context, userArgs)).catch(reason => {
          if (typeof reason === 'object' && (reason.stack || reason instanceof Error)) {
            return Promise.reject(this._applyUncaughtErrorData(reason, { methodName }));
          } else {
            return Promise.reject(reason);
          }
        });
      } catch (err) {
        // console.warn(`Uncaught error in "${methodName}" request handler:`, err);
        return Promise.reject(this._applyUncaughtErrorData(err, { methodName }));
      }
    }
  }

  get senderId() {
    return this._rootOpts.senderId;
  }

  _applyUncaughtErrorData(err: any, extra: any) {
    const { message, fileName, lineNumber } = err;
    return  Object.assign({
      errorCode: err.errorCode || (!err.name || err.name === 'Error' ? 'UncaughtError' : err.name),
      endpoint: this.senderId,
    }, err, { message, fileName, lineNumber }, extra);
  }
}

export {
  MissingMethodErrorCode,
}