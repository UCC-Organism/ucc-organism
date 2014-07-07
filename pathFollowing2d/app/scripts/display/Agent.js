var Agent = function(texture) {
    PIXI.Sprite.call(this, texture);
    this.location = new Vector2(0, 0);
    this.velocity = new Vector2(Math.random() * 6 - 2, Math.random() * 6 - 2);
    this.acceleration = new Vector2();
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.scale.x = .5;
    this.scale.y = .5;
    this.r = 50 * this.scale.x;
    this.maxspeed = 2;
    this.maxforce = 0.15;

    var radius = MathUtils.randomFloat(5, 15);
    var angle = Math.random() * Math.PI * 2;
    this.distanceToPath = new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius);
}

// constructor
Agent.prototype = Object.create(PIXI.Sprite.prototype);
Agent.prototype.constructor = Agent;


Agent.prototype.setPosition = function(x, y) {
    this.x = this.position.x = this.location.x = x;
    this.y = this.position.y = this.location.y = y;
}

Agent.prototype.update = function() {
    if (this.arrived) return;
    this.velocity.addSelf(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.location.addSelf(this.velocity);

    this.x = this.position.x = this.location.x;
    this.y = this.position.y = this.location.y;
    this.currentRotation = Math.atan2(this.velocity.y, this.velocity.x);
    //reset acceleration
    this.rotation += (this.currentRotation - this.rotation) * .05; // - Math.PI;
    this.acceleration.mult(0);
    // if (this.id == 0) console.log(this.velocity.x, this.velocity.y)
}

Agent.prototype.separate = function(agents) {
    var sum = new Vector2();
    var count = 0;
    // For every boid in the system, check if it's too close
    for (var i = 0; i < agents.length; i++) {
        var position = agents[i].location;
        if (position.x != this.location.x || position.y != this.location.y) {

            var d = this.location.distanceToSquared(position);
            if (d > 0 && d < settings.alignDistance * settings.alignDistance) {
                // Calculate vector pointing away from neighbor
                var diff = new Vector2().sub(this.location, position);
                diff.normalize();
                diff.divideScalar(d); // Weight by distance
                sum.addSelf(diff);
                count++;
            }

        }

    }

    // Average -- divide by how many
    if (count > 0) {
        sum.divideScalar(count);
        // Our desired vector is the average scaled to maximum speed
        sum.normalize();
        sum.mult(this.maxspeed);
        // Implement Reynolds: Steering = Desired - Velocity
        var steer = new Vector2().sub(sum, this.velocity);
        steer.limit(this.maxforce);
        this.applyForce(steer);
    }

}

Agent.prototype.align = function(agents) {
    var sum = new Vector2();
    var count = 0;
    for (var i = 0; i < agents.length; i++) {
        var otherAgent = agents[i];
        var d = otherAgent.location.distanceToSquared(this.position);
        if (d > 0 && d < settings.alignDistance * settings.alignDistance) {
            sum.addSelf(otherAgent.velocity);
            count++;
        }
    }
    if (count > 0) {
        sum.divideScalar(count);
        sum.normalize();
        sum.mult(this.maxspeed);
        var steer = new Vector2().sub(sum, this.velocity);
        steer.limit(this.maxforce);
        this.applyForce(steer);
    }
}

Agent.prototype.seek = function(target) {
    // if (this.arrived) return;
    var desired = new Vector2().sub(target, this.location);
    var mag = desired.length();
    if (mag > 0 && mag < 50) {
        desired.setLength(mag / 50);
    } else {
        desired.setLength(this.maxspeed);
    }

    var steer = new Vector2().sub(desired, this.velocity);
    steer.limit(this.maxforce / 2);
    this.applyForce(steer);
    steer = null;
    desired = null;

}

Agent.prototype.boundaries = function() {

    //go through each boundary
    //if going over one
    //set desired and break

    var desired;

    // for (var i = 0; i < boundaries.length; i++) {
    //     var b = boundaries[i];
    //     b.
    // }


    if (this.location.x < leftBoundary.x + minBoundaryDist) {
        desired = new Vector2(this.maxspeed, this.velocity.y);
    } else if (this.location.x > rightBoundary.x - minBoundaryDist) {
        desired = new Vector2(-this.maxspeed, this.velocity.y);
    }

    if (this.location.y < topBoundary.y + minBoundaryDist) {
        desired = new Vector2(this.velocity.x, this.maxspeed);
    } else if (this.location.y > bottomBoundary.y - minBoundaryDist) {
        desired = new Vector2(this.velocity.x, -this.maxspeed);
    }

    if (desired != null) {
        desired.setLength(this.maxspeed);
        var steer = new Vector2(desired.x - this.velocity.x, desired.y - this.velocity.y);
        steer.limit(this.maxforce);
        this.applyForce(steer);
    }
}

Agent.prototype.applyForce = function(force) {
    // We could add mass here if we want A = F / M
    this.acceleration.addSelf(force);
}