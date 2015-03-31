var R            = require('ramda');
var Context      = require('pex-glu').Context;
var RenderTarget = require('pex-glu').RenderTarget;
var Texture2D    = require('pex-glu').Texture2D;
var Platform     = require('pex-sys').Platform;
var Color        = require('pex-color').Color;
var Config       = require('../../config');
var glu          = require('pex-glu');
var fx           = require('pex-fx');
var PointSpriteTexturedSimple = require('../../materials/PointSpriteTexturedSimple');

function makeFilter(property, value) {
  return function(o) {
    if (typeof o[property] == 'undefined') return true;
    else return o[property] == value;
  }
}

function agentProxyRendererSys(state) {
  var camera = state.camera;
  var gl = Context.currentContext;

  if (!state.agentProxyRT) {
    state.agentProxyRT = new RenderTarget(state.windowWidth/4, state.windowHeight/4);
    state.agentProxyTex = state.agentProxyRT.getColorAttachment(0);
    var glowImage = Platform.isPlask ? __dirname + '/../../../assets/glow.png' : 'assets/glow.png';
    state.agentProxyMaterial = new PointSpriteTexturedSimple({ texture: Texture2D.load(glowImage), alpha: 0.1 });
  }

  var energyMeshEntity = R.find(R.where({ energyMesh: true }), state.entities);
  var agentMeshEntity = R.find(R.where({ agentMesh: true }), state.entities);

  glu.clearColor(Color.Black);
  state.agentProxyRT.bind();
  glu.viewport(0, 0, state.agentProxyRT.width, state.agentProxyRT.height);
  glu.clearColor(Color.Black);
  glu.enableAdditiveBlending(true);
  glu.enableDepthReadAndWrite(false, false);
  energyMeshEntity.mesh.setMaterial(state.agentProxyMaterial);
  energyMeshEntity.mesh.material.uniforms.pointSize = Config.energySpriteSize * state.DPI * state.zoom * 6;
  energyMeshEntity.mesh.draw(camera);
  agentMeshEntity.mesh.setMaterial(state.agentProxyMaterial);
  agentMeshEntity.mesh.material.uniforms.pointSize = Config.agentSpriteSize * state.DPI * state.zoom;
  agentMeshEntity.mesh.draw(camera);
  state.agentProxyRT.unbind();
  glu.viewport(0, 0, state.windowWidth, state.windowHeight);
  fx().asFXStage(state.agentProxyTex).downsample2().blur5().blur5().blit({ width: state.windowWidth, height: state.windowHeight });
  glu.enableBlending(false);
}

module.exports = agentProxyRendererSys;