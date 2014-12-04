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
var GroupStore        = require('../stores/GroupStore');
var ActivityStore     = require('../stores/ActivityStore');
var Crayons           = require('../../crayons/crayons');
var Window            = sys.Window;
var Platform          = sys.Platform;
var Time              = sys.Time;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball           = glu.Arcball;
var Color             = color.Color;
var GUI               = gui.GUI;

var state = {

};

function matrixLayout(w, h, n) {
  var size = w / n;
  console.log('size', size);
  return function(i) {
    var cx = i % n;
    var cy = Math.floor(i / n);
    var x = (cx + 0.5) * size;
    var y = (cy + 0.5) * size;
    return {
      x: x,
      y: y,
      width: size,
      height: size
    }
  }
}

function SimpleCell(student, x, y, size) {
  this.student = student;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size;
  this.seed = Math.random();
}

SimpleCell.prototype.draw = function(crayon) {
  var minAge = 20;
  var maxAge = 50;

  var seed = this.seed;
  var t = Time.seconds * 2 + seed;
  var student = this.student;
  var r = this.size * remap(student.age, minAge, maxAge, 0.1, 0.35);
  var r2 = r / 2;
  r *= (1 + 0.2 * Math.sin(t));
  r2 *= (1 + 0.2 * Math.sin(t + Math.PI/2));

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(t * 50 * (seed - 0.5));

  var x = Math.cos(seed * Math.PI * 2) * r*0.3;
  var y = Math.sin(seed * Math.PI * 2) * r*0.3;

  var x2 = x + Math.cos(seed * Math.PI * 2) * r;
  var y2 = y + Math.sin(seed * Math.PI * 2) * r;

  crayon.fill([240, 255, 255, 50])
    .circle(x, y, r + 5)
    .circle(x2, y2, r2 + 5);

  crayon.fill([239, 105, 108, 255])
    .circle(x, y, r)
    .circle(x2, y2, r2);

  crayon
    .fill([233, 178, 128, 255])
    .circle(x2, y2,  Math.max(1, r2 - 4));

  for(var i=0; i<seed * 5; i++) {
    crayon
    .fill([255, 255, 255, 255])
    .circle(x2 + (Math.random()-0.5) * r/3, y2 + (Math.random()-0.5) * r/3, r/10)
  }

  crayon.restore();
}

function TeacherCell(student, x, y, size) {
  this.student = student;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size;
  this.seed = Math.random();
}

TeacherCell.prototype.draw = function(crayon) {
  var minAge = 20;
  var maxAge = 50;

  var seed = this.seed;
  var t = Time.seconds * 2 + seed;
  var student = this.student;
  var r = this.size * remap(student.age, minAge, maxAge, 0.1, 0.35);
  var r2 = r / 2;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(t * 50 * (seed - 0.5));

  var x = Math.cos(seed * Math.PI * 2) * r*0.3;
  var y = Math.sin(seed * Math.PI * 2) * r*0.3;

  var x2 = x + Math.cos(seed * Math.PI * 2) * r;
  var y2 = y + Math.sin(seed * Math.PI * 2) * r;

  crayon.fill([240, 255, 255, 50])
    .circle(x, y, r + 5);

  var n = Math.floor(2 + 5 * seed);
  for(var i=0; i<n; i++) {
    crayon.circle(x + r * Math.cos(i/(n-1) * Math.PI * 2), y + r * Math.sin(i/(n-1) * Math.PI * 2), r2 + 5);
  }

  crayon.fill([39, 178, 128, 255]);
  crayon.circle(x, y, r);
  var n = Math.floor(2 + 5 * seed);
  for(var i=0; i<n; i++) {
    crayon.fill([39, 178, 128, 255]);
    crayon.circle(x + r * Math.cos(i/(n-1) * Math.PI * 2), y + r * Math.sin(i/(n-1) * Math.PI * 2), r2);
    crayon.fill([255, 255, 255, 150]);
    crayon.circle(x + r * Math.cos(i/(n-1) * Math.PI * 2), y + r * Math.sin(i/(n-1) * Math.PI * 2), Math.max(5, r/10));
  }

  crayon.restore();
}

function FysCell(student, x, y, size) {
  this.student = student;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size;
  this.seed = Math.random();
  //this.path = new plask.SkPath();
}

FysCell.prototype.draw = function(crayon) {
  var minAge = 20;
  var maxAge = 50;

  var seed = this.seed;
  var t = Time.seconds * 2 + seed;
  var student = this.student;
  var r = this.size * remap(student.age, minAge, maxAge, 0.1, 0.35);
  var r2 = r / 2;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(t * 50 * (seed - 0.5));

  var x = Math.cos(seed * Math.PI * 2) * r*0.3;
  var y = Math.sin(seed * Math.PI * 2) * r*0.3;

  var x2 = x + Math.cos(seed * Math.PI * 2) * r;
  var y2 = y + Math.sin(seed * Math.PI * 2) * r;

  crayon.fill([240, 255, 255, 50]);
  crayon.circle(x, y, r + 5);

  //this.path.reset();
  //this.path.moveTo(-r, -r);
  //this.path.lineTo( 0,  r);
  //this.path.lineTo( r, -r);

  var n = Math.floor(2 + 5 * seed);
  for(var i=0; i<n; i++) {
    crayon.circle(x + r * Math.cos(i/(n-1) * Math.PI * 2), y + r * Math.sin(i/(n-1) * Math.PI * 2), r2 + 5);
  }

  crayon.fill([39, 100, 178, 255]);
  //TODO crayon.drawPath(this.path); //TODO
  var n = Math.floor(2 + 5 * seed);
  for(var i=0; i<n; i++) {
    crayon.fill([39, 100, 178, 255]);
    crayon.circle(x + r * Math.cos(i/(n-1) * Math.PI * 2), y + r * Math.sin(i/(n-1) * Math.PI * 2), r2);
    crayon.fill([255, 255, 255, 150]);
    crayon.circle(x + r * Math.cos(i/(n-1) * Math.PI * 2), y + r * Math.sin(i/(n-1) * Math.PI * 2), Math.max(5, r/10));
  }

  crayon.fill([255, 0, 0, 255]);

  crayon.restore();
}

function PaedCell(student, x, y, size, scale) {
  this.student = student;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size;
  this.scale = scale;
  this.seed = Math.random();
  //this.path = new plask.SkPath();
}

PaedCell.prototype.draw = function(crayon) {
  var minAge = 20;
  var maxAge = 50;

  var seed = this.seed;
  var t = Time.seconds * 2 + seed;
  var student = this.student;
  var r = this.size * remap(student.age, minAge, maxAge, 0.1, 0.35);
  var r2 = r / 2;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(t * 50 * (seed - 0.5));
  crayon.scale(this.scale, this.scale);

  var x = Math.cos(seed * Math.PI * 2) * r*0.3;
  var y = Math.sin(seed * Math.PI * 2) * r*0.3;

  var x2 = x + Math.cos(seed * Math.PI * 2) * r;
  var y2 = y + Math.sin(seed * Math.PI * 2) * r;

  crayon.fill([240, 255, 255, 50]);
  crayon.circle(x, y, r + 5);

  //this.path.reset();
  //this.path.moveTo(-r, -r);
  //this.path.lineTo( 0,  r);
  //this.path.lineTo( r, -r);

  var n = Math.floor(2 + 5 * seed);

  //TODO //crayon.drawPath(paint, this.path);
  var n = Math.floor(2 + 5 * seed);
  for(var i=0; i<n; i++) {
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(360/n * i);
    var px = 0;
    var py = 0;
    crayon.roundRect(px-10, py + 2, 20, 33, 5, 5);
    crayon.restore();
  }
  for(var i=0; i<n; i++) {
    crayon.fill([200, 150, 20, 255]);
    crayon.fill([255, 255, 255, 150]);
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(360/n * i)
    var px = 0;
    var py = 20;
    crayon.circle(px, py, 10);
    //crayon.roundRect(px-2.5, py + 5, 5, 15, 3, 3);
    crayon.restore();
  }
  for(var i=0; i<n; i++) {
    crayon.fill([200, 150, 20, 255]);
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(360/n * i)
    var px = 0;
    var py = 20;
    crayon.circle(px, py, 5);
    crayon.restore();
  }

  crayon.fill([255, 0, 0, 255]);

  crayon.restore();
}

function PaedCell2(student, x, y, size) {
  this.student = student;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size;
  this.seed = Math.random();
  //this.path = new plask.SkPath();
}

PaedCell2.prototype.draw = function(crayon) {

  var minAge = 20;
  var maxAge = 50;

  var seed = this.seed;
  var t = Time.seconds * 2 + seed;
  var student = this.student;
  var r = this.size * remap(student.age, minAge, maxAge, 0.1, 0.35);
  var r2 = r / 2;
  var scale = remap(student.age, minAge, maxAge, 0.5, 1.2);
  scale = random.float(0.5, 1);

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.scale(scale, scale);
  crayon.rotate(t * 50 * (seed - 0.5));

  var x = Math.cos(seed * Math.PI * 2) * r*0.3;
  var y = Math.sin(seed * Math.PI * 2) * r*0.3;

  var x2 = x + Math.cos(seed * Math.PI * 2) * r;
  var y2 = y + Math.sin(seed * Math.PI * 2) * r;

  crayon.fill([240, 255, 255, 50]);
  crayon.circle(x, y, r + 5);

  //this.path.reset();
  //this.path.moveTo(-r, -r);
  //this.path.lineTo( 0,  r);
  //this.path.lineTo( r, -r);

  var n = Math.floor(2 + 5 * seed);

  //TODO//crayon.drawPath(paint, this.path);
  var n = Math.floor(2 + 5 * seed);
  for(var i=0; i<n; i++) {
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(360/n * i);
    var px = 0;
    var py = 0;
    crayon.roundRect(px-10, py + 2, 20, 33, 5, 5);
    crayon.restore();
  }
  for(var i=0; i<n; i++) {
    crayon.fill([200, 150, 20, 255]);
    crayon.fill([255, 255, 255, 150]);
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(360/n * i)
    var px = 0;
    var py = 20;
    crayon.restore();
  }
  for(var i=0; i<n; i++) {
    crayon.fill([200, 100, 20, 255]);
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(360/n * i)
    var px = 0;
    var py = 20;
    crayon.roundRect(px-2.5, py + 5, 5, 15, 3, 3);
    crayon.restore();
  }

  crayon.fill([255, 0, 0, 255]);

  crayon.restore();
}

function PaedCell3(student, x, y, size) {
  this.student = student;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size;
  this.seed = Math.random();
  //this.path = new plask.SkPath();
}

PaedCell3.prototype.draw = function(crayon) {

  var minAge = 20;
  var maxAge = 50;

  var seed = this.seed;
  var t = Time.seconds * 2 + seed;
  var student = this.student;
  var r = this.size * remap(student.age, minAge, maxAge, 0.1, 0.35);
  var r2 = r / 2;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(t * 50 * (seed - 0.5));

  var x = Math.cos(seed * Math.PI * 2) * r*0.3;
  var y = Math.sin(seed * Math.PI * 2) * r*0.3;

  var x2 = x + Math.cos(seed * Math.PI * 2) * r;
  var y2 = y + Math.sin(seed * Math.PI * 2) * r;

  crayon.fill([240, 255, 255, 50]);
  crayon.circle(x, y, r + 5);

  //this.path.reset();
  //this.path.moveTo(-r, -r);
  //this.path.lineTo( 0,  r);
  //this.path.lineTo( r, -r);

  //TODO//crayon.drawPath(paint, this.path);
  var n = Math.floor(3 + 5 * seed);
  for(var i=0; i<n; i++) {
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(360/n * i);
    var px = 0;
    var py = 0;
    crayon.roundRect(px-10, py + 10, 20, 25, 5, 5);
    crayon.restore();
  }
  for(var i=0; i<n; i++) {
    crayon.fill([200, 150, 20, 255]);
    //crayon.circle(x + r * Math.cos(i/(n-1) * Math.PI * 2), y + r * Math.sin(i/(n-1) * Math.PI * 2), r2);
    crayon.fill([255, 255, 255, 150]);
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(360/n * i)
    var px = 0;
    var py = 5;
    crayon.roundRect(px-5, py + 5, 10, 15, 10, 10);
    crayon.restore();
  }
  for(var i=0; i<n; i++) {
    crayon.fill([100, 50, 220, 255]);
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(360/n * i)
    var px = 0;
    var py = 5;
    crayon.roundRect(px-2.5, py + 5, 5, 10, 5, 2);
    crayon.restore();
  }

  crayon.fill([255, 0, 0, 255]);

  crayon.restore();
}

Window.create({
  settings: {
    width: 1280,
    height: 720,
    type: '2d',
    highdpi: 1,
    fullscreen: Platform.isBrowser ? true : false,
  },
  cells: [],
  init: function() {
    this.initScene();
    this.initStores();
    this.initMouse();

    this.crayon = new Crayons(this.canvas);
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
      ActivityStore.init(),
      GroupStore.init()
    ])
    .spread(function(activities, groups) {
      state.groups = groups;
      state.activities = activities;
      this.initAgents(activities, groups);
    }.bind(this))
    .catch(function(e) {
      console.log(e.stack)
    })
  },
  initAgents: function(activities, groups) {
    var programmes = R.uniq(R.map(R.prop('programme'), groups.all));

    console.log('len', groups.all.length)
    console.log('departments', R.uniq(R.map(R.prop('department'), groups.all)))
    console.log('programmes', programmes);
    console.log('groups', groups.all.length, R.uniq(R.map(R.prop('id'), groups.all)).length);
    console.log('students', R.uniq(R.map(R.prop('id'), R.flatten(R.map(R.prop('students'), groups.all)))).length);
    console.log('teachers', R.uniq(R.flatten(R.map(R.prop('teachers'), activities.all))).length);

    var exampleGroups = programmes.map(function(programme) {
      var programmeGroups = groups.all.filter(R.where({ programme: programme }));
      var notEmptyGroups = programmeGroups.filter(function(group) {
        return group.students.length  > 0;
      });
      var group = {};
      if (notEmptyGroups.length > 0) {
        group = notEmptyGroups[0];
      }
      else {
        group.students = [];
      }
      console.log(programme, group.students.length)
      return group;
    });

    var layout = matrixLayout(this.width*2, this.height, 14*2);
    var index = 0;

    var cellTypes = [
      //SimpleCell,
      //TeacherCell,
      //FysCell,
      PaedCell,
      //PaedCell2,
      //PaedCell3
    ];

    exampleGroups.forEach(function(group, groupIndex) {
      var CellType = cellTypes[groupIndex % cellTypes.length];
      group.students = group.students.slice(0, Math.floor(group.students.length/2));
      if (group.students.length == 0) {
        for(var i=0; i<10; i++) {
          group.students.push({
            age: random.int(20, 35)
          })
        }
      }
      group.students.forEach(function(student) {
        var pos = layout(index++);
        this.cells.push(new CellType(student, pos.x, pos.y, pos.width/2, 0.75))
      }.bind(this));
    }.bind(this));
    //this.cells = this.cells.slice(2, 3);
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

    this.crayon.clear().fill([40, 40, 50, 255]).rect(0, 0, this.width, this.height);

    //crayon.save();
    //crayon.scale(1, 1);
    this.cells.forEach(function(cell) {
      cell.draw(this.crayon);
    }.bind(this));
    //crayon.restore();
  }
});