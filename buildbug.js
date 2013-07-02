//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var buildbug = require('buildbug');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var buildProject = buildbug.buildProject;
var buildProperties = buildbug.buildProperties;
var buildTarget = buildbug.buildTarget;
var enableModule = buildbug.enableModule;
var parallel = buildbug.parallel;
var series = buildbug.series;
var targetTask = buildbug.targetTask;


//-------------------------------------------------------------------------------
// Enable Modules
//-------------------------------------------------------------------------------

var aws = enableModule("aws");
var bugpack = enableModule('bugpack');
var bugunit = enableModule('bugunit');
var clientjs = enableModule('clientjs');
var core = enableModule('core');
var nodejs = enableModule('nodejs');


//-------------------------------------------------------------------------------
// Declare Properties
//-------------------------------------------------------------------------------

buildProperties({
    syncbugserver: {
        packageJson: {
            name: "synccacheserver",
            version: "0.0.1",
            main: "./lib/SyncbugServer.js",
            dependencies: {
                bugpack: "https://s3.amazonaws.com/airbug/bugpack-0.0.5.tgz",
                express: "3.2.x",
                "socket.io": "0.9.x"
            },
            scripts: {
                start: "node ./scripts/syncbug-server-application-start.js"
            }
        },
        sourcePaths: [
            "./projects/syncbugserver/js/src",
            "../bugjs/projects/annotate/js/src",
            "../bugjs/projects/bugcall/js/src",
            "../bugjs/projects/bugflow/js/src",
            "../bugjs/projects/bugfs/js/src",
            "../bugjs/projects/bugioc/js/src",
            "../bugjs/projects/bugjs/js/src",
            "../bugjs/projects/bugroutes/js/src",
            "../bugjs/projects/bugtrace/js/src",
            "../bugjs/projects/express/js/src",
            "../bugjs/projects/handshaker/js/src",
            "../bugjs/projects/socketio/bugjars/server/js/src",
            "../bugjs/projects/socketio/bugjars/socket/js/src",
            "../bugunit/projects/bugdouble/js/src",
            "../bugunit/projects/bugunit/js/src"
        ],
        scriptPaths: [
            "./projects/airbugserver/js/scripts",
            "../bugunit/projects/bugunit/js/scripts"
        ],
        testPaths: [
            "../bugjs/projects/bugflow/js/test",
            "../bugjs/projects/bugjs/js/test",
            "../bugjs/projects/bugtrace/js/test",
            "../bugjs/projects/bugroutes/js/test"
        ]
    },
    syncbugserverclient: {
        clientJson: {
            name: "synccache",
            version: "0.0.1",
            main: "./lib/SyncCacheClient.js"
        },
        sourcePaths: [
            "./projects/syncbugserverclient/js/src",
            "../bugjs/projects/annotate/js/src",
            "../bugjs/projects/bugcall/js/src",
            "../bugjs/projects/bugflow/js/src",
            "../bugjs/projects/bugfs/js/src",
            "../bugjs/projects/bugioc/js/src",
            "../bugjs/projects/bugjs/js/src",
            "../bugjs/projects/bugroutes/js/src",
            "../bugjs/projects/bugtrace/js/src",
            "../bugjs/projects/express/js/src",
            "../bugjs/projects/socketio/bugjars/client/js/src",
            "../bugjs/projects/socketio/bugjars/factoryserver/js/src",
            "../bugjs/projects/socketio/bugjars/socket/js/src",
            "../bugunit/projects/bugdouble/js/src",
            "../bugunit/projects/bugunit/js/src"
        ],
        scriptPaths: [
            "./projects/syncbugserverclient/js/scripts",
            "../bugunit/projects/bugunit/js/scripts"
        ],
        testPaths: [
            "../bugjs/projects/bugflow/js/test",
            "../bugjs/projects/bugjs/js/test",
            "../bugjs/projects/bugtrace/js/test",
            "../bugjs/projects/bugroutes/js/test"
        ]
    }
});


//-------------------------------------------------------------------------------
// Declare Tasks
//-------------------------------------------------------------------------------


//-------------------------------------------------------------------------------
// Declare Flows
//-------------------------------------------------------------------------------

// Clean Flow
//-------------------------------------------------------------------------------

buildTarget('clean').buildFlow(
    targetTask('clean')
);


// Local Flow
//-------------------------------------------------------------------------------

buildTarget('local').buildFlow(
    series([

        // TODO BRN: This "clean" task is temporary until we're not modifying the build so much. This also ensures that
        // old source files are removed. We should figure out a better way of doing that.

        targetTask('clean'),
        parallel([
            series([
                targetTask('createNodePackage', {
                    properties: {
                        packageJson: buildProject.getProperty("syncbugserver.packageJson"),
                        sourcePaths: buildProject.getProperty("syncbugserver.sourcePaths"),
                        scriptPaths: buildProject.getProperty("syncbugserver.scriptPaths"),
                        testPaths: buildProject.getProperty("syncbugserver.testPaths")
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("syncbugserver.packageJson.name"),
                            buildProject.getProperty("syncbugserver.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask('packNodePackage', {
                    properties: {
                        packageName: buildProject.getProperty("syncbugserver.packageJson.name"),
                        packageVersion: buildProject.getProperty("syncbugserver.packageJson.version")
                    }
                }),
                targetTask('startNodeModuleTests', {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(
                            buildProject.getProperty("syncbugserver.packageJson.name"),
                            buildProject.getProperty("syncbugserver.packageJson.version")
                        );
                        task.updateProperties({
                            modulePath: packedNodePackage.getFilePath()
                        });
                    }
                }),
                targetTask("s3EnsureBucket", {
                    properties: {
                        bucket: buildProject.getProperty("local-bucket")
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("syncbugserver.packageJson.name"),
                            buildProject.getProperty("syncbugserver.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
                            }
                        });
                    },
                    properties: {
                        bucket: buildProject.getProperty("local-bucket")
                    }
                })
            ]),
            series([
                targetTask('createNodePackage', {
                    properties: {
                        packageJson: buildProject.getProperty("syncbugserverclient.packageJson"),
                        sourcePaths: buildProject.getProperty("syncbugserverclient.sourcePaths"),
                        scriptPaths: buildProject.getProperty("syncbugserverclient.scriptPaths"),
                        testPaths: buildProject.getProperty("syncbugserverclient.testPaths")
                    }
                }),
                targetTask('generateBugPackRegistry', {
                    init: function(task, buildProject, properties) {
                        var nodePackage = nodejs.findNodePackage(
                            buildProject.getProperty("syncbugserverclient.packageJson.name"),
                            buildProject.getProperty("syncbugserverclient.packageJson.version")
                        );
                        task.updateProperties({
                            sourceRoot: nodePackage.getBuildPath()
                        });
                    }
                }),
                targetTask('packNodePackage', {
                    properties: {
                        packageName: buildProject.getProperty("syncbugserverclient.packageJson.name"),
                        packageVersion: buildProject.getProperty("syncbugserverclient.packageJson.version")
                    }
                }),
                targetTask('startNodeModuleTests', {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(
                            buildProject.getProperty("syncbugserverclient.packageJson.name"),
                            buildProject.getProperty("syncbugserverclient.packageJson.version")
                        );
                        task.updateProperties({
                            modulePath: packedNodePackage.getFilePath()
                        });
                    }
                }),
                targetTask("s3EnsureBucket", {
                    properties: {
                        bucket: buildProject.getProperty("local-bucket")
                    }
                }),
                targetTask("s3PutFile", {
                    init: function(task, buildProject, properties) {
                        var packedNodePackage = nodejs.findPackedNodePackage(buildProject.getProperty("syncbugserverclient.packageJson.name"),
                            buildProject.getProperty("syncbugserverclient.packageJson.version"));
                        task.updateProperties({
                            file: packedNodePackage.getFilePath(),
                            options: {
                                acl: 'public-read'
                            }
                        });
                    },
                    properties: {
                        bucket: buildProject.getProperty("local-bucket")
                    }
                })
            ])
        ])
    ])
).makeDefault();
