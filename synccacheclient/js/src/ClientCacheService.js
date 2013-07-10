//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheclient')

//@Export('CacheService')

//@Require('Class')
//@Require('EventDispatcher')
//@Require('bugflow.BugFlow')
//@Require('synccacheclient.CacheEvent')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class               = bugpack.require('Class');
var EventDispatcher     = bugpack.require('Obj');
var BugFlow             = bugpack.require('bugflow.BugFlow');
var CacheEvent          = bugpack.require('synccache.CacheEvent');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $series         = BugFlow.$series;
var $task           = BugFlow.$task;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var ClientCacheService = Class.extend(EventDispatcher, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @param {CacheManager} cacheManager
     */
    _constructor: function(cacheManager) {

        this._super();

        //-------------------------------------------------------------------------------
        // Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {CacheManager}
         */
        this.cacheManager = cacheManager;
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} key
     * @param {function(Exception)} callback
     */
    delete: function(key, callback) {
        var _this = this;
        $task(function(flow) {
            _this.cacheManager.deleteCache(key);
            _this.dispatchEvent(new CacheEvent(CacheEvent.DELETE, {key: key}));
        }).execute(function(error) {
            if (!error) {
                callback(undefined);
            } else {
                callback(error);
            }
        });
    },

    /**
     * @param {string} key
     * @param {*} value
     * @param {function(Exception} callback
     */
    set: function(key, value, callback) {
        var _this = this;
        $task(function(flow) {
            _this.cacheManager.setCache(key, value);
            _this.dispatchEvent(new CacheEvent(CacheEvent.SET, {key: key, value: value}));
        }).execute(function(error) {
            if (!error) {
                callback(undefined);
            } else {
                callback(error);
            }
        });
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheclient.ClientCacheService', ClientCacheService);
