//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheconsumer')

//@Export('CacheManager')

//@Require('Class')
//@Require('DualMap')
//@Require('Map')
//@Require('Obj')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class       = bugpack.require('Class');
var DualMap     = bugpack.require('DualMap');
var Map         = bugpack.require('Map');
var Obj         = bugpack.require('Obj');


//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

var CacheManager = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function() {

        this._super();

        //-------------------------------------------------------------------------------
        // Instance Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {Map.<string, *>}
         */
        this.cacheMap   = new Map();

        /**
         * @private
         * @type {DualMap.<string, ServerCacheConsumer>}
         */
        this.syncMap    = new DualMap();
    },


    //-------------------------------------------------------------------------------
    // Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} key
     */
    deleteCache: function(key){
        this.cacheMap.remove(key);
    },

    /**
     * @param {string} key
     * @return {*}
     */
    getCache: function(key){
        return this.cacheMap.get(key);
    },

    /**
     * @param {ServerCacheConsumer} consumer
     * @return {Collection.<string>}
     */
    getSyncKeysForConsumer: function(consumer) {
        return this.syncMap.getKeys(consumer);
    },

    /**
     * @param {string} key
     * @return {boolean}
     */
    isSyncing: function(key) {
        return this.syncMap.containsKey(key);
    },

    /**
     * @param {string} key
     * @param {*} value
     */
    setCache: function(key, value) {
        this.cacheMap.put(key, value);
    },

    /**
     * @param {string} key
     * @param {ServerCacheConsumer} consumer
     */
    syncCache: function(key, consumer) {
        this.syncMap.put(key, consumer);
    },

    /**
     * @param {Array.<string>} keys
     * @param {ServerCacheConsumer} consumer
     */
    syncAllCache: function(keys, consumer) {
        var _this = this;
        keys.forEach(function(key) {
            _this.syncCache(key, consumer);
        });
    },

    /**
     * @param {ServerCacheConsumer} consumer
     */
    unsyncCacheForConsumer: function(consumer) {
        this.syncMap.removeByValue(consumer);
    },

    /**
     * @param {string} key
     */
    unsyncCacheForKey: function(key) {
        this.syncMap.removeByKey(key);
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheconsumer.CacheManager', CacheManager);
