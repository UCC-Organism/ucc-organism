var Agent = function() {
    var radius = Common.random(5, 6);
    var angle = Math.random() * Math.PI * 2;

    this.delay = Math.random() * 5;

    this.distanceToPath = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
    }


    this.r = 20;
    this.currentProgress = 0;
}

// constructor
Agent.prototype = Object.create(PIXI.Sprite.prototype);
Agent.prototype.constructor = Agent;

Agent.prototype.separate = function(agents) {
    var sum = new Vector2();
    var count = 0;

    for (var i = 0; i < agents.length; i++) {
        var neighbor = agents[i];
        if (this != neighbor) {
            var nposition = neighbor.body.position;
            var position;
            var diff = Vector.sub(this.body.position, nposition)
            var d = Vector.magnitude(diff);

            var separation = settings.separation;
            if (d > 0 && d < separation) {
                // Calculate vector pointing away from neighbor
                diff.normalize();
                diff.divideScalar(d); // Weight by distance
                sum.addSelf(diff);
                count++;

            }
        }

    }

    // if (!this.id) console.log(separation)

    if (count > 0) {
        sum.divideScalar(count);
        // Our desired vector is the average scaled to maximum speed
        sum.normalize();
        sum.mult(settings.maxSpeed);
        // Implement Reynolds: Steering = Desired - Velocity
        var steer = new Vector2().sub(sum, this.body.velocity);
        // steer.limit(settings.maxSeparationForce);
        this.applyForce(steer);
    }

}


Agent.prototype.follow = function() {

    if (this.arrived) return;
    this.predictLoc = new Vector2(this.body.velocity.x, this.body.velocity.y);
    this.predictLoc.setLength(10).addSelf(this.body.position);

    if (!this.target) {
        this.target = this.path.getPoint(0);
    }

    var distance = new Vector2().sub(this.predictLoc, this.target).length();
    if (distance < this.r && this.currentProgress < 1) {
        this.currentProgress += 0.01;
        this.target = this.path.getPoint(this.currentProgress).addSelf(this.distanceToPath);
    }

    if (this.currentProgress >= 1) {
        this.arrived = true;
        this.path.boidsArrived++;
    } else {
        var desired = new Vector2().sub(this.target, this.body.position);
        var mag = desired.length();
        if (mag < 10) {
            desired.setLength(mag / 10 + 1);
        } else {
            desired.setLength(settings.maxSpeed);
        }

        var steer = new Vector2().sub(desired, this.body.velocity);
        steer.limit(settings.maxForce);
        this.applyForce(steer);
    }

}

Agent.prototype.goToClass = function() {

    //get closest point to your path

    //follow it until progress is 1
}

Agent.prototype.followPath = function(path) {

    // Predict position 25 (arbitrary choice) pixels ahead
    var predictedPosition = new Vector2(this.body.velocity.x, this.body.velocity.y);
    predictedPosition.setLength(25);
    predictedPosition.addSelf(this.body.position);

    // Now we must find the normal to the path from the predicted position
    // We look at the normal for each line segment and pick out the closest one
    var worldRecord = 1000000;
    // Loop through all points of the path
    for (var i = 0; i < path.points.length; i++) {

        // Look at a line segment
        var a = path.points[i];
        var b = path.points[(i + 1) % path.points.length]; // Note Path has to wraparound

        // Get the normal point to that line
        var normalPoint = getNormalPoint(predictedPosition, a, b);

        var dir = new Vector2().sub(b, a);

        var atEnd = false;
        // Check if normal is on line segment
        if (normalPoint.x < Math.min(a.x, b.x) || normalPoint.x > Math.max(a.x, b.x) || normalPoint.y < Math.min(a.y, b.y) || normalPoint.y > Math.max(a.y, b.y)) {
            normalPoint = b.clone();

            // If we're at the end we really want the next line segment for looking ahead
            a = path.points[(i + 1) % path.points.length];
            b = path.points[(i + 2) % path.points.length];
            dir = new Vector2().sub(b, a);
            atEnd = true;
        }
        // How far away are we from the path?
        var d = new Vector2().sub(predictedPosition, normalPoint).length();
        // Did we beat the worldRecord and find the closest line segment?
        if (d < worldRecord) {
            worldRecord = d;
            normal = normalPoint;
            // Look at the direction of the line segment so we can seek a little bit ahead of the normal
            // var ahead = (noise.perlin2(this.body.position.x, this.body.position.y) + 1) / 2 * 50;
            dir.setLength(20);
            target = normal.clone();
            target.addSelf(dir);

        }


    }
    // console.log(worldRecord)
    // debugGraphics.clear();
    // debugGraphics.lineStyle(1, 0xff0000);
    // debugGraphics.moveTo(this.body.position.x, this.body.position.y);
    // debugGraphics.lineTo(normal.x, normal.y);
    // debugGraphics.drawCircle(target.x, target.y, 10);

    // if (d > 50) {
    var desired = new Vector2().sub(target, this.body.position);
    desired.limit(5); //settings.maxSpeed)
    var steer = new Vector2().sub(desired, this.body.velocity);
    steer.limit(settings.maxForce);
    this.applyForce(steer);
    // }

    // var noiseForce = noise.perlin2(this.body.position.x, this.body.position.y);
    // this.applyForce({
    //     x: noiseForce,
    //     y: noiseForce
    // })

}

function getNormalPoint(p, a, b) {
    // Vector from a to p
    var ap = new Vector2().sub(p, a);
    // Vector from a to b
    var ab = new Vector2().sub(b, a);
    ab.normalize(); // Normalize the line
    // Project vector "diff" onto line by using the dot product
    ab.mult(ap.dot(ab));
    var normalPoint = ab.addSelf(a);
    return normalPoint;
}


function limitVector(vector, limit) {
    vector = Matter.Vector.normalise(vector);
    vector = Matter.Vector.mult(vector, limit);
    return vector;
}

Agent.prototype.applyForce = function(force) {
    this.body.force = force;

}