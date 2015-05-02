var sys               = require('pex-sys');
var glu               = require('pex-glu');
var random            = require('pex-random');
var color             = require('pex-color');
var gui               = require('pex-gui');
var R                 = require('ramda');
var Promise           = require('bluebird');
var remap             = require('re-map');
var plask             = require('plask');

var config            = require('../../config');
var Crayons           = require('../../crayons/crayons');
var Window            = sys.Window;
var Platform          = sys.Platform;
var Time              = sys.Time;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball           = glu.Arcball;
var Color             = color.Color;
var GUI               = gui.GUI;
var settings          = require('../../settings');

var cells             = require('./cells');

//-----------------------------------------------------------------------------

function drawDisplayObject(o, crayon) {
  crayon.save();
  crayon.translate(o.x, o.y);
  switch(o.type) {
    case 'circle':
      crayon.fill(o.color).circle(0, 0, o.r);
      if (o.children) o.children.forEach(function(child) {
        drawDisplayObject(child, crayon);
      })
      break;
    case 'repeat':
      for(var i=0; i<o.n; i++) {
        crayon.save();
          var a = 2 * Math.PI * i / o.n;
          var dx = o.r * Math.cos(a);
          var dy = o.r * Math.sin(a);
          crayon.translate(dx, dy);
          if (o.children) o.children.forEach(function(child) {
            drawDisplayObject(child, crayon);
          })
          crayon.restore();
      }
      break;
    default:
      if (o.children) o.children.forEach(function(child) {
        drawDisplayObject(child, crayon);
      })
  }
  crayon.restore();
}

//-----------------------------------------------------------------------------

Window.create({
  settings: {
    width: 1280*1.5,
    height: 1280*1.5,
    type: '2d',
    highdpi: 2,
    fullscreen: Platform.isBrowser ? true : false,
  },
  cells: [],
  saveFrame: false,
  init: function() {
    this.initMouse();
    this.initKeyboard();

    this.crayon = new Crayons(this.canvas);

    this.initCells();
  },
  initKeyboard: function() {
    this.on('keyDown', function(e) {
      if (e.str == ' ') {
        this.saveFrame = true;
      }
    }.bind(this));
  },
  initMouse: function() {
    this.on('mouseDown', function(e) {
      //this.pull = { x: e.x, y: e.y};
    }.bind(this));
    this.on('mouseDragged', function(e) {
      //this.pull = { x: e.x, y: e.y};
    }.bind(this));
    this.on('mouseUp', function(e) {
      //this.pull = null;
    }.bind(this));
  },
  initCells: function() {
    var r = this.width/2;
    var cell = {
      x: this.width/2, y: this.height/2, scale: 1,
      children: [
        {
          type: 'circle', x: 0, y:0, r: r * 0.2, color: [255, 0, 0, 255 ]
        },
        {
          type: 'repeat', x: 0, y:0, r: r * 0.2, n: 3,
          children: [
            { type: 'circle', x: 0, y:0, r: r * 0.1, color: [0, 200, 0, 255 ] }
          ]
        }
      ]
    };

    this.cells = [];
    this.cells.push(cell);
  },
  draw: function() {
    var crayon = this.crayon;

    this.crayon.clear().fill(config.cellStyle.bg).rect(0, 0, this.width, this.height);

    if (this.saveFrame) {
      this.canvas.drawColor(255, 0,0, 0, this.paint.kClearMode);
    }

    drawDisplayObject(this.cells[0], this.crayon);

    if (this.saveFrame) {
      this.saveFrame = false;
      this.canvas.writeImage('png', Date.now() + '.png');
    }

    //crayon.restore();
  }
});