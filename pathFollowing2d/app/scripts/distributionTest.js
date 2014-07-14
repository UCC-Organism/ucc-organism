var w, h;
var agentCount = 500;
var agents = [];

// #66a3ae, #c36f9d, #214980, #4f9681
var colors = [0x66a3ae, 0xc36f9d, 0x214980, 0x4f9681];
var points = [];
var classPaths = [];
var agentRadius = 30;
var stage;
var renderer;
var sampler;

var g = new PIXI.Graphics();

jQuery(document).ready(function($) {
    init();
});

function init() {

    w = $(window).innerWidth();
    h = $(window).innerHeight();

    renderer = PIXI.autoDetectRenderer(w, h);
    stage = new PIXI.Stage(0x000b26);
    document.body.appendChild(renderer.view);

    var assets = [];
    for (var i = 1; i <= 5; i++) {
        assets.push("assets/option1/" + i + ".png");
    }

    var loader = new PIXI.AssetLoader(assets);
    loader.onComplete = onAssetsLoadComplete;
    loader.load();
}

function onAssetsLoadComplete() {
    createAgents();
    stage.addChild(g);
    update();
}


function update(timestamp) {
    renderer.render(stage);
    requestAnimFrame(update);
}

function createAgents() {

    for (var i = 0; i < agentCount; i++) {
        var texture = new PIXI.Texture.fromImage("assets/option1/" + MathUtils.randomInt(1, 5) + ".png");
        var t = new PIXI.Sprite(texture);
        t.id = i;
        t.tint = colors[MathUtils.randomInt(0, 4)];
        t.rotation = MathUtils.randomFloat(0, Math.PI * 2);
        t.scale.y = t.scale.x = MathUtils.randomFloat(.2, .8)
        t.position.y = Math.floor(i / 28) * 100 + MathUtils.randomFloat(-10, 10);
        t.position.x = i % 28 * 100 + MathUtils.randomFloat(-10, 10);
        agents.push(t);
        points.push({
            x: t.startX,
            y: t.startY
        });
        stage.addChild(t);
    }

}