var request = require('superagent');
var Promise = require('bluebird');
var Faye = require('faye');
var R = require('ramda');
var AgentStore = require('../stores/AgentStore');
var AgentModes = require('../agents/agentModes');
var Config = require('../../config');

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

function FakeClient() {
  //this.genStudents();
  this.genLunchOnAnotherFloor();
}

FakeClient.prototype.genLunchOnAnotherFloor = function() {
  students.forEach(function(id) {
    AgentStore.all.push({
      id: id,
      programme: Config.agentTypeGroups[0],
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
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Classroom;
      agent.targetLocation = 'C.216';
    })
  }, 10000)

  setTimeout(function() {
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Lunch;
      agent.targetLocation = 'Kantine';
    })
  }, 20000)
}

FakeClient.prototype.genStudents = function() {
  students.forEach(function(id) {
    AgentStore.all.push({
      id: id,
      programme: Config.agentTypeGroups[0],
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
    AgentStore.all.slice(0, 6).forEach(function(agent) {
      agent.targetMode = AgentModes.Toilet;
      agent.targetLocation = 'toilet';
    })
  }, 10000)

  setTimeout(function() {
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Roaming;
    })
  }, 20000)

  setTimeout(function() {
    AgentStore.all.forEach(function(agent) {
      agent.targetMode = AgentModes.Classroom;
      agent.targetLocation = 'C.216';
    })
  }, 25000)
}

module.exports = FakeClient;