var config = require('../../config');
var style  = config.cellStyle;
var remap  = require('re-map');
var random = require('pex-random');
var R      = require('ramda');

//-----------------------------------------------------------------------------

function SplCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.5;
  this.seed = Math.random();
}

SplCell.prototype.draw = function(crayon) {
  var student = this.student;
  var seed = this.seed;
  random.seed(seed);
  var r = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.2, 0.35);
  var r2 = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.05, 0.15);
  var d = (r + r2)*0.5*0.5;
  var x = -d;
  var y = -d;
  var x2 = d;
  var y2 = d;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(360 * seed - 0.5);

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)
    .circle(x2, y2, r2 + 6);

  crayon.fill(this.color)
    .circle(x, y, r + 5)
    .circle(x2, y2, r2 + 5);

  crayon.fill(style.cellInside)
    .circle(x, y, r)
    .circle(x2, y2, r2);

  var x3 = x + Math.random()

  var corePos = random.vec2(r - r/4)

  crayon.fill(style.cellCore)
    .circle(x + corePos.x, y + corePos.y, r/4)

  crayon.restore();
}

//-----------------------------------------------------------------------------

function PmuCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.5;
  this.seed = Math.random();
}

PmuCell.prototype.draw = function(crayon) {
  var student = this.student;
  var seed = this.seed;
  random.seed(seed);
  var r = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.2, 0.35);
  var r2 = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.05, 0.15);
  var d = (r + r2)*0.5*0.5;
  var x = -d;
  var y = -d;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(360 * seed - 0.5);

  var numLegs = random.int(3, 7);

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)

  crayon.fill(this.color)
    .circle(x, y, r + 5)

  crayon.fill(style.cellInside)
    .circle(x, y, r)

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .translate(r, 0)
      .fill(style.cellBorderEdge)
      .circle(0, 0, r - 2)
    crayon.restore();
  }

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .translate(r, 0)
      .fill(this.color)
      .circle(0, 0, r - 3)
    crayon.restore();
  }

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .translate(r, 0)
      .fill(style.cellInside)
      .circle(0, 0, r - 7)
      .fill(style.cellCore)
      .circle(0, 0, Math.min(5, r - 10))
    crayon.restore();
  }

  crayon.restore();
}

//-----------------------------------------------------------------------------

function FysCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.5;
  this.seed = Math.random();
}

FysCell.prototype.draw = function(crayon) {
  var student = this.student;
  var seed = this.seed;
  random.seed(seed);
  var r = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.2, 0.35);
  var r2 = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.05, 0.15);
  var d = (r + r2)*0.5*0.5;
  var x = -d;
  var y = -d;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(360 * seed - 0.5);

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)

  crayon.fill(this.color)
    .circle(x, y, r + 5)

  crayon.fill(style.cellInside)
    .circle(x, y, r)

  var numLegs = random.int(3, 7);
  if (numLegs % 2 == 0) numLegs++;

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .fill(style.cellBorderEdge)
      .roundRect(r/2, -r*0.6, r*1.5, r*1.2, 5)
    crayon.restore();
  }

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .fill(this.color)
      .roundRect(r/2+2, -r*0.6+2, r*1.5-4, r*1.2-4, 5)
    crayon.restore();
  }

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .fill(style.cellInside)
      .roundRect(r/2+6, -r*0.6+6, r*1.2-12, r*1.2-12, 5)
    crayon.restore();
  }

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .translate(r, 0)
      .fill(style.cellInside)
      .circle(0, 0, r*0.5-4)
      .fill(style.cellCore)
      .circle(0, 0, Math.min(5, r - 10))
    crayon.restore();
  }

  crayon.restore();
}

//-----------------------------------------------------------------------------

function SocCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.5;
  this.seed = Math.random();
}

SocCell.prototype.draw = function(crayon) {
  var student = this.student;
  var seed = this.seed;
  random.seed(seed);
  var r = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.2, 0.35);
  var r2 = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.05, 0.15);
  var d = (r + r2)*0.5*0.5;
  var x = -d;
  var y = -d;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(360 * seed - 0.5);

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)

  crayon.fill(this.color)
    .circle(x, y, r + 5)

  crayon.fill(style.cellInside)
    .circle(x, y, r)

  var numLegs = random.int(3, 7);
  if (numLegs % 2 == 0) numLegs++;

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .fill(style.cellBorderEdge)
      .roundRect(r/2, -r*0.6, r*1, r*1.2, 5)
      .roundRect(r/2, -r*0.4, r*1.5, r*0.8, 5)
    crayon.restore();
  }

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .fill(this.color)
      .roundRect(r/2+2, -r*0.6+2, r*1-4, r*1.2-4, 5)
      .roundRect(r/2+2, -r*0.4+2, r*1.5-4, r*0.8-4, 5)
    crayon.restore();
  }

  for(var i=0; i<numLegs; i++) {
    var a = i/numLegs * 360;
    crayon.save()
    crayon
      .translate(x, y)
      .rotate(a)
      .fill(style.cellInside)
      .roundRect(r/2+6, -r*0.4+6, r*1.5-12, r*0.8-12, 5)
      .fill(style.cellCore)
      .roundRect(r/2+6, -r*0.1, r*1.5-12, r*0.2, 5)
    crayon.restore();
  }

  crayon.restore();
}

//-----------------------------------------------------------------------------

function PaedCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.5;
  this.seed = Math.random();
}

PaedCell.prototype.draw = function(crayon) {
  var student = this.student;
  var seed = this.seed;
  random.seed(seed);
  var r = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.2, 0.35);
  var r2 = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.05, 0.15);
  var d = (r + r2)*0.5*0.5;
  var x = -d;
  var y = -d;
  var x2 = d;
  var y2 = d;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(360 * seed - 0.5);

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)
    .circle(x2, y2, r2 + 6);

  crayon.fill(this.color)
    .circle(x, y, r + 5)
    .circle(x2, y2, r2 + 5);

  crayon.fill(style.cellInside)
    .circle(x, y, r)
    .circle(x2, y2, r2);

  var x3 = x + Math.random()

  var corePos = random.vec2(r - r/4)

  crayon.fill(style.cellCore)
    .circle(x + corePos.x, y + corePos.y, r/4)

  crayon.restore();
}

//-----------------------------------------------------------------------------

function DivCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.5;
  this.seed = Math.random();
}

DivCell.prototype.draw = function(crayon) {
  var student = this.student;
  var seed = this.seed;
  random.seed(seed);
  var r = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.2, 0.35);
  var r2 = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.05, 0.15);
  var d = (r + r2)*0.5*0.5;
  var x = -d;
  var y = -d;
  var x2 = d;
  var y2 = d;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(360 * seed - 0.5);

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)
    .circle(x2, y2, r2 + 6);

  crayon.fill(this.color)
    .circle(x, y, r + 5)
    .circle(x2, y2, r2 + 5);

  crayon.fill(style.cellInside)
    .circle(x, y, r)
    .circle(x2, y2, r2);

  var x3 = x + Math.random()

  var corePos = random.vec2(r - r/4)

  crayon.fill(style.cellCore)
    .circle(x + corePos.x, y + corePos.y, r/4)

  crayon.restore();
}

//-----------------------------------------------------------------------------

function DipSCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.75;
  this.seed = Math.random();
}

DipSCell.prototype.draw = function(crayon) {
  var student = this.student;
  var seed = this.seed;
  random.seed(seed);
  var r = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.2, 0.35);
  var r2 = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.05, 0.15);
  var d = (r + r2)*0.5*0.5;
  var x = -d;
  var y = -d;
  var x2 = d;
  var y2 = d;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(360 * seed - 0.5);

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)
    .circle(x2, y2, r2 + 6);

  crayon.fill(this.color)
    .circle(x, y, r + 5)
    .circle(x2, y2, r2 + 5);

  crayon.fill(style.cellInside)
    .circle(x, y, r)
    .circle(x2, y2, r2);

  var x3 = x + Math.random()

  var corePos = random.vec2(r - r/4)

  crayon.fill(style.cellCore)
    .circle(x + corePos.x, y + corePos.y, r/4)

  crayon.restore();
}

//-----------------------------------------------------------------------------

function DipLCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.75;
  this.seed = Math.random();
}

DipLCell.prototype.draw = function(crayon) {
  var student = this.student;
  var seed = this.seed;
  random.seed(seed);
  var r = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.2, 0.35);
  var r2 = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.05, 0.15);
  var d = (r + r2)*0.5*0.5;
  var x = -d;
  var y = -d;
  var x2 = d;
  var y2 = d;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(360 * seed - 0.5);

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)
    .circle(x2, y2, r2 + 6);

  crayon.fill(this.color)
    .circle(x, y, r + 5)
    .circle(x2, y2, r2 + 5);

  crayon.fill(style.cellInside)
    .circle(x, y, r)
    .circle(x2, y2, r2);

  var x3 = x + Math.random()

  var corePos = random.vec2(r - r/4)

  crayon.fill(style.cellCore)
    .circle(x + corePos.x, y + corePos.y, r/4)

  crayon.restore();
}

//-----------------------------------------------------------------------------

function TeacherCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.5;
  this.seed = Math.random();
}

TeacherCell.prototype.draw = function(crayon) {
  var student = this.student;
  var seed = this.seed;
  random.seed(seed);
  var r = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.2, 0.35);
  var r2 = this.size * remap(student.age, config.minStudentAge, config.maxStudentAge, 0.05, 0.15);
  var d = 0;
  var x = -d;
  var y = -d;
  var x2 = d;
  var y2 = d;

  crayon.save();
  crayon.translate(this.x, this.y);
  crayon.rotate(360 * seed - 0.5);

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)

  var legs = random.int(3, 7);
  for(var i=0; i<legs; i++) {
    crayon.save()
    crayon.rotate(i/legs * 360)
    crayon.translate(r/2, 0)
    crayon.rect(r/3, -r/4 - 1, r, r/2 + 2)
    crayon.translate(r/2, 0)
    crayon.circle(r*0.8, 0, r/2 + 1)
    crayon.restore();
  }

  crayon.fill(this.color)
    .circle(x, y, r + 5)

  for(var i=0; i<legs; i++) {
    crayon.save()
    crayon.rotate(i/legs * 360)
    crayon.translate(r/2, 0)
    crayon.rect(r/3, -r/4, r, r/2)
    crayon.translate(r/2, 0)
    crayon.circle(r*0.8, 0, r/2)
    crayon.restore();
  }

  crayon.fill(style.cellInside)
    .circle(x, y, r)

  for(var i=0; i<legs; i++) {
    crayon.save()
    crayon.rotate(i/legs * 360)
    crayon.translate(r/2, 0)
    crayon.rect(r/3, -r/4*0.5, r, r/2*0.5)
    crayon.translate(r/2, 0)
    crayon.circle(r*0.8, 0, r/2*0.75)
    crayon
      .fill(style.cellCore)
      .circle(r*0.8, 0, r/2*0.5)
      .fill(style.cellInside)

    crayon.restore();
  }

  crayon.restore();
}

//-----------------------------------------------------------------------------

function ResearcherCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.75;
  this.seed = Math.random();
}

ResearcherCell.prototype.draw = function(crayon) {
  var r = this.size * 0.4;
  var x = this.x;
  var y = this.y;

  var numSegments = 72;
  var numSides = random.int(3, 7);

  crayon.fill(style.cellBorderEdge)
  crayon.beginPath();
  R.range(0, numSegments).map(function(i) {
    var a = i/numSegments * 2 * Math.PI;
    var d = 0.2;
    var rr = (r + 6)* (1 + d * Math.cos(a * numSides));
    var dx = rr * Math.cos(a);
    var dy = rr * Math.sin(a);
    if (i == 0) crayon.moveTo(x + dx, y + dy)
    else crayon.lineTo(x + dx, y + dy);
  })
  crayon.endPath();

  crayon.fill(this.color)
  crayon.beginPath();
  R.range(0, numSegments).map(function(i) {
    var a = i/numSegments * 2 * Math.PI;
    var d = 0.2;
    var rr = (r + 5)* (1 + d * Math.cos(a * numSides));
    var dx = rr * Math.cos(a);
    var dy = rr * Math.sin(a);
    if (i == 0) crayon.moveTo(x + dx, y + dy)
    else crayon.lineTo(x + dx, y + dy);
  })
  crayon.endPath();

  crayon.fill(style.cellInside)
  crayon.beginPath();
  R.range(0, numSegments).map(function(i) {
    var a = i/numSegments * 2 * Math.PI;
    var d = 0.2;
    var rr = r * (1 + d * Math.cos(a * numSides));
    var dx = rr * Math.cos(a);
    var dy = rr * Math.sin(a);
    if (i == 0) crayon.moveTo(x + dx, y + dy)
    else crayon.lineTo(x + dx, y + dy);
  })
  crayon.endPath();

  for(var i=0; i<numSides; i++) {
    crayon.save();
    crayon.translate(x, y);
    crayon.rotate(i/numSides * 360);
    crayon
      .fill(style.cellCore)
      .circle(r*0.8, 0, r/2*random.float(0.2, 0.4))

    crayon.restore();
  }

  crayon
      .fill(style.cellCore)
      .circle(x, y, r/2*random.float(0.2, 0.4))

  for(var i=0; i<numSides; i++) {
    var a = i/numSides * 2 * Math.PI;
    var dx = r * 0.8 * Math.cos(a);
    var dy = r * 0.8 * Math.sin(a);
    crayon
      .stroke(style.cellCore)
      .line(x, y, x + dx, y + dy);
  }

  crayon.restore();
}

//-----------------------------------------------------------------------------

function JanitorCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.75;
  this.seed = Math.random();
}

JanitorCell.prototype.draw = function(crayon) {
  var r = this.size * 0.3;
  var x = this.x;
  var y = this.y;
  var r6 = (r + 6);
  var r4 = r + 4;

  crayon.fill(style.cellBorderEdge)
    .roundRect(x - r6/8, y - r6/2, r6/4, r6, 6)

  crayon.fill(this.color)
    .roundRect(x - r4/8, y - r4/2, r4/4, r4, 6)

  crayon.fill(style.cellInside)
    .roundRect(x - r/8, y - r/2, r/4, r, 6);

  var numLegs = random.int(2, 5);

  for(var i=0; i<numLegs; i++) {
    crayon.save();
    crayon.fill(style.cellBorderEdge)
      .translate(x, y -r6/2)
      .rotate(90 - 45 - i/(numLegs-1)*90)
      .translate(0, -r6/2)
      .roundRect(-r6/8, -r6/2, r6/4, r6, 8)
    crayon.restore();

    crayon.save();
    crayon.fill(this.color)
      .translate(x, y -r6/2)
      .rotate(90 - 45 - i/(numLegs-1)*90)
      .translate(0, -r4)
      .roundRect(-r4/8, 0, r4/4, r4*0.8, 6)
    crayon.restore();

    crayon.save();
    crayon.fill(style.cellInside)
      .translate(x, y -r6/2)
      .rotate(90 - 45 - i/(numLegs-1)*90)
      .translate(0, -r)
      .roundRect(-r/8, 0, r/4, r/2, 6)
    crayon.restore();
  }

  for(var i=0; i<numLegs; i++) {
    crayon.save();
    crayon.fill(style.cellBorderEdge)
      .translate(x, y +r6/4)
      .rotate(90 + 45 + i/(numLegs-1)*90)
      .translate(0, -r6/2)
      .roundRect(-r6/8, -r6/2, r6/4, r6, 8)
    crayon.restore();

    crayon.save();
    crayon.fill(this.color)
      .translate(x, y +r6/4)
      .rotate(90 + 45 + i/(numLegs-1)*90)
      .translate(0, -r4)
      .roundRect(-r4/8, 0, r4/4, r4*0.8, 6)
    crayon.restore();

    crayon.save();
    crayon.fill(style.cellInside)
      .translate(x, y +r6/4)
      .rotate(90 + 45 + i/(numLegs-1)*90)
      .translate(0, -r)
      .roundRect(-r/8, 0, r/4, r/2, 6)
    crayon.restore();
  }
}

//-----------------------------------------------------------------------------


function CookCell(student, x, y, size, color) {
  this.student = student;
  this.color = color;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.baseX = x;
  this.baseY = y;
  this.size = size * 0.75;
  this.seed = Math.random();
}

CookCell.prototype.draw = function(crayon) {
  var r = this.size * 0.4;
  var x = this.x;
  var y = this.y;

  crayon.fill(style.cellBorderEdge)
    .circle(x, y, r + 6)

  crayon.fill(this.color)
    .circle(x, y, r + 5)

  crayon.fill(style.cellInside)
    .circle(x, y, r)

  crayon.restore();
}

//-----------------------------------------------------------------------------

module.exports.SplCell          = SplCell;
module.exports.PmuCell          = PmuCell;
module.exports.FysCell          = FysCell;
module.exports.SocCell          = SocCell;
module.exports.PaedCell         = PaedCell;
module.exports.DivCell          = DivCell;
module.exports.DipSCell         = DipSCell;
module.exports.DipLCell         = DipLCell;
module.exports.TeacherCell      = TeacherCell;
module.exports.ResearcherCell   = ResearcherCell;
module.exports.JanitorCell      = JanitorCell;
module.exports.CookCell         = CookCell;