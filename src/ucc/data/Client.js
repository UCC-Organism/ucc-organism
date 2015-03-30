var request = require('superagent');
var Promise = require('bluebird');
var Faye = require('faye');
var R = require('ramda');
var AgentStore = require('../stores/AgentStore');
var AgentModes = require('../agents/agentModes');

function Client(serverUrl) {
  this.serverUrl = serverUrl;
  this.updateCurrentState();
}

Client.prototype.getJSON = function(url) {
  console.log('Client.getJSON', url);
  return new Promise(function(resolve, reject) {
    request(url, function(err, res) {
      if (err) reject(err);
      else resolve(JSON.parse(res.text));
    })
  });
}

Client.prototype.subscribeToEvents = function() {
  console.log('Client.subscribeToEvents');
  this.fayeClient = new Faye.Client(this.serverUrl + '/faye');
  this.fayeClient.subscribe('/events', this.onEvent.bind(this));
}

Client.prototype.getAgentInfo = function(agentId) {
  return this.getJSON(this.serverUrl + '/agent/' + agentId);
}

Client.prototype.updateCurrentState = function() {
  this.getJSON(this.serverUrl + '/current-state').then(function(agentsState) {
    var agentIds = Object.keys(agentsState);

    if (agentIds.length == 0) {
      setTimeout(this.updateCurrentState.bind(this), 500);
      return;
    }
    console.log('Client.updateCurrentState agents:', agentIds.length);
    console.log('Client.updateCurrentState', agentsState[agentIds[0]]);

    AgentStore.all = [];
    agentIds.forEach(function(agentId) {
      var agentState = agentsState[agentId];
      var agent = {
        id: agentId
      }
      if (agentId.match(/^student/)) agent.type = 'student';
      if (agentId.match(/^teacher/)) agent.type = 'teacher';

      if (agentState.description == 'away') {
        agent.targetMode = AgentModes.Away;
      }
      else if (agentState.location) {
        agent.targetMode = AgentModes.Classroom;
        agent.targetLocation = agentState.location;
      }

      //if (agent.)
      AgentStore.all.push(agent);
    })

    console.log('Client.updateCurrentState', AgentStore.all.length);

    this.subscribeToEvents();
  }.bind(this));
}

Client.prototype.onEvent = function(e) {
  console.log('Client.onEvent', e);
  e.agents.forEach(function(agentId) {
    var agent = AgentStore.getAgentById(agentId);
    if (!agent) {
      console.log('WARN', 'Client.onEvent agent not found!', agentId);
      return;
    }
    if (e.description == 'away') {
      //console.log('Client.onEvent', agentId, 'is going away')
      agent.targetMode = AgentModes.Away;
    }
    if (e.description == 'roaming') {
      //console.log('Client.onEvent', agentId, 'is going roaming')
      agent.targetMode = AgentModes.Roaming;
    }
    else if (e.location) {
      //console.log('Client.onEvent', agentId, 'is going from', agent.targetLocation, 'to', e.location);
      agent.targetMode = AgentModes.Classroom;
      agent.targetLocation = e.location;
    }
    //else {
    //  console.log('Client.onEvent', agentId, e);
    //}
  })
}

module.exports = Client;