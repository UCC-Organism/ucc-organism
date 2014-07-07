function MathUtils() {}

MathUtils.seed = function(s) {
    Math.seedrandom(s);
}

MathUtils.randomFloat = function(min, max) {
    if (typeof(max) == 'undefined') {
        min = 1;
    }
    if (typeof(max) == 'undefined') {
        max = min;
        min = 0;
    }
    return min + (max - min) * Math.random();
}

MathUtils.randomInt = function(min, max) {
    return Math.floor(MathUtils.randomFloat(min, max));
}

MathUtils.map = function(value, oldMin, oldMax, newMin, newMax) {
    return newMin + (value - oldMin) / (oldMax - oldMin) * (newMax - newMin);
}

MathUtils.mix = function(a, b, t) {
    return a + (b - a) * t;
}


MathUtils.clamp = function(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

MathUtils.randomVec3 = function(r) {
    r = r || 0.5;
    var x = Math.random() - 0.5;
    var y = Math.random() - 0.5;
    var z = Math.random() - 0.5;
    return Vec3.create(x * r, y * r, z * r);
}

MathUtils.randomVec3InBoundingBox = function(bbox) {
    var x = bbox.min.x + Math.random() * (bbox.max.x - bbox.min.x);
    var y = bbox.min.y + Math.random() * (bbox.max.y - bbox.min.y);
    var z = bbox.min.z + Math.random() * (bbox.max.z - bbox.min.z);
    return Vec3.create(x, y, z);
}

MathUtils.randomVec2InRect = function(rect) {
    return Vec2.create(rect.x + Math.random() * rect.width, rect.y + Math.random() * rect.height);
}