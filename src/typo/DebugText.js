var Texture2D = require('pex-glu').Texture2D;
var SpriteTextBox = require('./SpriteTextBox');
var Vec3 = require('pex-geom').Vec3;
var OrthographicCamera = require('pex-glu').OrthographicCamera;

var FontPath = __dirname + '/../../assets/fonts';
var Font = require(FontPath + '/LatoRegular-sdf.json');
var Mesh = require('pex-glu').Mesh;
var Cube = require('pex-gen').Cube;
var SolidColor = require('pex-materials').SolidColor;
var glu = require('pex-glu');

function DebugText(windowWidth, windowHeight) {
  this.windowWidth = windowWidth;
  this.windowHeight = windowHeight;

  var fontTex = this.fontTex = Texture2D.load(FontPath + '/' + Font.pages[0], { mipmaps: true, flip: true }, function(fontTex) {});

  this.text = new SpriteTextBox('hello world', {
    fontSize: 50,
    lineHeight: 1.2,
    font: Font,
    textures: [ fontTex ],
    position3d: new Vec3(-1, 0, -1)
  })

  this.camera2d = new OrthographicCamera(0, 0, this.windowWidth, this.windowHeight);
}

DebugText.prototype.draw = function(camera) {
  var position2d = camera.getScreenPos(this.text.opts.position3d, this.windowWidth, this.windowHeight);
  this.text.mesh.position.x = position2d.x + 5;
  this.text.mesh.position.y = position2d.y - 5;
  glu.enableAlphaBlending(true);
  this.fontTex.bind(); //TODO: bind font texture!!!!
  this.text.mesh.draw(this.camera2d);
}


module.exports = DebugText;