var w, h;

var worldWidth = 800;
var worldHeight = 600;

var leftBoundary = new Vector2(60, 0);
var rightBoundary = new Vector2(worldWidth - 60, 0);
var topBoundary = new Vector2(0, 60);
var bottomBoundary = new Vector2(0, worldHeight - 60);
var minBoundaryDist = 20;

var agentCount = 100;
var agents = [];
var paths = [];

var renderer;
var stage;
var lastTimestamp;

var debugGraphics = new PIXI.Graphics();

var quadtree = new QuadTree({
    x: leftBoundary.x,
    y: topBoundary.y,
    width: rightBoundary.x,
    height: bottomBoundary.y
}, true);


//globals
var agentRadius = 30;

var settings = {
    message: 'test',
    time: 0,
    separation: agentRadius,
    alignDistance: agentRadius / 4
};
var gui;


document.addEventListener('DOMContentLoaded', init, false);

window.onload = function() {
    gui = new dat.GUI({
        autoPlace: false
    });
    gui.add(settings, 'separation', 0, agentRadius);
    gui.add(settings, 'alignDistance', 0, agentRadius);
    gui.add(settings, 'time', 0.0, 2, 0.01);
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '0';
    gui.domElement.style.left = '0';
    $("body").append(gui.domElement);
    // console.log(gui.domElement)
};

function init() {
    w = $(window).innerWidth();
    h = $(window).innerHeight();
    worldWidth = w;
    worldHeight = h;

    renderer = PIXI.autoDetectRenderer(w, h);
    stage = new PIXI.Stage(0xffffff);

    leftBoundary = new Vector2(60, 0);
    rightBoundary = new Vector2(worldWidth - 60, 0);
    topBoundary = new Vector2(0, 60);
    bottomBoundary = new Vector2(0, worldHeight - 60);
    minBoundaryDist = 20;

    document.body.appendChild(renderer.view);

    loadPaths();
}

function loadPaths() {
    jQuery.getJSON('assets/paths.json', function(json, textStatus) {
        createPaths(json);
    });
}

function createPaths(data) {
    data[0]["paths"]["layer_0"].forEach(function(a) {
        var path = new Path(a.points);
        path.color = parseInt(a.color.slice(1), 16);
        paths.push(path);
    });
    drawPaths();

    start();
}

function createAgents() {
    var texture = new PIXI.Texture.fromImage("assets/bubble_32x32.png");
    for (var i = 0; i < agentCount; i++) {
        // var t = new Agent(texture, (Math.random() > .5 ? Math.random() * w + w : -Math.random() * w), (Math.random() > .5 ? Math.random() * h + h : -Math.random() * h));
        var t = new Agent(texture);
        t.id = i;
        t.delay = MathUtils.randomFloat(-0.25, 0);
        t.path = paths[MathUtils.randomInt(0, paths.length)];

        var startPoint = t.path.getPointAt(0);
        t.setPosition(startPoint.x + MathUtils.randomFloat(0, 100), startPoint.y + MathUtils.randomFloat(0, 100));
        agents.push(t);
        stage.addChild(t);
        t.tint = t.path.color;

    }

}

function drawPaths() {
    paths.forEach(function(path) {
        debugGraphics.lineStyle(1, path.color);
        debugGraphics.moveTo(path.points[0].x, path.points[0].y);
        for (var i = 1; i < path.points.length; i++) {
            var p = path.points[i]
            debugGraphics.lineTo(p.x, p.y);
        };
    });
}

function start() {
    createAgents();
    resize();
    update();

    stage.addChild(debugGraphics);
}


function update(timestamp) {
    var delta = timestamp - (lastTimestamp || timestamp);

    quadtree.clear();



    debugGraphics.clear();

    quadtree.insert(agents);
    var seconds = timestamp / 1000;
    var agent;

    for (var i = 0; i < agentCount; i++) {
        agent = agents[i]
        agent.update();
        // var t = (seconds + agent.delay) * 2 / agent.path.length
        t = settings.time + agent.delay;
        if (t < 0) t = 0;
        if (t > 1) t = 1;

        var target = agent.path.getPointAt(t);
        target.x += agent.distanceToPath.x;
        target.y += agent.distanceToPath.y;
        debugGraphics.beginFill(agent.path.color);
        debugGraphics.drawCircle(target.x, target.y, 2);
        debugGraphics.endFill();
        var neighbors = quadtree.retrieve(agent.position);
        agent.align(neighbors);
        agent.separate(neighbors);
        agent.seek(target);
        // agent.boundaries();
        // console.log();

    }

    drawPaths();


    // drawNode(quadtree.root);


    renderer.render(stage);
    requestAnimFrame(update);
}


function drawNode(node) {
    var bounds = node._bounds;
    debugGraphics.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);


    var len = node.nodes.length;
    for (var i = 0; i < len; i++) {
        drawNode(node.nodes[i]);
    }
}


function initGui() {

    gui.add(fizzyText, 'message');
    gui.add(fizzyText, 'maxSize').min(0.5).max(7);

}


function resize() {
    w = $(window).innerWidth();
    h = $(window).innerHeight();
    renderer.resize(w, h);
}