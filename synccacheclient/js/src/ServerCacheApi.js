//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheclient')

//@Export('ServerCacheApi')

//@Require('Class')
//@Require('MultiSetMap')
//@Require('Obj')
//@Require('bugflow.BugFlow'))


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class               = bugpack.require('Class');
var MultiSetMap         = bugpack.require('MultiSetMap');
var Obj                 = bugpack.require('Obj');
var BugFlow             = bugpack.require('bugflow.BugFlow');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $forEachParallel    = BugFlow.$forEachParallel;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var ServerCacheApi = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function(consumerManager) {

        this._super();


        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {ConsumerManager}
         */
        this.consumerManager = consumerManager;
    },


    //-------------------------------------------------------------------------------
    // Public Class Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Error)} callback
     */
    acquireLock: function(key, options, callback) {
        var consumer = this.consumerManager.getConsumerForKey(key);
        consumer.acquireLock(key, options, callback);
    },

    /**
     * @param {string} key
     * @param {*} value
     * @param {{
     *     sync: boolean
     * }} options
     * @param {function(Error)} callback
     */
    add: function(key, value, options, callback) {
        var consumer = this.consumerManager.getConsumerForKey(key);
        consumer.add(key, options, callback);
    },

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Error, *)} callback
     */
    delete: function(key, options, callback) {
        var consumer = this.consumerManager.getConsumerForKey(key);
        consumer.delete(key, options, callback);
    },

    /**
     * @param {string} key
     * @param {{
     *     refresh: boolean,
     *     sync: boolean
     * }} options
     * @param {function(Error, *)} callback
     */
    get: function(key, options, callback) {
        var consumer = this.consumerManager.getConsumerForKey(key);
        consumer.get(key, options, callback);
    },

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Error)} callback
     */
    releaseLock: function(key, options, callback) {
        var consumer = this.consumerManager.getConsumerForKey(key);
        consumer.releaseLock(key, options, callback);
    },

    /**
     * @param {string} key
     * @param {*} value
     * @param {{
     *     consistency: boolean,
     *     sync: boolean
     * }} options
     * @param {function(Error)} callback
     */
    set: function(key, value, options, callback) {
        var consumer = this.consumerManager.getConsumerForKey(key);
        consumer.set(key, options, callback);
    },

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Exception)} callback
     */
    sync: function(key, options, callback) {
        var consumer = this.consumerManager.getConsumerForKey(key);
        consumer.sync(key, options, callback);
    },

    /**
     * @param {Array.<string>} keys
     * @param {{}} options
     * @param {function(Exception)} callback
     */
    syncAll: function(keys, options, callback) {
        var _this = this;
        var consumerToKeySetMap = new MultiSetMap();
        keys.forEach(function(key) {
            var consumer = _this.consumerManager.getConsumerForKey(key);
            consumerToKeySetMap.put(consumer, key);
        });
        $forEachParallel(consumerToKeySetMap.getKeyArray(), function(flow, consumer) {
            var keyArray = consumerToKeySetMap.get(consumer).getValueArray();
            consumer.syncAll(keyArray, options, function(error) {
                //TODO BRN: Handle errors and exceptions
                flow.complete(error);
            });
        }).execute(callback);
    },

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Exception)} callback
     */
    unsync: function(key, options, callback) {
        var consumer = this.consumerManager.getConsumerForKey(key);
        consumer.unsync(key, options, callback);
    }
});

//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheclient.ServerCacheApi', ServerCacheApi);
