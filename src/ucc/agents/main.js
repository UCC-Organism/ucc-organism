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

var cells             = require('./cells');
var log               = require('debug')('ucc/agents/main')


var state = {
};

var lineHeight = 1.0;

function matrixLayout(w, h, n, lineHeight) {
  var lineHeight = lineHeight || 1;
  var size = w / n;
  return function(i) {
    var cx = i % n;
    var cy = Math.floor(i / n);
    var x = (cx + 0.5) * size;
    var y = (cy + 0.5) * size * lineHeight;
    return {
      x: x,
      y: y,
      width: size,
      height: size
    }
  }
}

function hex2rgb(hex) {
  var c = Color.fromHex(hex);
  return [ Math.floor(c.r * 255), Math.floor(c.g * 255), Math.floor(c.b * 255) ];
}

//-----------------------------------------------------------------------------

Window.create({
  settings: {
    width: 2048,
    height: 2048,
    //height: 1280,
    type: '2d3d',
    highdpi: 2,
    fullscreen: Platform.isBrowser ? true : false,
  },
  cells: [],
  programmeLabels: [],
  saveFrame: false,
  savePDFFrame: true,
  init: function() {
    this.initScene();
    this.initStores();
    this.initMouse();
    this.initKeyboard();

    this.crayon = new Crayons(this.canvas);
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
      this.pull = { x: e.x, y: e.y};
    }.bind(this));
    this.on('mouseDragged', function(e) {
      this.pull = { x: e.x, y: e.y};
    }.bind(this));
    this.on('mouseUp', function(e) {
      this.pull = null;
    }.bind(this));
  },
  initScene: function() {
    state.camera = new PerspectiveCamera(60, this.width / this.height);
    state.arcball = new Arcball(this, state.camera);
  },
  initStores: function() {
    Promise.all([
    ])
    .spread(function() {
      this.initAgents();
    }.bind(this))
    .catch(function(e) {
      log(e.stack)
    })
  },
  initAgents: function() {
    var layout = matrixLayout(this.width, this.height, 20, lineHeight);
    var index = 0;

    var cellTypes = [
      cells.SplCell,
      cells.PmuCell,
      cells.FysCell,
      cells.SocCell,
      cells.PaedCell,
      cells.DivCell,
      cells.DipSCell,
      cells.DipLCell,
      cells.TeacherCell,
      cells.ResearcherCell,
      cells.JanitorCell,
      cells.CookCell,
      cells.AdminCell,
    ];

    var programmeLabels = this.programmeLabels = [
      'SPL - Sygeplejerskeuddannelsen',
      'PMU - Psykomotorikuddannelsen',
      'FYS - Fysioterapeutuddannelsen',
      'SOC - Socialrådgiveruddannelsen',
      'PÆD - Pædagoguddannelsen',
      'DIV - Diverse aktiviteter',
      'Diplom S - Diplomuddannelse - Sundhed',
      'Diplom L - Diplomuddannelse - Ledelse',
      'Teacher',
      'Researcher',
      'Janitor',
      'Cook',
      'Admin',
    ];

    var cellColors = this.cellColors = [
      [hex2rgb("#FF0000"), hex2rgb("#FFAA00"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#FFAA00"), hex2rgb("#FFFF00"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#FF00FF"), hex2rgb("#FFAAFF"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#00DDFF"), hex2rgb("#DAFFFF"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#F0F9F5"), hex2rgb("#F0F9F5"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#FF0000"), hex2rgb("#FFAA00"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#FF0000"), hex2rgb("#FFAA00"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#FF0000"), hex2rgb("#FFAA00"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#46DA00"), hex2rgb("#00FF53"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#32FFFB"), hex2rgb("#00C37B"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#7B5647"), hex2rgb("#7B5647"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#FF0000"), hex2rgb("#FFFF00"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ],
      [hex2rgb("#0000FF"), hex2rgb("#00FFFF"), hex2rgb("#FFFFFF"), hex2rgb("#000000"), ]
    ]

    function notEmpty(list) {
      return list.students.length > 0;
    }

    var groupIndex = 0;
    cellTypes.forEach(function(CellType, cellTypeIndex) {
      var students = R.range(0, 20).map(function() {
        return {
          age: 25,
          gender: 0
        }
      })
      students.forEach(function(student) {
        var pos = layout(index++);
        var colors = null;
        //var colors = cellColors[cellTypeIndex];
        this.cells.push(new CellType(student, pos.x, pos.y, pos.width*0.9, colors))
      }.bind(this));

    }.bind(this));

    //exampleGroups.filter(notEmpty).forEach(function(group, groupIndex) {
    //  var CellType = cellTypes[groupIndex % cellTypes.length];
    //  //group.students = group.students.slice(0, Math.floor(group.students.length/2));
    //  group.students = group.students.slice(0, 10);
    //  group.students.forEach(function(student) {
    //    if (index < 100) {
    //      var pos = layout(index++);
    //      this.cells.push(new CellType(student, pos.x, pos.y, pos.width))
    //    }
    //  }.bind(this));
    //}.bind(this));

  },
  draw: function() {
    random.seed(0);

    if (this.savePDFFrame) {
      //this.canvas = new plask.SkCanvas(this.width * 6, this.height * 6);
      this.oldCanvas = this.canvas;
      //this.canvas = plask.SkCanvas.createForPDF('agents.pdf', 595, 842, this.width * 6, this.height * 6);
      this.canvas = plask.SkCanvas.createForPDF('agents.pdf', 842, 595, 842, 595);
      this.crayon = new Crayons(this.canvas);
    }

    if (this.pull) {
      this.cells.forEach(function(cell) {
        cell.fx = (this.pull.x - cell.x) * (0.005 + 0.005 * cell.seed);
        cell.fy = (this.pull.y - cell.y) * (0.005 + 0.005 * cell.seed);
      }.bind(this));
    }
    else {
      this.cells.forEach(function(cell) {
        cell.vx = 0;
        cell.vy = 0;
        cell.fx = 0;
        cell.fy = 0;
      }.bind(this));
    }

    this.cells.forEach(function(cell) {
      cell.vx *= 0.9;
      cell.vy *= 0.9;
      cell.vx += cell.fx;
      cell.vy += cell.fy;
      cell.x += cell.vx;
      cell.y += cell.vy;
    }.bind(this));

    var crayon = this.crayon;

    this.crayon.clear().fill([160, 160, 160, 255]).rect(0, 0, this.width, this.height);

    if (this.saveFrame) {
      this.canvas.drawColor(255, 0,0, 0, this.paint.kClearMode);
    }

    var layout = matrixLayout(this.width*8, this.height*8, 20, lineHeight*8);
    //crayon.save();
    //crayon.scale(1.5, 1.5);
    this.canvas.save();
    if (this.savePDFFrame) {
      this.canvas.scale(0.4, 0.4)
    }
    //this.canvas.scale(6, 6)
    this.cells.forEach(function(cell, cellIndex) {
      cell.draw(this.crayon);
      var rect = layout(cellIndex);
      var w = rect.width;
      var h = rect.height;
      var x = rect.x - w/2;
      var y = rect.y - h/2;
      //this.crayon.stroke([0,0,0,255])
      //  .line(x, y, x + w, y)
      //  .line(x, y + h, x + w, y + h)
      //  .line(x, y, x + w, y + h)
      //  .line(x + w, y, x, y + h)
      //  .line(x, y, x, y + h)
      //  .line(x + w, y, x + w, y + h)
    }.bind(this));
    //crayon.restore();
    this.canvas.restore();


    if (!this.saveFrame && !this.savePDFFrame) {
      this.programmeLabels.forEach(function(label, i) {
        var x = 24;
        var y = lineHeight * this.width/20 * (i + 1);
        this.crayon.fill([0, 0, 0]).font('Arial', 20).text(label, x, y);
      }.bind(this));
    }

    if (this.saveFrame) {
      this.saveFrame = false;
      this.canvas.writeImage('png', Date.now() + '.png');
      this.canvas.writeImage('png', '../../../assets/agents_5.png');
    }

    if (this.savePDFFrame) {
      this.canvas.writePDF();
      this.canvas = this.oldCanvas;
      this.oldCanvas = null;
      this.crayon = new Crayons(this.canvas);
    }

    //crayon.restore();
  }
});
