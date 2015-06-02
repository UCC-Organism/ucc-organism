var R     = require('ramda');
var sys   = require('pex-sys');
var geom  = require('pex-geom');
var AgentModes = require('../agents/agentModes');
var Config = require('../../config');
var Time  = sys.Time;
var Vec3  = geom.Vec3;
var random = require('pex-random');

function agentBrownianMotionSys(state) {
  var agents = R.filter(R.where({ agent: R.identity }), state.entities);

  var tmpDir = new Vec3();
  var a = new Vec3();
  var b = new Vec3();
  agents.forEach(function(agent, idx) {
    var target = null;
    if (agent.state.mode == AgentModes.Studying || agent.state.mode == AgentModes.Eating) {
      if ((agent.type != 'teacher') && agent.prevTargetNode) {
        var center = agent.prevTargetNode.position;
        if (!agent.brownianMotionTarget) {
          agent.brownianMotionTarget = new Vec3();
          agent.brownianMotionPatience = random.float(5, 10);
          a.copy(random.element(agent.prevTargetNode.neighbors).position);
          b.copy(random.element(agent.prevTargetNode.neighbors).position);
          a.sub(center).scale(random.float(0.5, 0.9));
          b.sub(center).scale(random.float(0.5, 0.9));
          a.lerp(b, random.float());
          agent.brownianMotionTarget.copy(a).add(center);
          agent.velocity.scale(0);
        }
        agent.force.scale(0);
      }

    }
    else {
      agent.brownianMotionTarget = null;
    }

    if (agent.brownianMotionTarget) {
      tmpDir.copy(agent.brownianMotionTarget).sub(agent.position);
      var tmpDirLen = tmpDir.length();

      if (tmpDirLen < 0.001) {
        agent.brownianMotionPatience -= Time.delta;
        if (agent.brownianMotionPatience < 0) {
          agent.brownianMotionPatience = 0;
          agent.brownianMotionTarget = null;
        }
      }

      var speed = Config.agentSpeed * agent.speed;
      //tmpDir.limit(speed * Time.delta / 10);
      agent.force.add(tmpDir);

      agent.prevPosition.copy(agent.position);
      agent.velocity.scale(0.9);
      agent.force.limit(Config.agentSpeed * Time.delta / 10);
      agent.velocity.add(agent.force);
      if (agent.life >= 1) {
        agent.position.add(agent.velocity);
      }
      agent.force.scale(0);
    }

    //followerEntity.prevPosition.copy(followerEntity.position);
    //followerEntity.position.add(tmpDir);
  })
}

module.exports = agentBrownianMotionSys;
