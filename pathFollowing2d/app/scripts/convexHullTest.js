var w, h;
var agentCount = 200;
var agents = [];
var points = [];
var classPaths = [];
var agentRadius = 30;
var stage;
var renderer;

var t = 0;
var settings = {
    maxSpeed: 2,
    maxForce: 0.8,
    maxSeparationForce: 0.3,
    separation: agentRadius,
    showPaths: true,
    // showTargets: true
};

var hull = new ConvexHull();

jQuery(document).ready(function($) {
    init();
});
var g = new PIXI.Graphics();

function init() {

    w = $(window).innerWidth();
    h = $(window).innerHeight();

    renderer = PIXI.autoDetectRenderer(w, h);
    stage = new PIXI.Stage(0);
    document.body.appendChild(renderer.view);

    createAgents();
    stage.addChild(g);
    update();

}

function createAgents() {
    var texture = new PIXI.Texture.fromImage("assets/bubble_32x32.png");
    for (var i = 0; i < agentCount; i++) {
        var t = new Agent(texture);
        t.id = i;
        var r = MathUtils.randomFloat(10, 200);
        var angle = MathUtils.randomFloat(0, Math.PI * 2);
        t.startX = Math.cos(angle) * r + w / 2;
        t.startY = Math.sin(angle) * r + h / 2;
        t.setPosition(t.startX, t.startY);
        agents.push(t);
        points.push({
            x: t.startX,
            y: t.startY
        });
        stage.addChild(t);
    }

}



function update(timestamp) {
    var agent;
    t += 0.01;
    for (var i = 0; i < agentCount; i++) {
        agent = agents[i];
        // agent.update();
        var n = noise.perlin2(agent.startX / 100 + t, agent.startY / 100 + t) * 500;
        var x = Math.cos(t) * n + agent.startX;
        var y = Math.sin(t) * n + agent.startY;
        points[i].x = x;
        points[i].y = y;
        agent.setPosition(x, y);
    }

    hull.compute(points);
    var indices = hull.getIndices();
    var outerPoints = [];
    g.clear();
    g.lineStyle(2, 0xff0000);

    if (indices && indices.length > 0) {
        g.moveTo(points[indices[0]].x, points[indices[0]].y);

        addOuterPoint(0);

        for (var i = 1; i < indices.length; i++) {
            // g.lineTo(points[indices[i]].x, points[indices[i]].y);
            addOuterPoint(i)
        }
        // g.lineTo(points[indices[0]].x, points[indices[0]].y);

        g.lineStyle(2, 0xffff00);
        g.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (var i = 1; i < outerPoints.length; i++) {
            g.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        g.lineTo(outerPoints[0].x, outerPoints[0].y);

    }


    function addOuterPoint(index) {

        var a;
        var b = points[indices[index]];
        var c;

        a = index - 1 % points
        if (index == 0) {
            a = points[indices[indices.length - 1]];
        } else {}

        if (index == points.length - 1) {
            c = points[indices[0]];
        } else {
            c = points[indices[index + 1]];
        }

        var segA = new Vector2(a.x, a.y);
        segA.subSelf(b);

        var segB = new Vector2(b.x, b.y);
        segB.subSelf(c);

        segA.addSelf(segB);


        var x = segA.x;
        var y = segA.y;

        var outerPoint = new Vector2();

        outerPoint.x = y;
        outerPoint.y = -x;
        outerPoint.limit(segA.length() / 2);
        outerPoint.x += a.x;
        outerPoint.y += a.y;

        outerPoints.push(outerPoint);
    }

    renderer.render(stage);
    requestAnimFrame(update);
}