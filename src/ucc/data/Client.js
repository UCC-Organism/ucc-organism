var request = require('superagent');
var Promise = require('bluebird');
var Faye = require('faye');
var R = require('ramda');
var AgentStore = require('../stores/AgentStore');
var AgentModes = require('../agents/agentModes');
var log = require('debug')('ucc-data/client');
var request = require('superagent');

function Client(serverUrl) {
  log(serverUrl);
  this.enabled = true;
  this.serverUrl = serverUrl;
  this.online = undefined;
}

Client.prototype.getJSON = function(url) {
  //log('Client.getJSON', url);
  return new Promise(function(resolve, reject) {
    request(url, function(err, res) {
      if (err) reject(err);
      else resolve(JSON.parse(res.text));
    })
  });
}

Client.prototype.checkServerConnection = function() {
  log('checkServerConnection');
  request
  .get(this.serverUrl + '/current-state/')
  .end(function(err, res){
     if (err) {
      log("ERR Server is NOT available. Reconnecting in 10s...");
      this.online = false;
      setTimeout(this.checkServerConnection.bind(this), 10000)
     }
     else {
      log("Server is available. Connecting...");
      this.online = true;
      this.subscribeToEvents();
     }
  }.bind(this));
}

Client.prototype.subscribeToEvents = function() {
  log('Client.subscribeToEvents');
  this.fayeClient = new Faye.Client(this.serverUrl + '/faye');
  this.fayeClient.subscribe('/events', this.onEvent.bind(this));
  this.updateCurrentState();
}

Client.prototype.getAgentInfo = function(agentId) {
  return this.getJSON(this.serverUrl + '/agent/' + agentId);
}

Client.prototype.updateConfig = function() {
  return this.getJSON(this.serverUrl + '/client-config');
}

Client.prototype.updateCurrentState = function() {
  this.getJSON(this.serverUrl + '/current-state').then(function(agentsState) {
    var agentIds = Object.keys(agentsState);

    if (agentIds.length == 0) {
      setTimeout(this.updateCurrentState.bind(this), 500);
      return;
    }

    AgentStore.all = [];
    agentIds.forEach(function(agentId) {
      applyAgentActivity(agentId, agentsState[agentId]);
    })
  }.bind(this));
}

function applyAgentActivity(agentId, activity) {
  var agent = AgentStore.getAgentById(agentId);
  if (!agent) {
    agent = { id: agentId };
    AgentStore.all.push(agent);
  }
  if(activity.location) {
    agent.targetLocation = activity.location;
  }
  switch (activity.description) {
    case "away":          break;
    case "roaming":       agent.targetMode = AgentModes.Roaming; break;
    case "random toilet": agent.targetMode = AgentModes.Toilet; break;
    case "random lunch":  agent.targetMode = AgentModes.Lunch;  break;
    default:              if (activity.location) agent.targetMode = AgentModes.Classroom
  }
};

Client.prototype.onEvent = function(e) {
  if (!this.enabled) return;
  //log('Client.onEvent', e.description);
  e.agents.forEach(function(agentId) {
    applyAgentActivity(agentId, e);
  })
}

module.exports = Client;
