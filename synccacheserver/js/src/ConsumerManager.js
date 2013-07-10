//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('ConsumerManager')

//@Require('Class')
//@Require('DualMultiSetMap')
//@Require('Exception')
//@Require('Map')
//@Require('Obj')
//@Require('bugcall.CallEvent')
//@Require('synccacheserver.ClientCacheConsumer')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack         = require('bugpack').context();


//-------------------------------------------------------------------------------
// Bugpack Modules
//-------------------------------------------------------------------------------

var Class                   = bugpack.require('Class');
var DualMultiSetMap         = bugpack.require('DualMultiSetMap');
var Exception               = bugpack.require('Exception');
var Map                     = bugpack.require('Map');
var Obj                     = bugpack.require('Obj');
var CallEvent               = bugpack.require('bugcall.CallEvent');
var ClientCacheConsumer     = bugpack.require('synccacheserver.ClientCacheConsumer');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var ConsumerManager = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @param {BugCallServer} bugCallServer
     */
    _constructor: function(bugCallServer) {

        this._super();


        //-------------------------------------------------------------------------------
        // Instance Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugCallServer}
         */
        this.bugCallServer              = bugCallServer;
        
        /**
         * @private
         * @type {DualMultiSetMap.<string, ClientCacheConsumer>}
         */
        this.cacheKeyToConsumerMap      = new DualMultiSetMap();

        /**
         * @private
         * @type {Map.<CallManager, ClientCacheConsumer>}
         */
        this.callManagerToConsumerMap   = new Map();

        this.initialize();
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {ClientCacheConsumer} consumer
     * @return {Set.<string>}
     */
    getCacheKeySetByConsumer: function(consumer) {
        return this.cacheKeyToConsumerMap.getKeys(consumer);
    },

    /**
     * @param {CallManager} callManager
     * @return {ClientCacheConsumer}
     */
    getConsumerForCallManager: function(callManager) {
        return this.callManagerToConsumerMap.get(callManager);
    },

    /**
     * @param {string} cacheKey
     * @return {Set.<ClientCacheConsumer>}
     */
    getConsumerSetByCacheKey: function(cacheKey) {
        return this.cacheKeyToConsumerMap.getValue(cacheKey);
    },

    /**
     * @param {string} cacheKey
     * @return {Boolean}
     */
    hasCacheKey: function(cacheKey) {
        return this.cacheKeyToConsumerMap.containsKey(cacheKey);
    },

    /**
     * @param {string} cacheKey
     * @param {ClientCacheConsumer} consumer
     */
    syncConsumerForCacheKey: function(cacheKey, consumer) {
        this.cacheKeyToConsumerMap.put(cacheKey, consumer);
    },

    /**
     * @param {Array.<string>} cacheKeyArray
     * @param {ClientCacheConsumer} callManager
     */
    syncConsumerForCacheKeyArray: function(cacheKeyArray, callManager) {
        var _this = this;
        cacheKeyArray.forEach(function(cacheKey) {
            _this.syncConsumerForCacheKey(cacheKey, callManager);
        });
    },

    /**
     * @param {string} cacheKey
     * @param {ClientCacheConsumer} consumer
     */
    unsyncConsumerForCacheKey: function(cacheKey, consumer) {
        this.cacheKeyToConsumerMap.removeKeyValuePair(cacheKey, consumer);
    },


    //-------------------------------------------------------------------------------
    // Private Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {CallManager} callManager
     */
    createConsumer: function(callManager) {
        if (!this.callManagerToConsumerMap.containsKey(callManager)) {
            var consumer = new ClientCacheConsumer(this.bugCallServer, callManager);
            this.callManagerToConsumerMap.put(callManager, consumer);
        } else {
            throw new Error("CallManager is already contained in the consumer manager:", callManager);
        }
    },

    /**
     * @private
     */
    initialize: function() {
        this.bugCallServer.on(CallEvent.OPENED, this.hearBugCallServerCallOpened, this);
        this.bugCallServer.on(CallEvent.CLOSED, this.hearBugCallServerCallClosed, this);
    },

    /**
     * @param {ClientCacheConsumer} consumer
     */
    removeConsumer: function(consumer) {
        this.unsyncConsumer(consumer);
        var callManager = consumer.getCallManager();
        this.callManagerToConsumerMap.remove(callManager);
    },

    /**
     * @private
     * @param {ClientCacheConsumer} consumer
     */
    unsyncConsumer: function(consumer) {
        this.cacheKeyToConsumerMap.removeByValue(consumer);
    },


    //-------------------------------------------------------------------------------
    // Event Listeners
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {CallEvent} event
     */
    hearBugCallServerCallClosed: function(event) {
        var data            = event.getData();
        var callManager     = data.callManager;
        var consumer        = this.getConsumerForCallManager(callManager);
        this.removeConsumer(consumer);
    },

    /**
     * @private
     * @param {CallEvent} event
     */
    hearBugCallServerCallOpened: function(event) {
        var data            = event.getData();
        var callManager     = data.callManager;
        this.createConsumer(callManager);
    }
});


//-------------------------------------------------------------------------------
// Static Properties
//-------------------------------------------------------------------------------

/**
 * @static
 * @enum {string}
 */
ConsumerManager.RequstTypes = {
    DELETE: "delete",
    SET: "set"
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.ConsumerManager', ConsumerManager);
