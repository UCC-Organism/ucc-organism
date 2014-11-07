var sys = require('pex-sys');
var Platform = sys.Platform;

var Config = {
  dataPath: Platform.isPlask ? __dirname + '/../data' : 'data'
}

module.exports = Config;