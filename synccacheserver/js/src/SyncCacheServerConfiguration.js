//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('SyncCacheServerConfiguration')
//@Autoload

//@Require('Class')
//@Require('Obj')
//@Require('annotate.Annotate')
//@Require('bugcall.BugCallServer')
//@Require('bugcall.CallServer')
//@Require('bugflow.BugFlow')
//@Require('bugfs.BugFs')
//@Require('bugioc.ArgAnnotation')
//@Require('bugioc.ConfigurationAnnotation')
//@Require('bugioc.IConfiguration')
//@Require('bugioc.ModuleAnnotation')
//@Require('bugioc.PropertyAnnotation')
//@Require('bugroutes.BugCallRouter')
//@Require('express.ExpressApp')
//@Require('express.ExpressServer')
//@Require('handshaker.Handshaker')
//@Require('socketio:server.SocketIoManager')
//@Require('socketio:server.SocketIoServer')
//@Require('socketio:server.SocketIoServerConfig')
//@Require('synccacheserver.CacheManager')
//@Require('synccacheserver.ClientCacheApi')
//@Require('synccacheserver.ConsumerManager')
//@Require('synccacheserver.LockManager')
//@Require('synccacheserver.ServerCacheController')
//@Require('synccacheserver.ServerCacheService')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack                 = require('bugpack').context();
var connect                 = require('connect');
var express                 = require('express');
var path                    = require('path');


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class                       = bugpack.require('Class');
var Obj                         = bugpack.require('Obj');
var Annotate                    = bugpack.require('annotate.Annotate');
var BugCallServer               = bugpack.require('bugcall.BugCallServer');
var CallServer                  = bugpack.require('bugcall.CallServer');
var BugFlow                     = bugpack.require('bugflow.BugFlow');
var BugFs                       = bugpack.require('bugfs.BugFs');
var ArgAnnotation               = bugpack.require('bugioc.ArgAnnotation');
var ConfigurationAnnotation     = bugpack.require('bugioc.ConfigurationAnnotation');
var IConfiguration              = bugpack.require('bugioc.IConfiguration');
var ModuleAnnotation            = bugpack.require('bugioc.ModuleAnnotation');
var PropertyAnnotation          = bugpack.require('bugioc.PropertyAnnotation');
var BugCallRouter               = bugpack.require('bugroutes.BugCallRouter');
var ExpressApp                  = bugpack.require('express.ExpressApp');
var ExpressServer               = bugpack.require('express.ExpressServer');
var Handshaker                  = bugpack.require('handshaker.Handshaker');
var SocketIoManager             = bugpack.require('socketio:server.SocketIoManager');
var SocketIoServer              = bugpack.require('socketio:server.SocketIoServer');
var SocketIoServerConfig        = bugpack.require('socketio:server.SocketIoServerConfig');
var CacheManager                = bugpack.require('synccacheserver.CacheManager');
var ClientCacheApi              = bugpack.require('synccacheserver.ClientCacheApi');
var ConsumerManager             = bugpack.require('synccacheserver.ConsumerManager');
var LockManager                 = bugpack.require('synccacheserver.LockManager');
var ServerCacheController       = bugpack.require('synccacheserver.ServerCacheController');
var ServerCacheService          = bugpack.require('synccacheserver.ServerCacheService');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var annotate                = Annotate.annotate;
var arg                     = ArgAnnotation.arg;
var configuration           = ConfigurationAnnotation.configuration;
var module                  = ModuleAnnotation.module;
var property                = PropertyAnnotation.property;

var $parallel               = BugFlow.$parallel;
var $series                 = BugFlow.$series;
var $task                   = BugFlow.$task;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var SyncCacheServerConfiguration = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function() {

        this._super();


        //-------------------------------------------------------------------------------
        // Variables
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {{
         *      port: number,
         *      mongoDbIp: string
         * }}
         */
        this._config                    = null;

        /**
         * @private
         * @type {string}
         */
        this._configFilePath            = path.resolve(__dirname, '../config.json');

        /**
         * @private
         * @type {ExpressApp}
         */
        this._expressApp                = null;

        /**
         * @private
         * @type {ExpressServer}
         */
        this._expressServer             = null;

        //TODO BRN: Replace this communication mechanism out with standard sockets.
        /**
         * @private
         * @type {SocketIoServer}
         */
        this._socketIoServer            = null;

        /**
         * @private
         * @type {ServerCacheController}
         */
        this._serverCacheController  = null;
    },


    //-------------------------------------------------------------------------------
    // Configuration Lifecycle
    //-------------------------------------------------------------------------------

    /**
     * @param {function(error)} callback
     */
    initializeConfiguration: function(callback) {
        var _this = this;
        console.log("Initializing SyncCacheServerConfiguration");

        var config = this._config;

        this._expressApp.configure(function(){
            _this._expressApp.set('port', config.port);
        });

        _this._expressApp.use(express.errorHandler());

        this._expressApp.configure('development', function() {
            _this._expressApp.use(express.logger('dev'));
        });

        this._socketIoServerConfig.setResource("/api/socket");

        $series([

            //-------------------------------------------------------------------------------
            // Controllers
            //-------------------------------------------------------------------------------

            $task(function(flow) {
                _this._serverCacheController.configure(function(error) {
                    if (!error) {
                        console.log("serverCacheController configured");
                    }
                    flow.complete(error);
                })
            }),


            //-------------------------------------------------------------------------------
            // Apps and Servers
            //-------------------------------------------------------------------------------

            $task(function(flow){
                console.log("Initializing expressApp");

                _this._expressApp.initialize(function(error) {
                    if (!error) {
                        console.log("expressApp initialized");
                    }
                    flow.complete(error);
                });
            }),
            $task(function(flow){
                console.log("starting expressServer");

                _this._expressServer.start(function(error) {
                    if (!error) {
                        console.log("expressServer started");
                    }
                    flow.complete(error);
                });
            }),
            $task(function(flow){
                console.log("Starting socketIoServer");

                _this._socketIoServer.start(function(error) {
                    if (!error) {
                        console.log("socketIoServer started");
                    }
                    flow.complete(error);
                });
            })
        ]).execute(callback);
    },


    /**
     * @param {BugCallServer} bugCallServer
     * @return {BugCallRouter}
     */
    bugCallRouter: function(bugCallServer) {
        return new BugCallRouter(bugCallServer);
    },

    /**
     * @param {CallServer} callServer
     * @return {BugCallServer}
     */
    bugCallServer: function(callServer) {
        return new BugCallServer(callServer);
    },

    /**
     * @return {CacheManager}
     */
    cacheManager: function() {
        return new CacheManager();
    },

    /**
     * @param {SocketIoManager}
     * @return {CallServer}
     */
    callServer: function(socketIoManager) {
        return new CallServer(socketIoManager);
    },

    /**
     * @param {ConsumerManager} consumerManager
     * @return {ClientCacheApi}
     */
    clientCacheApi: function(consumerManager) {
        return new ClientCacheApi(consumerManager);
    },

    /**
     * @return {Object}
     */
    config: function() {
        this._config = this.loadConfig(this._configFilePath);
        return this._config;
    },

    /**
     * @param {BugCallServer} bugCallServer
     * @return {ConsumerManager}
     */
    consumerManager: function(bugCallServer) {
        return new ConsumerManager(bugCallServer);
    },

    /**
     * @param {Object} config
     * @return {ExpressServer}
     */
    expressApp: function(config) {
        this._expressApp = new ExpressApp(config);
        return this._expressApp;
    },

    /**
     * @param {ExpressApp} expressApp
     * @return {ExpressServer}
     */
    expressServer: function(expressApp) {
        this._expressServer = new ExpressServer(expressApp);
        return this._expressServer;
    },

    /**
     * @return {Handshaker}
     */
    handshaker: function() {
        this._handshaker = new Handshaker([]);
        return this._handshaker;
    },

    /**
     * @return {LockManager}
     */
    lockManager: function() {
        return new LockManager();
    },

    /**
     * @param {SocketIoServer} socketIoServer
     * @return {SocketIoManager}
     */
    socketIoManager: function(socketIoServer) {
        return new SocketIoManager(socketIoServer, '/api/client');
    },

    /**
     * @param {SocketIoServerConfig} config
     * @param {ExpressServer} expressServer
     * @return {SocketIoServer}
     */
    socketIoServer: function(config, expressServer, handshaker) {
        this._socketIoServer = new SocketIoServer(config, expressServer, handshaker);
        return this._socketIoServer;
    },

    /**
     * @return {SocketIoServerConfig}
     */
    socketIoServerConfig: function() {
        this._socketIoServerConfig = new SocketIoServerConfig({});
        return this._socketIoServerConfig;
    },

    /**
     * @param {BugCallRouter} bugCallRouter
     * @param {ConsumerManager} consumerManager
     * @param {ServerCacheService} serverCacheService
     * @return {SyncbugController}
     */
    serverCacheController: function(bugCallRouter, consumerManager, serverCacheService) {
        this._serverCacheController = new ServerCacheController(bugCallRouter, consumerManager, serverCacheService);
        return this._serverCacheController;
    },

    /**
     * @param {CacheManager} cacheManager
     * @param {ConsumerManager} consumerManager
     * @param {LockManager} lockManager
     * @param {ClientCacheApi} clientCacheApi
     * @return {ServerCacheService}
     */
    serverCacheService: function(cacheManager, consumerManager, lockManager, clientCacheApi) {
        return new ServerCacheService(cacheManager, consumerManager, lockManager, clientCacheApi);
    },


    //-------------------------------------------------------------------------------
    // Private Methods
    //-------------------------------------------------------------------------------

    /*
     * @private
     * @param {?string=} configPath
     * @return {{
     *      port: number,
     *      mongoDbIp: string
     * }}
     **/
    loadConfig: function(configPath){
        var config;
        var defaults = {
            port: 8000,
            mongoDbIp: "localhost"
        };

        if (BugFs.existsSync(configPath)) {
            try {
                config = JSON.parse(BugFs.readFileSync(configPath, 'utf8'));
            } catch(error) {
                console.log(configPath, "could not be parsed. Invalid JSON.");
                return defaults;
            } finally {
                return config;
            }
        } else {
            return defaults;
        }
    }
});


//-------------------------------------------------------------------------------
// Interfaces
//-------------------------------------------------------------------------------

Class.implement(SyncCacheServerConfiguration, IConfiguration);


//-------------------------------------------------------------------------------
// Annotate
//-------------------------------------------------------------------------------

annotate(SyncCacheServerConfiguration).with(
    configuration().modules([


        //-------------------------------------------------------------------------------
        // Common
        //-------------------------------------------------------------------------------

        module("config"),


        //-------------------------------------------------------------------------------
        // Express
        //-------------------------------------------------------------------------------

        module("expressApp")
            .args([
                arg("config").ref("config")
            ]),
        module("expressServer")
            .args([
                arg("expressApp").ref("expressApp")
            ]),


        //-------------------------------------------------------------------------------
        // Util
        //-------------------------------------------------------------------------------

        module("handshaker"),


        //-------------------------------------------------------------------------------
        // Sockets
        //-------------------------------------------------------------------------------

        module("socketIoManager")
            .args([
                arg("socketIoServer").ref("socketIoServer")
            ]),
        module("socketIoServer")
            .args([
                arg("config").ref("socketIoServerConfig"),
                arg("expressServer").ref("expressServer"),
                arg("handshaker").ref("handshaker")
            ]),
        module("socketIoServerConfig"),


        //-------------------------------------------------------------------------------
        // BugCall
        //-------------------------------------------------------------------------------

        module("bugCallRouter")
            .args([
                arg("bugCallServer").ref("bugCallServer")
            ]),
        module("bugCallServer")
            .args([
                arg("callServer").ref("callServer")
            ]),
        module("callServer")
            .args([
                arg("socketIoManager").ref("socketIoManager")
            ]),


        //-------------------------------------------------------------------------------
        // Controllers
        //-------------------------------------------------------------------------------

        module("serverCacheController")
            .args([
                arg("bugCallRouter").ref("bugCallRouter"),
                arg("consumerManager").ref("consumerManager"),
                arg("serverCacheService").ref("serverCacheService")
            ]),


        //-------------------------------------------------------------------------------
        // Services
        //-------------------------------------------------------------------------------

        module("serverCacheService")
            .args([
                arg("cacheManager").ref("cacheManager"),
                arg("consumerManager").ref("consumerManager"),
                arg("lockManager").ref("lockManager"),
                arg("clientCacheApi").ref("clientCacheApi")
            ]),


        //-------------------------------------------------------------------------------
        // Managers
        //-------------------------------------------------------------------------------

        module("cacheManager"),
        module("consumerManager")
            .args([
                arg("bugCallServer")
            ]),
        module("lockManager"),


        //-------------------------------------------------------------------------------
        // Apis
        //-------------------------------------------------------------------------------

        module("clientCacheApi")
            .args([
                arg("consumerManager").ref("consumerManager")
            ])
    ])
);


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export("synccacheserver.SyncCacheServerConfiguration", SyncCacheServerConfiguration);
