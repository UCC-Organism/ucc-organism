var R           = require('ramda');
var graph       = require('../../graph');
var random      = require('pex-random');
var config      = require('../../config');
var AgentModes  = require('../agents/agentModes');

function agentTargetNodeUpdaterSys(state) {
  var agents = R.filter(R.where({ agent: R.identity }), state.entities);
  var agentsWithNoTarget = agents.filter(R.not(R.prop('targetNode')));
}

module.exports = agentTargetNodeUpdaterSys;