var Log = {
  onceCache: {},
  once: function() {
    var args = Array.prototype.slice.call(arguments);
    var argsStr = args.join(' ');
    if (!Log.onceCache[argsStr]) {
      Log.onceCache[argsStr] = true;
      console.log(argsStr);
    }
  }
}

module.exports = Log;