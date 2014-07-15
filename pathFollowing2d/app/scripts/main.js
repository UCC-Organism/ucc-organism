var w, h;

var agentCount = 100;
var agents = [];
var classPaths = [];
var agentRadius = 30;


var worldWidth = 800;
var worldHeight = 600;

var leftBoundary = new Vector2(60, 0);
var rightBoundary = new Vector2(worldWidth - 60, 0);
var topBoundary = new Vector2(0, 60);
var bottomBoundary = new Vector2(0, worldHeight - 60);
var minBoundaryDist = 20;



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



var settings = {
    message: 'test',
    time: 0,
    maxSpeed: 2,
    maxForce: 0.8,
    maxSeparationForce: 0.3,
    separation: agentRadius,
    showPaths: true,
    // showTargets: true
};
var gui;


document.addEventListener('DOMContentLoaded', init, false);

window.onload = function() {
    gui = new dat.GUI({
        autoPlace: false
    });
    gui.add(settings, 'separation', 0, agentRadius * 4);
    gui.add(settings, 'maxSpeed', 0, 10);
    gui.add(settings, 'maxForce', 0, 1);
    gui.add(settings, 'maxSeparationForce', 0, 1);
    gui.add(settings, 'time', 0.0, 2, 0.01);
    gui.add(settings, 'showPaths');
    // gui.add(settings, 'showTargets')

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
    stage = new PIXI.Stage(0xff0000);

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
    data.forEach(function(d) {
        switch (d.name) {
            case "classPaths":
                d.paths.forEach(function(a) {
                    if (a.points) {
                        a.points.forEach(function(p) {
                            p.x *= w;
                            p.y *= h;
                        });

                        var path = new Path(a.points);
                        if (a.fill != "none") path.fill = parseInt(a.fill.slice(1), 16);
                        if (a.stroke != "none") path.stroke = parseInt(a.stroke.slice(1), 16);
                        classPaths.push(path);
                    }
                });
                break;
            case "wandering":
                wanderingPath = new Path(d.paths[0].points);
                if (d.paths[0].fill != "none") wanderingPath.fill = parseInt(d.paths[0].fill.slice(1), 16);
                if (d.paths[0].stroke != "none") wanderingPath.stroke = parseInt(d.paths[0].stroke.slice(1), 16);
                break;

        }


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
        t.delay = MathUtils.randomFloat(-1, 0);
        t.path = classPaths[MathUtils.randomInt(0, classPaths.length)];


        var startPoint = t.path.getPointAt(0);
        t.setPosition(startPoint.x + MathUtils.randomFloat(0, 100), startPoint.y + MathUtils.randomFloat(0, 100));
        agents.push(t);
        stage.addChild(t);
        t.tint = t.path.color;

    }

}

function drawPaths() {
    classPaths.forEach(function(path) {
        debugGraphics.lineStyle(1, path.color);
        debugGraphics.moveTo(path.points[0].x, path.points[0].y);
        for (var i = 1; i < path.points.length; i++) {
            var p = path.points[i]
            debugGraphics.lineTo(p.x, p.y);
        };
    });
    debugGraphics.cacheAsBitmap = true;
}

function start() {
    stage.addChild(debugGraphics);
    createAgents();
    resize();
    update();

}


function update(timestamp) {

    quadtree.clear();

    // debugGraphics.clear();

    quadtree.insert(agents);

    var agent;
    for (var i = 0; i < agentCount; i++) {

        agent = agents[i]

        // if (!agent.arrived) {
        agent.follow(agent.path);
        // }
        var neighbors = quadtree.retrieve(agent.position);
        agent.separate(neighbors);
        agent.update();

    }


    var location = agent.location;
    var velocity = agent.velocity;
    var predictLoc = agent.predictLoc;
    var normal = agent.normal;
    var target = agent.target;

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