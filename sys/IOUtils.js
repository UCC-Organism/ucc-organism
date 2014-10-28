var Promise = require('bluebird');
var sys = require('pex-sys');

var IO = sys.IO;

var IOUtils = {};

IOUtils.loadTextFile = function(url) {
  return new Promise(function(resolve, reject) {
    IO.loadTextFile(url, function(data) {
      if (data) resolve(data);
      else reject(new Error('Failed to load : ' + url));
    });
  })
}

IOUtils.loadJSON = function(url) {
  return IOUtils.loadTextFile(url)
    .then(JSON.parse);
}

module.exports = IOUtils;