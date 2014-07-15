"use strict";

var $ = $ || {};
var ConvexHull = ConvexHull || {};
var Matter = Matter || {};
var Vector2 = Vector2 || {};
var PIXI = PIXI || {};




var colors = ["#66a3ae", "#c36f9d", "#214980", "#4f9681"];
var w, h;
var agentCount = 20;


var worldWidth = 1920 / 2;
var worldHeight = 1280 / 2;


var pathGraphics = new PIXI.Graphics();
var roomGraphics = new PIXI.Graphics();
var debugGraphics = new PIXI.Graphics();


//Matter
var _engine;


//aliases
var RenderPixi = Matter.RenderPixi;
var World = Matter.World;
var Engine = Matter.Engine;
var Events = Matter.Events;
var Vector = Matter.Vector;
var Common = Matter.Common;
var Bodies = Matter.Bodies;



var agents = [];
var classPaths = [];

//room
var roomPoints = [];
var roomCenter;
var roomRadius;

var agentRadius = 30;
var stage;
var renderer;

var t = 0;


var mouse = {
    x: 0,
    y: 0
};

window.settings = {
    maxSpeed: 5,
    maxForce: 0.1,
    maxSeparationForce: 0.3,
    separation: agentRadius,
    showPaths: true,
    // showTargets: true
};

var hull = new ConvexHull();

$(document).ready(function() {
    loadPaths();

    $("body").mousemove(function(event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });
});


function loadPaths() {
    $.getJSON("assets/room.json", function(json) {
        createPaths(json);
        initWorld();
        createAgents();
    });
}


function createPaths(data) {
    data.forEach(function(d) {
        switch (d.name) {
            case "room":
                pathGraphics.lineStyle(1, 0xff0000);
                d.paths[0].points.forEach(function(p) {
                    roomPoints.push(p);
                    p.x /= 2;
                    p.y /= 2;
                    pathGraphics.drawCircle(p.x, p.y, 2);
                });

                if (roomPoints.length < 3) {
                    window.alert("room doesn't have enought points!");
                } else {
                    var pa = roomPoints[0];
                    var pb = roomPoints[1];
                    var pc = roomPoints[2];
                    //calculate room center and radius
                    var ma = (pb.y - pa.y) / (pb.x - pa.x);
                    var mb = (pc.y - pb.y) / (pc.x - pb.x);

                    var cx = (ma * mb * (pa.y - pc.y) + mb * (pa.x + pb.x) - ma * (pb.x + pc.x)) / (2 * (mb - ma));
                    var cy = -(1 / ma) * (cx - (pa.x + pb.x) / 2) + (pa.y + pb.y) / 2;
                    roomCenter = {
                        x: cx,
                        y: cy
                    };


                    roomRadius = new Vector2(pa.x - cx, pa.y - cy).length() + 50;
                    pathGraphics.drawCircle(roomCenter.x, roomCenter.y, roomRadius);
                }

                break;

            case "paths":
                d.paths.forEach(function(a) {
                    if (a.points) {
                        a.points.forEach(function(p) {
                            p.x /= 2;
                            p.y /= 2;
                        });

                        var path = new Path(a.points);
                        if (a.fill != "none") path.fill = parseInt(a.fill.slice(1), 16);
                        if (a.stroke != "none") path.stroke = parseInt(a.stroke.slice(1), 16);
                        classPaths.push(path);
                    }
                });

                drawPaths();
                break;

        }


    });


}




function initWorld() {
    var $container = $("<div id='canvas-container'/>");
    $("body").append($container);
    var options = {
        // positionIterations: 6,
        // velocityIterations: 4,
        // enableSleeping: true,
        render: RenderPixi.create({
            element: $container[0],
            width: worldWidth,
            height: worldHeight
        })
    };

    _engine = Engine.create($container[0], options);


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

    _engine.render.stage.addChild(pathGraphics);
    _engine.render.stage.addChild(roomGraphics);
    _engine.render.stage.addChild(debugGraphics);

    var renderOptions = _engine.render.options;
    renderOptions.showAngleIndicator = false;
    renderOptions.wireframes = false;
    renderOptions.background = "#000b26";

    Events.on(_engine, "tick", function(event) {
        drawRoom();

        var target = classPaths[0].getClosestPoint(mouse);
        // debugGraphics.clear();
        // debugGraphics.lineStyle(1, 0xffffff)
        // debugGraphics.drawCircle(target.x, target.y, 10);
        agents.forEach(function(a) {

            a.follow();
            // a.followPath(wanderingPath);
            // a.separate(agents)
        });
    });

    Engine.run(_engine);


}


function createAgents() {
    var agent = new Agent();
    var path = classPaths[Math.round(Common.random(0, classPaths.length - 1))];

    var startPoint = path.getPointAt(0);
    startPoint.x += agent.offset
    startPoint.y += agent.offset;

    agent.body = Bodies.polygon(startPoint.x, startPoint.y, MathUtils.randomInt(3, 6), MathUtils.randomInt(10, 15), {
        density: 0.1
    });

    agent.id = agents.length;

    var agentColor = colors[0]; //MathUtils.randomInt(0, colors.length)];
    agent.body.render.fillStyle = agentColor;
    agent.body.render.strokeStyle = chroma(agentColor).brighter(Math.random() * 100).hex();

    agent.path = path;
    agents.push(agent);
    World.add(_engine.world, agent.body);




    if (agents.length < agentCount) setTimeout(createAgents, 100);
}



function drawPaths() {

    // if (wanderingPath.fill) pathGraphics.beginFill(wanderingPath.fill);
    // if (wanderingPath.stroke) pathGraphics.lineStyle(1, wanderingPath.stroke);

    // pathGraphics.moveTo(wanderingPath.points[0].x, wanderingPath.points[0].y);
    // for (var i = 1; i < wanderingPath.points.length; i++) {
    //     var p = wanderingPath.points[i]
    //     pathGraphics.lineTo(p.x, p.y);
    // };

    // pathGraphics.endFill();




    classPaths.forEach(function(path) {
        if (path.fill) pathGraphics.beginFill(path.fill);
        if (path.stroke) pathGraphics.lineStyle(1, path.stroke);
        pathGraphics.moveTo(path.points[0].x, path.points[0].y);
        for (var i = 1; i < path.points.length; i++) {
            var p = path.points[i];
            pathGraphics.lineTo(p.x, p.y);
        }
        pathGraphics.endFill();

    });




    pathGraphics.cacheAsBitmap = true;

}


function drawRoom() {

    var points = [];

    var d = new Vector2().sub(mouse, roomCenter).length();
    if (d <= roomRadius) {
        points.push(mouse);
    }

    roomPoints.forEach(function(p) {
        points.push(p);
    });


    agents.forEach(function(a) {
        if (a.arrived) points.push(a.body.position)
    });


    hull.compute(points);

    var indices = hull.getIndices();
    var outerPoints = [];

    roomGraphics.clear();
    roomGraphics.lineStyle(2, 0xff0000, 0.4);

    if (indices && indices.length > 0) {
        roomGraphics.moveTo(points[indices[0]].x, points[indices[0]].y);

        addOuterPoint(0);

        for (var i = 1; i < indices.length; i++) {
            roomGraphics.lineTo(points[indices[i]].x, points[indices[i]].y);
            addOuterPoint(i);
        }
        roomGraphics.lineTo(points[indices[0]].x, points[indices[0]].y);

        roomGraphics.lineStyle(2, 0xffff00);


        roomGraphics.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (var i = 1; i < outerPoints.length; i++) {
            roomGraphics.lineTo(outerPoints[i].x, outerPoints[i].y);
        }

        roomGraphics.lineTo(outerPoints[0].x, outerPoints[0].y);

    }


    function addOuterPoint(index) {


        var a = points[indices[(index === 0) ? indices.length - 1 : (index - 1)]];
        var b = points[indices[index]];
        var c = points[indices[(index + 1) % indices.length]];

        var vA = new Vector2(a.x, a.y);
        vA.subSelf(b).normalize();

        var vB = new Vector2(c.x, c.y);
        vB.subSelf(b).normalize();

        var p = new Vector2();
        p.add(vA, vB);
        p.normalize();

        p.mult(-50);
        p.addSelf(b);

        p.origin = b;
        outerPoints.push(p);
    }
}