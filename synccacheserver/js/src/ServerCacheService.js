//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('ServerCacheService')

//@Require('Class')
//@Require('LockStriped')
//@Require('Obj')
//@Require('TypeUtil')
//@Require('bugflow.BugFlow')
//@Require('synccache.SyncCacheDefines')
//@Require('synccacheserver.CacheException')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class               = bugpack.require('Class');
var LockStriped         = bugpack.require('LockStriped');
var Obj                 = bugpack.require('Obj');
var TypeUtil            = bugpack.require('TypeUtil');
var BugFlow             = bugpack.require('bugflow.BugFlow');
var SyncCacheDefines    = bugpack.require('synccache.SyncCacheDefines');
var CacheException      = bugpack.require('synccacheserver.CacheException');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $forEachParallel    = BugFlow.$forEachParallel;
var $if                 = BugFlow.$if;
var $series             = BugFlow.$series;
var $task               = BugFlow.$task;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var ServerCacheService = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @param {BugAtomic} bugAtomic
     * @param {CacheManager} cacheManager
     * @param {ConsumerManager} consumerManager
     * @param {LockManager} lockManager
     * @param {ClientCacheApi} clientCacheApi
     */
    _constructor: function(bugAtomic, cacheManager, consumerManager, lockManager, clientCacheApi) {

        this._super();

        //-------------------------------------------------------------------------------
        // Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugAtomic}
         */
        this.bugAtomic              = bugAtomic;

        /**
         * @private
         * @type {CacheManager}
         */
        this.cacheManager           = cacheManager;

        /**
         * @private
         * @type {ConsumerManager}
         */
        this.consumerManager        = consumerManager;

        /**
         * @private
         * @type {ClientCacheApi}
         */
        this.clientCacheApi         = clientCacheApi;

        /**
         * @private
         * @type {LockManager}
         */
        this.lockManager            = lockManager;
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {ClientCacheConsumer} consumer
     * @param {string} key
     * @param {SyncCacheDefines.LockType} type
     * @param {function((Exception | Error), Object} callback
     */
    acquireLock: function(consumer, key, type, callback) {
        var _this = this;
        $series([
            $task(function(flow) {
                _this.lockManager.acquireMonitoredLock(consumer, key, type, function(error) {
                    flow.complete(error);
                })
            })
        ]).executeFlow(callback);
    },

    acquireAllLocks: function(consumer, keys, type, callback) {
        //TODO BRN: Require all of these locks in a chain.
        // A -> B - > C
        // If this server is acquiring lock A, then it should make a client request to acquire B, and then the server
        // that contains B should make a client request to acquire lock
    },

    /**
     * @param {ClientCacheConsumer} consumer
     * @param {string} key
     * @param {*} value
     * @param {{
     *     sync: boolean
     * }} options
     * @param {function(Exception, Object} callback
     */
    add: function(consumer, key, value, options, callback) {
        var _this = this;
        this.bugAtomic.operation(key, "write", ["write", "read"], true, function(operation) {
            $series([
                $task(function(flow) {
                    if (!_this.cacheManager.hasCache(key)) {
                        _this.setCache(key, value, options.consistency, function(error) {
                            if (options.sync) {
                                _this.consumerManager.syncConsumerForCacheKey(key, consumer);
                            }
                            flow.complete(error);
                        });
                    } else {
                        flow.error(new CacheException(CacheException.KEY_EXISTS));
                    }
                })
            ]).execute(function(error) {
                operation.complete();
                if (!error) {
                    callback(undefined);
                } else {
                    callback(error);
                }
            });
        });
    },

    /**
     * @param {ClientCacheConsumer} consumer
     * @param {string} key
     * @param {{
     *     unsync: boolean
     * }} options
     * @param {function(Exception, Object} callback
     */
    delete: function(consumer, key, options, callback) {
        //TODO BRN: Add an unsync option. This should unsync this key for ALL consumers. This should also notify the
        // consumers that they have been unsynced

        var _this = this;
        this.bugAtomic.operation(key, "write", ["write", "read"], true, function(operation) {
            $series([
                $task(function(flow) {
                    _this.cacheManager.removeCache(key);
                    if (options.consistency === "strong") {
                        _this.clientCacheApi.delete(key, function(error) {
                            //TODO BRN: Handle exceptions and errors
                            flow.complete(error);
                        });
                    } else {
                        _this.clientCacheApi.delete(key, function(error) {
                            //TODO BRN: Handle exceptions and errors
                        });
                        flow.complete();
                    }
                })
            ]).execute(function(error) {
                operation.complete();
                if (!error) {
                    callback(null);
                } else {
                    callback(error);
                }
            });
        });
    },

    /**
     * @param {ClientCacheConsumer} consumer
     * @param {string} key
     * @param {{
     *     sync: boolean
     * }} options
     * @param {function(Exception, *} callback
     */
    get: function(consumer, key, options, callback) {
        var _this = this;
        this.bugAtomic.operation(key, "read", ["read"], true, function(operation) {
            var value = undefined;
            $series([
                $task(function(flow) {
                    var cache = this.cacheManager.getCache(key);
                    if (!TypeUtil.isUndefined(cache)) {
                        value = cache;
                        if (options.sync) {
                            _this.consumerManager.syncConsumerForCacheKey(key, consumer);
                        }
                        flow.complete();
                    } else {
                        flow.error(new CacheException(CacheException.NO_CACHE));
                    }
                })
            ]).executeFlow(function(error) {
                operation.complete();
                if (!error) {
                    callback(undefined, value);
                } else {
                    callback(error);
                }
            });
        });
    },

    /**
     * @param {string} key
     * @param {SyncCacheDefines.LockType} type
     * @param {function(Exception, Object} callback
     */
    releaseLock: function(key, type, callback) {
        var _this = this;
        $series([
            $task(function(flow) {
                _this.lockManager.releaseLock(key, type, function(error) {
                    flow.complete(error);
                })
            })
        ]).executeFlow(callback);
    },

    /**
     * @param {ClientCacheConsumer} consumer
     * @param {string} key
     * @param {Object} value
     * @param {{
     *     sync: boolean
     * }} options
     * @param {function(Exception, Object} callback
     */
    set: function(consumer, key, value, options, callback) {
        var _this = this;
        this.bugAtomic.operation(key, "write", ["read", "write"], true, function(operation) {
            $series([
                $task(function(flow) {
                    _this.setCache(key, value, options.consistency, function(error) {
                        if (options.sync) {
                            _this.consumerManager.syncConsumerForCacheKey(key, consumer);
                        }
                        flow.complete(error);
                    });
                })
            ]).execute(function(error) {
                operation.complete();
                if (!error) {
                    callback(undefined);
                } else {
                    callback(error);
                }
            });
        });
    },

    /**
     * @param {ClientCacheConsumer} consumer
     * @param {string} key
     * @param {} options
     * @param {function(Exception} callback
     */
    sync: function(consumer, key, options, callback) {
        var _this = this;
        this.bugAtomic.operation(key, "write", ["write"], true, function(operation) {
            _this.consumerManager.syncConsumerForCacheKey(key, consumer);
            operation.complete();
            callback();
        });
    },

    /**
     * @param {ClientCacheConsumer} consumer
     * @param {Array.<string>} keys
     * @param {{}} options
     * @param {function(Exception)} callback
     */
    syncAll: function(consumer, keys, options, callback) {
        var _this = this;
        $forEachParallel(keys, function(flow, key) {
            _this.sync(consumer, key, options, function(error) {
                flow.complete(error);
            });
        }).execute(callback);
    },

    /**
     * @param {ClientCacheConsumer} consumer
     * @param {string} key
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    unsync: function(consumer, key, options, callback) {
        var _this = this;
        this.bugAtomic.operation(key, "write", ["write"], true, function(operation) {
            _this.consumerManager.unsyncConsumerForCacheKey(key, consumer);
            operation.complete();
            callback();
        });
    },


    //-------------------------------------------------------------------------------
    // Private Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {string} key
     * @param {*} value
     * @param {string} consistency
     * @param {function(Error | Exception)} callback
     */
    setCache: function(key, value, consistency, callback) {
        this.cacheManager.putCache(key, value);
        if (consistency === "strong") {
            this.clientCacheApi.set(key, value, function(exception) {
                //TODO BRN: What should we do if there was an exception?
                callback(exception);
            });
        } else {
            this.clientCacheApi.set(key, value, function(exception) {
                console.error("An exception occurred on 'set' - exception:", exception);
                //TODO BRN: What should we do if there was an exception?
            });
            callback();
        }
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.ServerCacheService', ServerCacheService);
