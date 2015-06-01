#!/usr/bin/env node

var fs = require('fs');
var browserify = require('browserify');
var watchify = require('watchify');
var browserSync = require('browser-sync');
var b = browserify(watchify.args);

function watch() {
    b.add(__dirname + '/../src/main.js');
    //b.add(__dirname + '/../src/ucc/exp/agents.js');

    b.transform({global:true}, 'brfs');
    b.ignore('plask');

    var bundler = watchify(b);
    bundler.on('update', rebundle);

    function rebundle () {
        return bundler.bundle()
        // log errors if they happen
        .on('error', function(e) {
            console.log('Browserify Error', e);
        })
        .pipe(fs.createWriteStream(__dirname + '/../build/main.web.js'))
        browserSync.reload();
    }

    return rebundle()

}

watch();


var files = [
    __dirname + '/../build/main.js'
];

browserSync.init(files, {
    server: {
        baseDir: __dirname + '/../build'
    }
});
