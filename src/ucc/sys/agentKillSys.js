var AgentModes  = require('../agents/agentModes');
var R           = require('ramda');
var Time        = require('pex-sys').Time;

function agentKillSys(state) {
  var agents = R.filter(R.where({ agent: R.identity }), state.entities);
  agents.forEach(function(agent) {
    if (agent.state.mode == AgentModes.Dead) {
      if (agent.life > 0.01) {
        agent.life -= Time.delta * agent.speed;
        if (agent.life < 0.0) agent.life = 0.0;
      }
      else {
        agent.state.entity = null;
        var idx = state.entities.indexOf(agent);
        state.entities.splice(idx, 1);
      }
    }
    else if (agent.life < 1) {
      agent.life += Time.delta * agent.speed;
    }
  })
}

module.exports = agentKillSys;