"use strict";

var agentCount = 100;


var settings = {
    maxForce: 0.9,
    maxSpeed: 2,
    separation: 10
}

var mouse = {
    x: 0,
    y: 0
}

var worldWidth = 1920;
var worldHeight = 1080;

var debugGraphics = new PIXI.Graphics();
var pathGraphics = new PIXI.Graphics();

// #66a3ae, #c36f9d, #214980, #4f9681
var colors = ["#66a3ae", "#c36f9d", "#214980", "#4f9681"];


var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Common = Matter.Common,
    Constraint = Matter.Constraint,
    RenderPixi = Matter.RenderPixi,
    Events = Matter.Events,
    Bounds = Matter.Bounds,
    Vector = Matter.Vector,
    Vertices = Matter.Vertices;


var wanderingPath;


var _engine,
    _gui,
    _inspector,
    _mouseConstraint;

var Gui = MatterTools.Gui,
    Inspector = MatterTools.Inspector;


var agents = [];
var classPaths = [];


$(document).ready(function($) {
    loadPaths();
});


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
                        var path = new Path(a.points);
                        if (a.fill != "none") path.fill = parseInt(a.fill.slice(1), 16);
                        if (a.stroke != "none") path.stroke = parseInt(a.stroke.slice(1), 16);
                        classPaths.push(path);
                    }
                });
                break;
            case "wandering":
                console.log(d)
                pathGraphics.beginFill()
                wanderingPath = new Path(d.paths[0].points);
                if (d.paths[0].fill != "none") wanderingPath.fill = parseInt(d.paths[0].fill.slice(1), 16);
                if (d.paths[0].stroke != "none") wanderingPath.stroke = parseInt(d.paths[0].stroke.slice(1), 16);

                console.log(wanderingPath)
                break;

        }


    });


    initWorld();
}


function initWorld() {
    var $container = $("<div id='canvas-container'/>");
    $container.mousemove(function(event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });
    $("body").append($container[0]);

    // some example engine options
    var options = {
        positionIterations: 6,
        velocityIterations: 4,
        enableSleeping: true,

        render: RenderPixi.create({
            element: $container[0],
            width: worldWidth,
            height: worldHeight
        })
    }




    _engine = Engine.create($container[0], options);





    Engine.run(_engine);

    // _gui = Gui.create(_engine);

    _engine.world = World.create({
        gravity: {
            x: 0,
            y: 0
        },
        bounds: {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: worldWidth,
                y: worldHeight
            }
        }
    });

    Events.on(_engine, 'tick', function(event) {
        agents.forEach(function(a) {
            a.followPath(wanderingPath);
            // a.separate(agents)
        });

    });

    if (wanderingPath.fill) pathGraphics.beginFill(wanderingPath.fill);
    if (wanderingPath.stroke) pathGraphics.lineStyle(1, wanderingPath.stroke);

    pathGraphics.moveTo(wanderingPath.points[0].x, wanderingPath.points[0].y);
    for (var i = 1; i < wanderingPath.points.length; i++) {
        var p = wanderingPath.points[i]
        pathGraphics.lineTo(p.x, p.y);
    };

    pathGraphics.endFill();




    classPaths.forEach(function(path) {
        if (path.fill) pathGraphics.beginFill(path.fill);
        if (path.stroke) pathGraphics.lineStyle(1, path.stroke);
        pathGraphics.moveTo(path.points[0].x, path.points[0].y);
        for (var i = 1; i < path.points.length; i++) {
            var p = path.points[i]
            pathGraphics.lineTo(p.x, p.y);
        };
        pathGraphics.endFill();

    });




    pathGraphics.cacheAsBitmap = true;

    _engine.render.stage.addChild(pathGraphics);
    _engine.render.stage.addChild(debugGraphics);

    var renderOptions = _engine.render.options;
    renderOptions.showAngleIndicator = false;
    renderOptions.wireframes = false;
    renderOptions.background = "#000b26";

    createAgents();
    // createObstacles();

}

function createObstacles() {
    for (var i = 0; i < 40; i++) {
        var p = wanderingPath.points[i];
        World.add(_engine.world, Bodies.rectangle(p.x, p.y, 10, 20, {
            density: 0.00001,
            friction: 0,
            // frictionAir: 0.1,
            // chamfer: 2,
            angle: Math.random() * Math.PI
        }));
    };
}

function createAgents() {
    var agent = new Agent();
    var path = classPaths[Math.round(Common.random(0, classPaths.length - 1))];
    // var startPoint = path.getPointAt(0);
    var startPoint = {
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight
    };


    agent.body = Bodies.polygon(startPoint.x, startPoint.y, MathUtils.randomInt(3, 6), MathUtils.randomInt(10, 20), {
        density: 0.9,
        friction: 0.1,
        frictionAir: 0.1
        // chamfer: {
        //     radius: 5
        // }
    });

    agent.id = agents.length;

    var agentColor = colors[MathUtils.randomInt(0, colors.length)];
    agent.body.render.fillStyle = agentColor;
    agent.body.render.strokeStyle = chroma(agentColor).brighter(Math.random() * 100).hex();

    agent.path = path;
    agents.push(agent);
    World.add(_engine.world, agent.body);


    if (agents.length < agentCount) setTimeout(createAgents, 100);
}


function getPolygonTexture(ctx, x, y, radius, sides, startAngle, anticlockwise) {
    if (sides < 3) return;
    var a = (Math.PI * 2) / sides;
    a = anticlockwise ? -a : a;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(startAngle);
    ctx.moveTo(radius, 0);
    for (var i = 1; i < sides; i++) {
        ctx.lineTo(radius * Math.cos(a * i), radius * Math.sin(a * i));
    }
    ctx.closePath();
    ctx.restore();
}