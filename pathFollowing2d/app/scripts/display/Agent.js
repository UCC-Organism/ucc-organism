var Agent = function(texture) {
    PIXI.Sprite.call(this, texture);
    this.location = new Vector2(0, 0);
    this.velocity = new Vector2(Math.random() * 6 - 2, Math.random() * 6 - 2);
    this.acceleration = new Vector2();
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.scale.x = 0.5;
    this.scale.y = 0.5;
    this.currentProgress = 0;
    this.r = 64 * this.scale.x;
    var radius = MathUtils.randomFloat(5, 10);
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


Agent.prototype.separate = function(agents) {
    var sum = new Vector2();
    var count = 0;

    for (var i = 0; i < agents.length; i++) {

        var neighbor = agents[i];
        if (!neighbor.arrived) {

            var position = neighbor.location;
            var d = this.location.distanceTo(position);
            var separation = this.arrived ? 80 : settings.separation;
            if (d > 0 && d < separation) {
                // Calculate vector pointing away from neighbor
                var diff = new Vector2().sub(this.location, position);
                diff.normalize();
                diff.divideScalar(d); // Weight by distance
                sum.addSelf(diff);
                count++;
            }
        }

    }

    if (count > 0) {
        sum.divideScalar(count);
        // Our desired vector is the average scaled to maximum speed
        sum.normalize();
        sum.mult(settings.maxSpeed);
        // Implement Reynolds: Steering = Desired - Velocity
        var steer = new Vector2().sub(sum, this.velocity);
        steer.limit(settings.maxSeparationForce);
        this.applyForce(steer);
    }

}


Agent.prototype.follow = function(p) {

    if (this.arrived) return;

    this.predictLoc = this.velocity.clone();
    this.predictLoc.setLength(5).addSelf(this.location);

    if (!this.target) {
        this.target = this.path.getPoint(0);
    }

    var distance = new Vector2().sub(this.location, this.target).length();
    if (distance < this.r * 2 && this.currentProgress < 1) {
        this.currentProgress += 0.01;
        this.target = this.path.getPoint(this.currentProgress).addSelf(this.distanceToPath);
    }

    // if (!this.id) console.log(this.currentProgress)

    if (this.currentProgress >= 1) {
        this.arrived = true;
        this.path.boidsArrived++;
        // this.visible = false;
    } else {
        var desired = new Vector2().sub(this.target, this.location);
        var mag = desired.length();
        if (mag < 10) {
            desired.setLength(mag / 10 + 1);
        } else {
            desired.setLength(settings.maxSpeed);
        }
        var steer = new Vector2().sub(desired, this.velocity);
        steer.limit(settings.maxForce);
        this.applyForce(steer);

    }

}

Agent.prototype.wonderOnPath = function(p) {

}

Agent.prototype.update = function() {
    if (this.arrived) return;
    this.velocity.addSelf(this.acceleration);
    this.velocity.limit(settings.maxSpeed);
    this.location.addSelf(this.velocity);

    this.x = this.position.x = this.location.x;
    this.y = this.position.y = this.location.y;
    this.currentRotation = Math.atan2(this.velocity.y, this.velocity.x);
    //reset acceleration
    this.rotation = this.currentRotation;
    // (this.currentRotation - this.rotation) * .05; // - Math.PI;
    this.acceleration.mult(0);
    // if (this.id == 0) console.log(this.velocity.x, this.velocity.y)
}


Agent.prototype.applyForce = function(force) {
    // We could add mass here if we want A = F / M
    this.acceleration.addSelf(force);
}


// A function to get the normal point from a point (p) to a line segment (a-b)
// This function could be optimized to make fewer new Vector objects
function getNormalPoint(p, a, b) {
    // Vector from a to p
    var ap = new Vector2().sub(p, a);
    // Vector from a to b
    var ab = new Vector2().sub(b, a);
    ab.normalize();

    // Project vector onto line by using the dot product
    ab.mult(ap.dot(ab));
    var normalPoint = new Vector2().add(a, ab);
    return normalPoint;
}