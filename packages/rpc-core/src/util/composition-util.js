


function forwardPublicMethods(target, Klass) {
  const proto = Klass.prototype;
  Object.getOwnPropertyNames(proto).forEach(methodName => {
    if (_isPublicMethod(methodName) && typeof target[methodName] === 'function' && !promise[methodName]) {
      target[methodName] = (...args) => proto[methodName].apply(target, ...args);
    }
  });
}


function composeExtendedPromise(promise, targetInstance, proto) {
  proto = proto || Object.getPrototypeOf(targetInstance);
  Object.getOwnPropertyNames(proto).forEach(methodName => {
    if (_isPublicMethod(methodName) && typeof targetInstance[ methodName ] === 'function' && !promise[ methodName ]) {
      promise[ methodName ] = (...args) => targetInstance[ methodName ].apply(targetInstance, args);
    }
  });
}

// todo: if used elsewhere, maybe add options (custom filter, permit underscore, etc)
function _isPublicMethod(methodName) {
  return methodName !== 'constructor' &&
    methodName.charAt(0) !== '_';
}

module.exports = {
  composeExtendedPromise,
  forwardPublicMethods,
};