//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheclient')

//@Export('SyncCacheClientModule')
//@Autoload

//@Require('Class')
//@Require('Obj')
//@Require('Proxy')
//@Require('bugioc.ApplicationContext')
//@Require('bugioc.ConfigurationScan')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class               = bugpack.require('Class');
var EventReceiver       = bugpack.require('EventReceiver');
var Proxy               = bugpack.require('Proxy');
var ApplicationContext  = bugpack.require('bugioc.ApplicationContext');
var ConfigurationScan   = bugpack.require('bugioc.ConfigurationScan');


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
         * @type {ApplicationContext}
         */
        this.applicationContext = new ApplicationContext();

        /**
         * @private
         * @type {ConfigurationScan}
         */
        this.configurationScan  = new ConfigurationScan(this.applicationContext);

        /**
         * @private
         * @type {boolean}
         */
        this.started            = false;

        Proxy.proxy(this, Proxy.method(this.getSyncCacheClient, this), [
            "delete",
            "get",
            "set",
            "sync",
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
        return this.applicationContext.generateModuleByName("config");
    },

    /**
     * @return {SyncCacheClient}
     */
    getSyncCacheClient: function() {
        return this.applicationContext.generateModuleByName("syncCacheClient");
    },

    /**
     * @return {SyncCacheClientService}
     */
    getSyncCacheClientService: function() {
        return this.applicationContext.generateModuleByName("syncCacheClientService");
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
            this.applicationContext.process();
            this.getSyncCacheClientService().addedEventPropagator(this);

            var config = this.getConfig();
            if (options.syncCacheIps) {
                config.syncCacheIps = options.syncCacheIps;
            }
            console.log("Starting sync cache client...");
            this.applicationContext.initialize(function(error) {
                if (!error){
                    console.log("Sync cache client successfully started");
                    callback();
                } else {
                    console.log("Sync cache client failed to start");
                    callback(error);
                }
            });
        } else {
            throw new Error("SyncCacheClient already started");
        }
    }
});

//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('syncbugserver.SyncCacheClientModule', SyncCacheClientModule);
