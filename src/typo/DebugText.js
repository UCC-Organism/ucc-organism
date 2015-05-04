var Texture2D = require('pex-glu').Texture2D;
var SpriteTextBox = require('./SpriteTextBox');
var Vec3 = require('pex-geom').Vec3;
var OrthographicCamera = require('pex-glu').OrthographicCamera;
var sys = require('pex-sys');

var Platform = sys.Platform;
var FontPath =  Platform.isBrowser ? 'assets/fonts' : __dirname + '/../../assets/fonts';
var Font = require('../../assets/fonts/LatoRegular-sdf.json');
var Mesh = require('pex-glu').Mesh;
var Cube = require('pex-gen').Cube;
var SolidColor = require('pex-materials').SolidColor;
var glu = require('pex-glu');
var Color = require('pex-color').Color;

function DebugText(windowWidth, windowHeight, scale) {
  this.windowWidth = windowWidth;
  this.windowHeight = windowHeight;

  var fontTex = this.fontTex = Texture2D.load(FontPath + '/' + Font.pages[0], { mipmaps: true, flip: true }, function(fontTex) {});

  this.text = new SpriteTextBox('hello world', {
    fontSize: (scale == 2) ? 20 : 12,
    lineHeight: 1.2,
    font: Font,
    textures: [ fontTex ],
    position3d: new Vec3(-1, 0, -1),
    color: (scale == 2) ? Color.White : Color.White,
    bgColor: (scale == 2) ? Color.White : Color.White,
    border: (scale == 2) ? Color.Black : Color.Black,
    smoothing: (scale == 2) ? 1/16 : 1/4,
  })

  this.camera2d = new OrthographicCamera(0, 0, this.windowWidth, this.windowHeight);

  this.texts = [];
}

DebugText.prototype.drawText = function(str, position) {
  this.texts.push({
    str: str,
    position: position
  })
}

DebugText.prototype.draw = function(camera) {
  glu.enableAlphaBlending(true);
  this.fontTex.bind(); //TODO: bind font texture!!!!

  SpriteTextBox.fontMaterial.uniforms.color = this.text.opts.color;
  //SpriteTextBox.fontMaterial.uniforms.bgColor = this.text.opts.bgColor;
  SpriteTextBox.fontMaterial.uniforms.border = this.text.opts.border;
  SpriteTextBox.fontMaterial.uniforms.smoothing = this.text.opts.smoothing;

  this.texts.forEach(function(text) {
    this.text.rebuild(text.str);
    var position2d = camera.getScreenPos(text.position, this.windowWidth, this.windowHeight);
    this.text.mesh.position.x = position2d.x;
    this.text.mesh.position.y = position2d.y;
    this.text.mesh.draw(this.camera2d);
  }.bind(this));

  this.texts = [];
}


module.exports = DebugText;