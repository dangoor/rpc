

export interface PromiseResolver {
  promise: Promise<any>;
  resolve: (result?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
}

export default function buildPromiseResolver(): PromiseResolver {
  let promise, resolve, reject;
  promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // @ts-ignore
  return { promise, resolve, reject };
}