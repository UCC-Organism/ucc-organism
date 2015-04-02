var AgentModes  = require('../agents/agentModes');
var R           = require('ramda');

function agentKillSys(state) {
  var agents = R.filter(R.where({ agent: R.identity }), state.entities);
  agents.forEach(function(agent) {
    if (agent.state.mode == AgentModes.Dead) {
      agent.state.entity = null;
      var idx = state.entities.indexOf(agent);
      state.entities.splice(idx, 1);
    }
  })
}

module.exports = agentKillSys;