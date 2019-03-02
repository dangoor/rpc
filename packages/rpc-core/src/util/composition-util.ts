
// Had this as a .js file to avoid all the ts-ignores but couldn't get typescript to include it in out/ build dir and I don't
// want to script/merge the non-ts files in a different step.
// setting 'allowJs' fails with: error TS5053: Option 'allowJs' cannot be specified with option 'declaration'.
// sigh.. typescript brings some nice benefits but a lot of headaches too


export function composeExtendedPromise(promise: Promise<any>, targetInstance: any, proto: any) {
  proto = proto || Object.getPrototypeOf(targetInstance);
  Object.getOwnPropertyNames(proto).forEach(methodName => {
    // @ts-ignore
    if (_isPublicMethod(methodName) && typeof targetInstance[ methodName ] === 'function' && !promise[ methodName ]) {
      // @ts-ignore
      promise[ methodName ] = (...args) => targetInstance[ methodName ].apply(targetInstance, args);
    }
  });
}

// todo: if used elsewhere, maybe add options (custom filter, permit underscore, etc)
function _isPublicMethod(methodName: string) {
  return methodName !== 'constructor' &&
    methodName.charAt(0) !== '_';
}

// todo: use or rm:
// function forwardPublicMethods(target: any, Klass: Function) {
//   const proto = Klass.prototype;
//   Object.getOwnPropertyNames(proto).forEach(methodName => {
//     // @ts-ignore
//     if (_isPublicMethod(methodName) && typeof target[methodName] === 'function' && !promise[methodName]) {
//       // @ts-ignore
//       target[methodName] = (...args) => proto[methodName].apply(target, ...args);
//     }
//   });
// }

