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

//-----------------------------------------------------------------------------

Window.create({
  settings: {
    width: 1280*1,
    height: 1280*1.5,
    //height: 1280,
    type: '2d3d',
    highdpi: 2,
    fullscreen: Platform.isBrowser ? true : false,
  },
  cells: [],
  programmeLabels: [],
  saveFrame: false,
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
      console.log(e.stack)
    })
  },
  initAgents: function() {
    var layout = matrixLayout(this.width, this.height, 10, lineHeight);
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

    function notEmpty(list) {
      return list.students.length > 0;
    }

    var groupIndex = 0;
    cellTypes.forEach(function(CellType, cellTypeIndex) {
      students = R.range(0, 10).map(function() {
        return {
          age: 25,
          gender: 0
        }
      })
      students.forEach(function(student) {
        var pos = layout(index++);
        this.cells.push(new CellType(student, pos.x, pos.y, pos.width*0.7))
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

    //crayon.save();
    //crayon.scale(1, 1);
    this.cells.forEach(function(cell) {
      cell.draw(this.crayon);
    }.bind(this));


    if (!this.saveFrame) {
      this.programmeLabels.forEach(function(label, i) {
        var x = 24;
        var y = lineHeight * this.width/10 * (i + 1);
        this.crayon.fill([0, 0, 0]).font('Arial', 20).text(label, x, y);
      }.bind(this));
    }

    if (this.saveFrame) {
      this.saveFrame = false;
      this.canvas.writeImage('png', Date.now() + '.png');
      this.canvas.writeImage('png', '../../../assets/agents_5.png');
    }

    //crayon.restore();
  }
});