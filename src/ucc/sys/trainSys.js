var R           = require('ramda');
var sys         = require('pex-sys');
var geom        = require('pex-geom');
var Color       = require('pex-color').Color;
var Vec3        = require('pex-geom').Vec3;
var BoundingBox = require('pex-geom').BoundingBox;
var Config      = require('../../config');
var AgentModes  = require('../agents/agentModes');
var LineBuilder = require('../../gen/LineBuilder');
var Mesh        = require('pex-glu').Mesh;
var SolidColor  = require('pex-materials').SolidColor;
var Texture2D   = require('pex-glu').Texture2D;
var Platform    = require('pex-sys').Platform;
var Time        = require('pex-sys').Time;

var log         = require('debug')('ucc/trainSys');

function trainSys(state) {
  if (!state.trainDebugMeshEntity) {
    var lineBuilder = new LineBuilder();
    lineBuilder.addLine(new Vec3(0, -1, 0), new Vec3(0, 1,0));
    var image = Platform.isPlask ? __dirname + '/../../../assets/lasers.png' : 'assets/lasers.png';
    var mesh = new Mesh(lineBuilder, new SolidColor({ color: Color.Red }), { lines: true });
    mesh.position.z = 0.001;
    state.trainDebugMeshEntity = {
      disableDepthTest: true,
      lineWidth: 2 * state.DPI,
      mesh: mesh,
      debug: true
    };
    state.entities.push(state.trainDebugMeshEntity);

    state.trainWaveStart = 100;
    state.trainWaveEnd = 100;
  }

  if (state.map.dirty) {
    var bbox = BoundingBox.fromPoints(R.pluck('position', state.map.selectedNodes));
    state.trainWaveStart = bbox.min.x - 0.5;
    state.trainWaveEnd = bbox.max.x + 0.5;
    state.trainDebugMeshEntity.mesh.position.x = state.trainWaveEnd;
  }

  if (state.trainArrived) {
    state.trainDebugMeshEntity.mesh.position.x = state.trainWaveStart;
  }

  if (state.trainDebugMeshEntity.mesh.position.x < state.trainWaveEnd) {
    state.trainDebugMeshEntity.mesh.position.x += Config.trainWaveSpeed * Time.delta;
  }

  state.trainArrived = false;
}

module.exports = trainSys;
