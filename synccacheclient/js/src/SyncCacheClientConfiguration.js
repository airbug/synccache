//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheclient')

//@Export('SyncCacheClientConfiguration')
//@Autoload

//@Require('Class')
//@Require('Obj')
//@Require('bugflow.BugFlow')
//@Require('bugioc.ArgAnnotation')
//@Require('bugioc.ConfigurationAnnotation')
//@Require('bugioc.IConfiguration')
//@Require('bugioc.ModuleAnnotation')
//@Require('bugioc.PropertyAnnotation')
//@Require('bugmeta.BugMeta')
//@Require('bugroutes.BugCallRouter')
//@Require('socketio:factoryserver.ServerSocketIoFactory')
//@Require('synccacheclient.CacheManager')
//@Require('synccacheclient.ClientCacheController')
//@Require('synccacheclient.ClientCacheService')
//@Require('synccacheclient.ConsumerManager')
//@Require('synccacheclient.ServerCacheApi')


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
var BugFlow                     = bugpack.require('bugflow.BugFlow');
var ArgAnnotation               = bugpack.require('bugioc.ArgAnnotation');
var ConfigurationAnnotation     = bugpack.require('bugioc.ConfigurationAnnotation');
var IConfiguration              = bugpack.require('bugioc.IConfiguration');
var ModuleAnnotation            = bugpack.require('bugioc.ModuleAnnotation');
var PropertyAnnotation          = bugpack.require('bugioc.PropertyAnnotation');
var BugMeta                     = bugpack.require('bugmeta.BugMeta');
var BugCallRouter               = bugpack.require('bugroutes.BugCallRouter');
var ServerSocketIoFactory       = bugpack.require('socketio:factoryserver.ServerSocketIoFactory');
var CacheManager                = bugpack.require('synccacheclient.CacheManager');
var ClientCacheController       = bugpack.require('synccacheclient.ClientCacheController');
var ClientCacheService          = bugpack.require('synccacheclient.ClientCacheService');
var ConsumerManager             = bugpack.require('synccacheclient.ConsumerManager');
var ServerCacheApi              = bugpack.require('synccacheclient.ServerCacheApi');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var arg                     = ArgAnnotation.arg;
var bugmeta                 = BugMeta.context();
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
         * @type {ConsumerManager}
         */
        this._consumerManager     = null;

        /**
         * @private
         * @type {{
         *      port: number,
         *      mongoDbIp: string
         * }}
         */
        this._config            = null;
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
        $series([
            $task(function(flow) {
                _this._consumerManager.initialize(function(error) {
                    flow.complete(error);
                });
            })
        ]).execute(callback);
    },


    /**
     * @param {EventDispatcher} bugCallRequestEventDispatcher
     * @return {BugCallRouter}
     */
    bugCallRouter: function(bugCallRequestEventDispatcher) {
        return new BugCallRouter(bugCallRequestEventDispatcher);
    },

    /**
     * @return {CacheManager}
     */
    cacheManager: function() {
        return new CacheManager();
    },

    /**
     * @param {BugCallRouter} bugCallRouter
     * @param {ClientCacheService} clientCacheService
     * @return {*}
     */
    clientCacheController: function(bugCallRouter, clientCacheService) {
        return new ClientCacheController(bugCallRouter, clientCacheService);
    },
    
    /**
     * @param {CacheManager} cacheManager
     * @return {ClientCacheService}
     */
    clientCacheService: function(cacheManager) {
        return new ClientCacheService(cacheManager);
    },

    /**
     * @param {{}} config
     * @param {CacheManager} cacheManager
     * @param {ServerSocketIoFactory} serverSocketIoFactory
     * @return {ConsumerManager}
     */
    consumerManager: function(config, cacheManager, serverSocketIoFactory) {
        return new ConsumerManager(config, cacheManager, serverSocketIoFactory);
    },

    /**
     * @return {Object}
     */
    config: function() {
        return this._config;
    },

    /**
     * @param {ConsumerManager} consumerManager
     * @return {ServerCacheApi}
     */
    serverCacheApi: function(consumerManager) {
        return new ServerCacheApi(consumerManager);
    },

    /**
     * @return {ServerSocketIoFactory}
     */
    serverSocketIoFactory: function() {
        return new ServerSocketIoFactory();
    }
});


//-------------------------------------------------------------------------------
// Interfaces
//-------------------------------------------------------------------------------

Class.implement(SyncCacheClientConfiguration, IConfiguration);


//-------------------------------------------------------------------------------
// BugMeta
//-------------------------------------------------------------------------------

bugmeta.annotate(SyncCacheClientConfiguration).with(
    configuration().modules([


        //-------------------------------------------------------------------------------
        // Common
        //-------------------------------------------------------------------------------

        module("config"),
        module("serverCacheApi")
            .args([
                arg().ref("consumerManager")
            ]),


        //-------------------------------------------------------------------------------
        // Sockets
        //-------------------------------------------------------------------------------

        module("serverSocketIoFactory"),


        //-------------------------------------------------------------------------------
        // BugCall
        //-------------------------------------------------------------------------------

        module("bugCallRouter")
            .args([
                arg().ref("bugCallRequestEventDispatcher")
            ]),


        //-------------------------------------------------------------------------------
        // Controllers
        //-------------------------------------------------------------------------------

        module("clientCacheController")
            .args([
                arg().ref("bugCallRouter"),
                arg().ref("clientCacheService")
            ]),


        //-------------------------------------------------------------------------------
        // Services
        //-------------------------------------------------------------------------------

        module("clientCacheService")
            .args([
                arg().ref("cacheManager")
            ]),


        //-------------------------------------------------------------------------------
        // Managers
        //-------------------------------------------------------------------------------

        module("cacheManager"),
        module("consumerManager")
            .args([
                arg().ref("config"),
                arg().ref("cacheManager"),
                arg().ref("serverSocketIoFactory")
            ])
    ])
);


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export("synccacheclient.SyncCacheClientConfiguration", SyncCacheClientConfiguration);
