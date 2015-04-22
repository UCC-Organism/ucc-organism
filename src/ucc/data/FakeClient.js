var request = require('superagent');
var Promise = require('bluebird');
var Faye = require('faye');
var R = require('ramda');
var AgentStore = require('../stores/AgentStore');
var AgentModes = require('../agents/agentModes');
var Config = require('../../config');
var rand = require('pex-random');

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
  this.enabled = true;
  this.timeSpeed = timeSpeed;
  this.timers = [];
  //this.genStudents();
  //this.genC2();
}

FakeClient.prototype.genMorning = function(state) {
  var self = this;
  if (!self.enabled) return;

  self.clearTimers();

  var allRooms = state.map.roomsById;
  var roomIds = [];
  var classroomIds = [];
  for (var id in allRooms){
    if (allRooms.hasOwnProperty(id) && allRooms[id].floor == state.map.currentFloor) {
         roomIds.push(id);
         if (allRooms[id].type == "classroom") classroomIds.push(id);
    }
  }

  for (var i = 0; i < classroomIds.length; i++)
  {
    //add teacher
    AgentStore.all.push({
      id: 'teacher' + i,
      programme: Config.agentTypeGroups[8],
      end: "2018-01-31 00:00:00.0000000",
      gender: 0,
      age: 25,
      targetMode: AgentModes.Classroom,
      targetLocation: classroomIds[i]
    })
  }

  //add 100 students
  for (var i = 0; i < 5; i++)
  {
    self.timers.push(setTimeout(function() 
    {
      AgentStore.all.push({
        id: 'student' + i,
        programme: Config.agentTypeGroups[Math.floor(rand.int(0, 7))],
        //programme: Config.agentTypeGroups[0],
        end: "2018-01-31 00:00:00.0000000",
        gender: 0,
        age: 25,
        targetMode: AgentModes.Roaming,
        targetLocation: roomIds[Math.floor(rand.int(0, roomIds.length))]
      });
    }, (rand.int(10000)) / this.timeSpeed));
  }

  // go to classroom
  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    console.log("go to classroom");

    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Classroom;

      if (agent.programme != "Teacher")
      {
        agent.targetLocation = classroomIds[Math.floor(rand.int(0, classroomIds.length))];
      }
      
    })
  }, 30000 / this.timeSpeed));

  // go to lunch
  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    console.log("go to lunch");
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Lunch;
      agent.targetLocation = 'Kantine';
    })
  }, 60000 / this.timeSpeed));

  // go home
  self.timers.push(setTimeout(function() {
    if (!self.enabled) return;
    console.log("go home");
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Away;
      agent.targetLocation = '';
    })
  }, 100000 / this.timeSpeed));
}

FakeClient.prototype.clearTimers = function() 
{
  console.log("clear timers: " + this.timers.length);

  for (var i = 0; i < this.timers.length; i++)
  {
    clearTimeout(this.timers[i]);
    console.log(this.timers[i]);
  }
}

FakeClient.prototype.genOneEachClassRoom = function() {
  var self = this;
  if (!self.enabled) return;

  for (var i = 0; i < 100; i++)
  {
    AgentStore.all.push({
      id: 'student' + i,
      programme: Config.agentTypeGroups[Math.floor(rand.int(0, 10))],
      //programme: Config.agentTypeGroups[0],
      end: "2018-01-31 00:00:00.0000000",
      gender: 0,
      age: 25,
      targetMode: AgentModes.Classroom,
      targetLocation: 'C.201'
    })
  }

  setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Lunch;
      agent.targetLocation = 'Kantine';
    })
  }, 10000 / this.timeSpeed)
}

FakeClient.prototype.genC2 = function() {
  var self = this;
  if (!self.enabled) return;
  students.forEach(function(id) {
    AgentStore.all.push({
      id: id,
      programme: Config.agentTypeGroups[Math.floor(rand.int(0, 2))],
      //programme: Config.agentTypeGroups[0],
      end: "2018-01-31 00:00:00.0000000",
      gender: 0,
      age: 25,
      targetMode: AgentModes.Classroom,
      targetLocation: 'C.230'
    })
  })
  //add teacher
  AgentStore.all.push({
    id: 'teacher01',
    programme: Config.agentTypeGroups[9],
    end: "2018-01-31 00:00:00.0000000",
    gender: 0,
    age: 25,
    targetMode: AgentModes.Classroom,
    targetLocation: 'C.230'
  })

  setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Classroom;
      agent.targetLocation = 'C.216';
    })
  }, 20000 / this.timeSpeed)

  setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Lunch;
      agent.targetLocation = 'Kantine';
    })
  }, 30000 / this.timeSpeed)
}

FakeClient.prototype.genStudents = function() {
  var self = this;
  if (!self.enabled) return;
  students.forEach(function(id) {
    AgentStore.all.push({
      id: id,
      programme: Config.agentTypeGroups[1],
      end: "2018-01-31 00:00:00.0000000",
      gender: 0,
      age: 25,
      targetMode: AgentModes.Classroom,
      targetLocation: 'C.216'
    })
  })
  //add teacher
  AgentStore.all.push({
    id: 'teacher01',
    programme: Config.agentTypeGroups[9],
    end: "2018-01-31 00:00:00.0000000",
    gender: 0,
    age: 25,
    targetMode: AgentModes.Classroom,
    targetLocation: 'C.216'
  })

  setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.slice(0, 6).forEach(function(agent) {
      agent.targetMode = AgentModes.Toilet;
      agent.targetLocation = 'toilet';
    })
  }, 10000 / this.timeSpeed)

  setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Roaming;
    })
  }, 20000 / this.timeSpeed)

  setTimeout(function() {
    if (!self.enabled) return;
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Classroom;
      agent.targetLocation = 'C.216';
    })
  }, 25000 / this.timeSpeed)
}

module.exports = FakeClient;