//TODO BRN: This should have a read/write queue for each key and a write lock for each key which halts the queue. The write should include the update of all other syncing machines.

//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('SyncCacheServerService')

//@Require('Class')
//@Require('Obj')
//@Require('bugflow.BugFlow')
//@Require('synccacheserver.CacheException')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class               = bugpack.require('Class');
var Obj                 = bugpack.require('Obj');
var BugFlow             = bugpack.require('bugflow.BugFlow');
var CacheException      = bugpack.require('synccacheserver.CacheException');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $if             = BugFlow.$if;
var $series         = BugFlow.$series;
var $task           = BugFlow.$task;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var SyncCacheServerService = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @param {BugCallServer} bugCallServer
     * @param {CallService} callService
     * @param {SyncCacheServerManager} syncCacheServerManager
     */
    _constructor: function(bugCallServer, callService, syncCacheServerManager) {

        this._super();

        //-------------------------------------------------------------------------------
        // Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {CallService}
         */
        this.callService            = callService;

        /**
         * @private
         * @type {SyncCacheServerManager}
         */
        this.syncCacheServerManager = syncCacheServerManager;
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {CallManager} callManager
     * @param {string} cacheKey
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    deleteCache: function(callManager, cacheKey, options, callback) {
        var _this = this;
        $series([
            $task(function(flow) {
                _this.syncCacheServerManager.removeCacheByCacheKey(cacheKey);
                if (options.consistency === "strong") {
                    _this.callService.sendDeleteCache(cacheKey, function(error) {
                        //TODO BRN: Handle exceptions and errors
                        flow.complete(error);
                    });
                } else {
                    _this.callService.sendDeleteCache(cacheKey, function(error) {
                        //TODO BRN: Handle exceptions and errors
                    });
                    flow.complete();
                }
            })
        ]).execute(function(error) {
            if (!error) {
                callback(null);
            } else {
                callback(error);
            }
        });
    },

    /**
     * @param {CallManager} callManager
     * @param {string} cacheKey
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    getCache: function(callManager, cacheKey, options, callback) {
        var cache = this.syncCacheServerManager.findCacheByCacheKey(cacheKey);
        if (cache) {
            callback(undefined, cache);
        } else {
            callback(new CacheException(CacheException.NO_CACHE));
        }
    },

    /**
     * @param {CallManager} callManager
     * @param {string} cacheKey
     * @param {Object} cache
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    setCache: function(callManager, cacheKey, cache, options, callback) {
        var _this = this;
        $series([
            $task(function(flow) {
                _this.syncCacheServerManager.createOrUpdateCache(cacheKey, cache);
                if (options.consistency === "strong") {
                    _this.callService.sendSetCache(cacheKey, cache, function(exception) {
                        //TODO BRN: What should we do if there was an exception?
                        flow.complete(exception);
                    });
                } else {
                    _this.callService.sendSetCache(cacheKey, cache, function(exception) {
                        //TODO BRN: What should we do if there was an exception?
                    });
                    flow.complete();
                }
            })
        ]).execute(function(error) {
            if (!error) {
                callback(undefined);
            } else {
                callback(error);
            }
        });
    },

    /**
     * @param {CallManager} callManager
     * @param {string} cacheKey
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    syncCache: function(callManager, cacheKey, options, callback) {
        this.callService.syncCallManagerForCacheKey(cacheKey, callManager);
        callback();
    },

    /**
     * @param {CallManager} callManager
     * @param {string} cacheKey
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    unsyncCache: function(callManager, cacheKey, options, callback) {
        this.callService.unsyncCallManagerForCacheKey(cacheKey, callManager);
        callback();
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.SyncCacheServerService', SyncCacheServerService);


