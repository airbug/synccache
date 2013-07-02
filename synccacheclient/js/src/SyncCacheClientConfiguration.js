//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheclient')

//@Export('SyncCacheClientConfiguration')
//@Autoload

//@Require('Class')
//@Require('Obj')
//@Require('annotate.Annotate')
//@Require('bugcall.BugCallClient')
//@Require('bugcall.CallClient')
//@Require('bugcall.CallManager')
//@Require('bugflow.BugFlow')
//@Require('bugioc.ArgAnnotation')
//@Require('bugioc.ConfigurationAnnotation')
//@Require('bugioc.IConfiguration')
//@Require('bugioc.ModuleAnnotation')
//@Require('bugioc.PropertyAnnotation')
//@Require('bugroutes.BugCallRouter')
//@Require('socketio:client.SocketIoClient')
//@Require('socketio:client.SocketIoConfig')
//@Require('socketio:factoryserver.ServerSocketIoFactory')
//@Require('synccacheclient.SyncCacheClient')
//@Require('synccacheclient.SyncCacheClientController')
//@Require('synccacheclient.SyncCacheClientManager')
//@Require('synccacheclient.SyncCacheClientService')


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
var BugCallClient               = bugpack.require('bugcall.BugCallClient');
var CallClient                  = bugpack.require('bugcall.CallClient');
var CallManager                 = bugpack.require('bugcall.CallManager');
var BugFlow                     = bugpack.require('bugflow.BugFlow');
var ArgAnnotation               = bugpack.require('bugioc.ArgAnnotation');
var ConfigurationAnnotation     = bugpack.require('bugioc.ConfigurationAnnotation');
var IConfiguration              = bugpack.require('bugioc.IConfiguration');
var ModuleAnnotation            = bugpack.require('bugioc.ModuleAnnotation');
var PropertyAnnotation          = bugpack.require('bugioc.PropertyAnnotation');
var BugCallRouter               = bugpack.require('bugroutes.BugCallRouter');
var SocketIoClient              = bugpack.require('socketio:client.SocketIoClient');
var SocketIoConfig              = bugpack.require('socketio:client.SocketIoConfig');
var ServerSocketIoFactory       = bugpack.require('socketio:factoryserver.ServerSocketIoFactory');
var CallService                 = bugpack.require('syncbugserver.CallService');
var SyncCacheClient             = bugpack.require('synccacheclient.SyncCacheClient');
var SyncCacheClientController   = bugpack.require('synccacheclient.SyncCacheClientController');
var SyncCacheClientManager      = bugpack.require('synccacheclient.SyncCacheClientManager');
var SyncCacheClientService      = bugpack.require('synccacheclient.SyncCacheClientService');


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

var SyncCacheClientConfiguration = Class.extend(Obj, {

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
         * @type {BugCallClient}
         */
        this._bugCallClient     = null;

        /**
         * @private
         * @type {{
         *      port: number,
         *      mongoDbIp: string
         * }}
         */
        this._config            = null;

        /**
         * @private
         * @type {SocketIoConfig}
         */
        this._socketIoConfig    = null;
    },


    //-------------------------------------------------------------------------------
    // Configuration Lifecycle
    //-------------------------------------------------------------------------------

    /**
     * @param {function(error)} callback
     */
    initializeConfiguration: function(callback) {
        var _this = this;
        console.log("Initializing SyncCacheClientConfiguration");

        var config = this._config;


        this._socketIoConfig.setResource("/api/socket");

        $series([
            $task(function(flow) {
                _this.bugCallClient.openConnection();
                flow.complete();
            })
        ]).execute(callback);
    },


    /**
     * @param {BugCallClient} bugCallClient
     * @return {BugCallRouter}
     */
    bugCallRouter: function(bugCallClient) {
        return new BugCallRouter(bugCallClient);
    },

    /**
     * @param {CallClient} callClient
     * @param {CallManager} callManager
     * @return {BugCallClient}
     */
    bugCallClient: function(callClient, callManager) {
        this._bugCallClient = new BugCallClient(callClient, callManager);
        return this._bugCallClient;
    },

    /**
     * @param {SocketIoClient} socketIoClient
     * @return {CallClient}
     */
    callClient: function(socketIoClient) {
        return new CallClient(socketIoClient);
    },

    /**
     * @return {CallManager}
     */
    callManager: function() {
        return new CallManager();
    },

    /**
     * @return {Object}
     */
    config: function() {
        return this._config;
    },

    /**
     * @return {ServerSocketIoFactory}
     */
    serverSocketIoFactory: function() {
        return new ServerSocketIoFactory();
    },

    /**
     * @param {ISocketFactory} socketIoFactory
     * @param {SocketIoConfig} socketIoConfig
     * @return {SocketIoClient}
     */
    socketIoClient: function(socketIoFactory, socketIoConfig) {
        return new SocketIoClient(socketIoFactory, socketIoConfig);
    },

    /**
     * @return {SocketIoConfig}
     */
    socketIoConfig: function() {
        this._socketIoConfig = new SocketIoConfig({});
        return this._socketIoConfig;
    }
});


//-------------------------------------------------------------------------------
// Interfaces
//-------------------------------------------------------------------------------

Class.implement(SyncCacheClientConfiguration, IConfiguration);


//-------------------------------------------------------------------------------
// Annotate
//-------------------------------------------------------------------------------

annotate(SyncCacheClientConfiguration).with(
    configuration().modules([


        //-------------------------------------------------------------------------------
        // Common
        //-------------------------------------------------------------------------------

        module("config"),


        //-------------------------------------------------------------------------------
        // Sockets
        //-------------------------------------------------------------------------------

        module("serverSocketIoFactory"),
        module("socketIoClient")
            .args([
                arg("socketIoFactory").ref("serverSocketIoFactory"),
                arg("socketIoConfig").ref("socketIoConfig")
            ]),
        module("socketIoConfig"),


        //-------------------------------------------------------------------------------
        // BugCall
        //-------------------------------------------------------------------------------

        module("bugCallRouter")
            .args([
                arg("bugCallClient").ref("bugCallClient")
            ]),
        module("bugCallClient")
            .args([
                arg("callClient").ref("callClient"),
                arg("callManager").ref("callManager")
            ]),
        module("callClient")
            .args([
                arg("socketIoClient").ref("socketIoClient")
            ]),
        module("callManager"),


        //-------------------------------------------------------------------------------
        // Controllers
        //-------------------------------------------------------------------------------

        module("syncCacheClientController")
            .args([
                arg("bugCallRouter").ref("bugCallRouter"),
                arg("syncCacheClientService").ref("syncCacheClientService")
            ]),


        //-------------------------------------------------------------------------------
        // Services
        //-------------------------------------------------------------------------------

        module("callService"),
        module("syncCacheClientService")
            .args([
                arg("syncCacheClientManager").ref("syncCacheClientManager")
            ]),


        //-------------------------------------------------------------------------------
        // Managers
        //-------------------------------------------------------------------------------

        module("syncCacheClientManager")
    ])
);


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export("synccacheclient.SyncCacheClientConfiguration", SyncCacheClientConfiguration);
