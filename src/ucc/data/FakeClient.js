var request = require('superagent');
var Promise = require('bluebird');
var Faye = require('faye');
var R = require('ramda');
var AgentStore = require('../stores/AgentStore');
var AgentModes = require('../agents/agentModes');
var Config = require('../../config');
var random = require('pex-random');
var log = require('debug')('ucc-data/fake-client');

var students = [
  "student663",
  "student142",
  "student145",
  "student106",
  "student640",
  "student1058",
  "student112",
  "student88",
  "student1072",
  "student103",
  "student1081",
  "student105",
  "student1057",
  "student85",
  "student1059",
  "student1062",
  "student86",
  "student647",
  "student1071",
  "student1073",
  "student662",
  "student1083",
  "student131",
  "student1088",
  "student1090",
  "student1091"
];

var teachers = [
  "teacher1",
  "teacher2",
  "teacher4",
  "teacher5",
  "teacher6",
  "teacher7",
  "teacher8",
  "teacher9",
  "teacher10"
];

var rooms = [
  "C.201",
  "C.213",
  "C.216",
  "C.224",
  "C.226",
  "C.230",
  "C.208",
  "C.206",
  "C.202"
];

function FakeClient(timeSpeed, state) {
  this.prevEnabled = null;
  this.enabled = true;
  this.timeSpeed = timeSpeed;
  this.timers = [];
  //this.genStudents();
  //this.genC2();
}

FakeClient.prototype.update = function(state) {
  var exit = false;
  if (!state.map.dirty) {
    exit = true;
  }
  if (state.generatedDataMode != null) {
    exit = false;
  }

  if (this.prevEnabled != this.enabled) {
    if (this.enabled) {
      log('waking up');
      exit = false;
    }
    else {
      log('going to sleep');
      this.clearTimers();
      exit = true;
    }
  }

  this.prevEnabled = this.enabled

  if (exit) return;

  this.clearTimers();



  if (state.generatedDataMode == 'showcase') {
    this.genShowcase(state);
    state.generatedDataMode = null;
  }
  else {
    this.genRandom(state);
    //if (state.map.currentFloor == Config.floorId.All) { this.genMorning(state); }
    //if (state.map.currentFloor == Config.floorId.A_0) { this.genMorning(state); }
    //if (state.map.currentFloor == Config.floorId.A_1) { this.genMorning(state); }
    //if (state.map.currentFloor == Config.floorId.B_0) { this.genMorning(state); }
    //if (state.map.currentFloor == Config.floorId.B_1) { this.genB2(state); }
    //if (state.map.currentFloor == Config.floorId.C_0) { this.genMorning(state); }
    //if (state.map.currentFloor == Config.floorId.C_1) { this.genOneEachClassRoom(state); }
    //if (state.map.currentFloor == Config.floorId.C_2) { this.genC2(state); }
  }
}

FakeClient.prototype.findRoomIds = function(state) {
  var allRooms = state.map.roomsById;
  var roomIds = [];
  for (var id in allRooms){
    if (allRooms.hasOwnProperty(id) && (allRooms[id].floor == state.map.currentFloor ||  state.map.currentFloor == -1)) {
      roomIds.push(id);
    }
  }
  return roomIds;
}

FakeClient.prototype.findRoomIdsByType = function(state, type) {
  var allRooms = state.map.roomsById;
  var roomIds = [];
  for (var id in allRooms){
    if (allRooms.hasOwnProperty(id) && (allRooms[id].floor == state.map.currentFloor ||  state.map.currentFloor == -1)) {
      if (allRooms[id].type == type) roomIds.push(id);
    }
  }
  return roomIds;
}

FakeClient.prototype.genMorning = function(state) {
  var self = this;
  if (!self.enabled) return;

  var roomIds = this.findRoomIds(state);

  var classroomIds = this.findRoomIdsByType(state, 'classroom');

  var studentProgrammes = R.pluck('programme', R.filter(R.where({ student: true }), R.values(Config.agentTypes)));

  var numTeachers = Math.floor(0.1 * classroomIds.length);

  for (var i = 0; i < numTeachers; i++)
  {
    //add teacher
    AgentStore.all.push({
      id: 'teacher' + i,
      programme: 'Teacher',
      end: "2018-01-31 00:00:00.0000000",
      gender: random.int(0, 2),
      age: 25,
      targetMode: AgentModes.Classroom,
      targetLocation: classroomIds[i]
    })
  }

  //add 100 students
  for (var i = 0; i < 100; i++)
  {
    self.timers.push(setTimeout(function()
    {
      random.seed(Date.now());
      AgentStore.all.push({
        id: 'student' + i,
        programme: random.element(studentProgrammes),
        end: "2018-01-31 00:00:00.0000000",
        gender: random.int(0,2),
        age: random.int(20, 30),
        targetMode: AgentModes.Roaming,
        targetLocation: random.element(roomIds)
      });
    }, (random.int(10000)) / this.timeSpeed));
  }

  // go to classroom
  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    log("go to classroom");

    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Classroom;

      if (agent.programme != "Teacher")
      {
        agent.targetLocation = classroomIds[Math.floor(random.int(0, classroomIds.length))];
      }
    })
  }, 30000 / this.timeSpeed));

  // go to lunch
  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    log("go to lunch");
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Lunch;
      agent.targetLocation = 'Kantine';
    })
  }, 60000 / this.timeSpeed));

  // go home
  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    log("go home");
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Away;
      agent.targetLocation = '';
    })
  }, 100000 / this.timeSpeed));
}

FakeClient.prototype.genRandom = function(state) {
  log('genRandom');
  var self = this;
  if (!self.enabled) return;

  var roomIds = this.findRoomIds(state);

  var classroomIds = [];
  var rooms = state.map.selectedNodes.filter(function(node) {
      return node.roomType && node.roomType != 'exit';
  })

  //increase room probability
  for(var i=0; i<5; i++) {
    rooms.forEach(function(node) {
      if (node.roomType == 'classroom') {
        classroomIds.push(node.roomId);
      }
      else if (node.roomId && i == 0) {
        classroomIds.push(node.roomId);
      }
    });
  }

  var studentProgrammes = R.pluck('programme', R.filter(R.where({ student: true }), R.values(Config.agentTypes)));

  var numGroups = random.int(3, 10)

  var total = 0;
  R.range(0, numGroups).forEach(function(g) {
    var classroom = random.element(classroomIds);
    var programme = random.element(studentProgrammes);
    AgentStore.all.push({
      id: 'teacher' + g,
      programme: 'Teacher',
      end: "2018-01-31 00:00:00.0000000",
      gender: random.int(0, 2),
      age: 25,
      targetMode: AgentModes.Classroom,
      targetLocation: classroom
    })
    total++;

    for (var i = 0; i < random.int(10, 20); i++){
      var delay = (random.int(10000)) / this.timeSpeed;
      self.timers.push(setTimeout(function()
      {
        random.seed(Date.now());
        AgentStore.all.push({
          id: 'student' + i,
          programme: programme,
          end: "2018-01-31 00:00:00.0000000",
          gender: random.int(0,2),
          age: random.int(20, 30),
          targetMode: AgentModes.Roaming,
          targetLocation: classroom,
          seed: g
        });
      }, delay));
    }
  }.bind(this))


  // go to classroom
  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    log("go to classroom");

    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Classroom;
      random.seed(agent.seed);
      agent.targetLocation = random.element(classroomIds);
    })
  }, 10000 / this.timeSpeed));

  // go to lunch
  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    log("go to lunch");
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Lunch;
      agent.targetLocation = 'Kantine';
    })
  }, 60000 / this.timeSpeed));

  // go home
  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    log("go home");
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Away;
      agent.targetLocation = '';
    })
  }, 100000 / this.timeSpeed));

  self.timers.push(setTimeout(function() {
    log('FakeClient.genRandom restart');
    this.clearTimers();
    this.genRandom(state);
  }.bind(this), 110000 / this.timeSpeed));
}

FakeClient.prototype.clearTimers = function()
{
  log("clear timers: " + this.timers.length);

  for (var i = 0; i < this.timers.length; i++)
  {
    clearTimeout(this.timers[i]);
    log(this.timers[i]);
  }
}

FakeClient.prototype.genOneEachClassRoom = function(state) {
  var self = this;
  if (!self.enabled) return;

  var studentProgrammes = R.pluck('programme', R.filter(R.where({ student: true }), R.values(Config.agentTypes)));

  var classroomIds = this.findRoomIdsByType(state, 'classroom');
  classroomIds = classroomIds.slice(0, studentProgrammes.length);

  for (var i = 0; i < 100; i++)
  {
    AgentStore.all.push({
      id: 'student' + i,
      programme: studentProgrammes[i % studentProgrammes.length],
      end: "2018-01-31 00:00:00.0000000",
      gender: random.int(0, 2),
      age: random.int(20, 30),
      targetMode: AgentModes.Classroom,
      targetLocation: classroomIds[i % studentProgrammes.length]
    })
  }

  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Lunch;
      agent.targetLocation = 'canteen';
    })
  }, 100000 / this.timeSpeed))
}

FakeClient.prototype.genB2 = function(state) {
  var self = this;
  if (!self.enabled) return;

  var roomIds = this.findRoomIds(state);
  var researchRoomIds = this.findRoomIdsByType(state, 'research');
  var adminRoomIds = this.findRoomIdsByType(state, 'admin');

  for (var i = 0; i < 15; i++) {
    self.timers.push(setTimeout(function() {
      random.seed(Date.now());
      var programme;
      var targetLocation;
      if (random.chance(0.5)) {
        programme = 'Researcher';
        targetLocation = random.element(researchRoomIds);
      }
      else {
        programme = 'Admin';
        targetLocation = random.element(adminRoomIds);
      }
      AgentStore.all.push({
        id: programme + '' + random.int(0, 99),
        programme: programme,
        end: "2018-01-31 00:00:00.0000000",
        gender: random.int(0, 2),
        age: 25,
        targetMode: AgentModes.Classroom,
        targetLocation: targetLocation
      });
    }, (random.int(10000)) / this.timeSpeed));
  }

   for (var i = 0; i < 15; i++) {
    self.timers.push(setTimeout(function() {
      var agent = random.element(AgentStore.all);
      if (agent.programme == "Researcher") {
        agent.targetLocation = random.element(researchRoomIds);
      }
      if (agent.programme == "Admin") {
        agent.targetLocation = random.element(adminRoomIds);
      }
    }, (random.int(1000)) / this.timeSpeed))
  }
}

FakeClient.prototype.genC2 = function() {
  var self = this;
  if (!self.enabled) return;
  AgentStore.all.push({
    id: 'janitor1',
    programme: "Janitor",
    end: "2018-01-31 00:00:00.0000000",
    gender: random.int(0, 2),
    age: 25,
    targetMode: AgentModes.Roaming,
    targetLocation: 'C.230'
  })
  students.forEach(function(id) {
    AgentStore.all.push({
      id: id,
      programme: Config.agentTypes.spl.programme,
      end: "2018-01-31 00:00:00.0000000",
      gender: random.int(0, 2),
      age: random.int(20, 30),
      targetMode: AgentModes.Classroom,
      targetLocation: 'C.230'
    })
  })
  //add teacher
  AgentStore.all.push({
    id: 'teacher01',
    programme: 'Teacher',
    end: "2018-01-31 00:00:00.0000000",
    gender: random.int(0, 2),
    age: 25,
    targetMode: AgentModes.Classroom,
    targetLocation: 'C.230'
  })

  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Classroom;
      agent.targetLocation = 'C.216';
    })
  }, 40000 / this.timeSpeed))

  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Lunch;
      agent.targetLocation = 'Kantine';
    })
  }, 60000 / this.timeSpeed))
}

FakeClient.prototype.genStudents = function() {
  var self = this;
  if (!self.enabled) return;
  students.forEach(function(id) {
    AgentStore.all.push({
      id: id,
      programme: Config.agentTypes.pmu.programme,
      end: "2018-01-31 00:00:00.0000000",
      gender: random.int(0, 2),
      age: random.int(20, 30),
      targetMode: AgentModes.Classroom,
      targetLocation: 'C.216'
    })
  })
  //add teacher
  AgentStore.all.push({
    id: 'teacher01',
    programme: 'Teacher',
    end: "2018-01-31 00:00:00.0000000",
    gender: random.int(0, 2),
    age: random.int(20, 30),
    targetMode: AgentModes.Classroom,
    targetLocation: 'C.216'
  })

  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.slice(0, 6).forEach(function(agent) {
      agent.targetMode = AgentModes.Toilet;
      agent.targetLocation = 'toilet';
    })
  }, 10000 / this.timeSpeed))

  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Roaming;
    })
  }, 20000 / this.timeSpeed))

  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Classroom;
      agent.targetLocation = 'C.216';
    })
  }, 25000 / this.timeSpeed))
}

//generates agents of each type in separate rooms
FakeClient.prototype.genShowcase = function(state) {
  log('FakeClient.genShowcase', this.enabled, AgentStore.all.length)
  var self = this;
  if (!self.enabled) return;

  random.seed(0);

  var types = Object.keys(Config.agentTypes);

  var rooms = state.map.selectedNodes.filter(function(node) {
      return node.roomType && node.roomType != 'exit';
  })

  var id = 0;
  types.forEach(function(type, typeIndex) {
    for(var i=0; i<5; i++) {
      AgentStore.all.push({
        id: 'agent' + id++,
        programme: Config.agentTypes[type].programme,
        end: "2018-01-31 00:00:00.0000000",
        gender: random.int(0, 2),
        age: random.int(20, 30),
        targetMode: AgentModes.Showcase,
        targetLocation: rooms[typeIndex].roomId,
        spawnNode: rooms[typeIndex].neighbors[i%rooms[typeIndex].neighbors.length]
      })
    }
  })
}

module.exports = FakeClient;
