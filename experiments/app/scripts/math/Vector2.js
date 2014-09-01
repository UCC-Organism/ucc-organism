var Vector2 = function(x, y) {

    this.x = x || 0;
    this.y = y || 0;

}

Vector2.prototype = {

    constructor: Vector2,

    set: function(x, y) {

        this.x = x;
        this.y = y;

        return this;

    },

    copy: function(v) {

        this.x = v.x;
        this.y = v.y;

        return this;

    },

    add: function(a, b) {

        this.x = a.x + b.x;
        this.y = a.y + b.y;

        return this;

    },

    addSelf: function(v) {

        this.x += v.x;
        this.y += v.y;

        return this;

    },

    sub: function(a, b) {

        this.x = a.x - b.x;
        this.y = a.y - b.y;

        return this;

    },

    subSelf: function(v) {

        this.x -= v.x;
        this.y -= v.y;

        return this;

    },

    mult: function(s) {

        this.x *= s;
        this.y *= s;

        return this;

    },

    divideScalar: function(s) {

        if (s) {

            this.x /= s;
            this.y /= s;

        } else {

            this.set(0, 0);

        }

        return this;

    },

    negate: function() {

        return this.mult(-1);

    },

    dot: function(v) {

        return this.x * v.x + this.y * v.y;

    },

    lengthSq: function() {

        return this.x * this.x + this.y * this.y;

    },

    limit: function(l) {
        if (this.lengthSq() > l * l) this.setLength(l);
        // if (this.length() > l) this.setLength(l);
    },

    length: function() {

        return Math.sqrt(this.lengthSq());

    },

    normalize: function() {

        return this.divideScalar(this.length());

    },

    distanceTo: function(v) {

        return Math.sqrt(this.distanceToSquared(v));

    },

    distanceToSquared: function(v) {

        var dx = this.x - v.x,
            dy = this.y - v.y;
        return dx * dx + dy * dy;

    },

    setLength: function(l) {
        return this.normalize().mult(l);
    },

    lerpSelf: function(v, alpha) {

        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;

        return this;

    },

    equals: function(v) {

        return ((v.x === this.x) && (v.y === this.y));

    },

    isZero: function(v) {

        return this.lengthSq() < (v !== undefined ? v : 0.0001);

    },

    clone: function() {

        return new Vector2(this.x, this.y);

    }

};