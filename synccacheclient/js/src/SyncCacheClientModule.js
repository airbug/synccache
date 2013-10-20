//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheclient')

//@Export('SyncCacheClientModule')
//@Autoload

//@Require('Class')
//@Require('EventReceiver')
//@Require('Proxy')
//@Require('bugioc.ConfigurationAnnotationProcessor')
//@Require('bugioc.ConfigurationScan')
//@Require('bugioc.ModuleAnnotationProcessor')
//@Require('bugioc.ModuleScan')
//@Require('bugioc.IocContext')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack                             = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class                               = bugpack.require('Class');
var EventReceiver                       = bugpack.require('EventReceiver');
var Proxy                               = bugpack.require('Proxy');
var IocContext                          = bugpack.require('bugioc.IocContext');
var ConfigurationAnnotationProcessor    = bugpack.require('bugioc.ConfigurationAnnotationProcessor');
var ConfigurationScan                   = bugpack.require('bugioc.ConfigurationScan');
var ModuleAnnotationProcessor           = bugpack.require('bugioc.ModuleAnnotationProcessor');
var ModuleScan                          = bugpack.require('bugioc.ModuleScan');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var SyncCacheClientModule = Class.extend(EventReceiver, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function() {

        this._super();


        //-------------------------------------------------------------------------------
        // Declare Variables
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {IocContext}
         */
        this.iocContext         = new IocContext();

        /**
         * @private
         * @type {ConfigurationScan}
         */
        this.configurationScan  = new ConfigurationScan(new ConfigurationAnnotationProcessor(this.iocContext));

        /**
         * @private
         * @type {ModuleScan}
         */
        this.moduleScan         = new ModuleScan(new ModuleAnnotationProcessor(this.iocContext));

        /**
         * @private
         * @type {boolean}
         */
        this.started            = false;

        Proxy.proxy(this, Proxy.method(this.getServerCacheApi, this), [
            "acquireLock",
            "add",
            "delete",
            "get",
            "releaseLock",
            "set",
            "sync",
            "syncAll",
            "unsync"
        ]);
    },


    //-------------------------------------------------------------------------------
    // Getters and Setters
    //-------------------------------------------------------------------------------

    /**
     * @return {{
     *     syncCacheIps: Array.<string>
     * }}
     */
    getConfig: function() {
        return this.iocContext.getModuleByName("config");
    },

    /**
     * @return {ServerCacheApi}
     */
    getServerCacheApi: function() {
        return this.iocContext.getModuleByName("serverCacheApi");
    },

    /**
     * @return {ClientCacheService}
     */
    getClientCacheService: function() {
        return this.iocContext.getModuleByName("clientCacheService");
    },


    //-------------------------------------------------------------------------------
    // Public Class Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {{
     *     syncCacheIps: Array.<string>
     * }} options
     * @param {function(Error)} callback
     */
    start: function(options, callback) {
        if (!this.started) {
            this.configurationScan.scan();
            this.moduleScan.scan();
            this.iocContext.process();
            this.getClientCacheService().addedEventPropagator(this);

            var config = this.getConfig();
            if (options.syncCacheIps) {
                config.syncCacheIps = options.syncCacheIps;
            }
            console.log("Starting sync cache client...");
            this.iocContext.initialize(function(error) {
                if (!error){
                    console.log("Sync cache client successfully started");
                    callback();
                } else {
                    console.log("Sync cache client failed to start");
                    callback(error);
                }
            });
        } else {
            throw new Error("ServerCacheConsumer already started");
        }
    }
});

//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('syncbugserver.SyncCacheClientModule', SyncCacheClientModule);
