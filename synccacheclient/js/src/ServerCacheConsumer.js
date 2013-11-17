//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheclient')

//@Export('ServerCacheConsumer')

//@Require('Class')
//@Require('EventDispatcher')
//@Require('Map')
//@Require('Set')
//@Require('TypeUtil')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack         = require('bugpack').context();


//-------------------------------------------------------------------------------
// Bugpack Modules
//-------------------------------------------------------------------------------

var Class               = bugpack.require('Class');
var EventDispatcher     = bugpack.require('EventDispatcher');
var Map                 = bugpack.require('Map');
var Set                 = bugpack.require('Set');
var TypeUtil            = bugpack.require('TypeUtil');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var ServerCacheConsumer = Class.extend(EventDispatcher, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     *
     */
    _constructor: function(bugCallClient, cacheManager) {

        this._super();


        //-------------------------------------------------------------------------------
        // Private Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugCallClient}
         */
        this.bugCallClient  = bugCallClient;

        /**
         * @private
         * @type {CacheManager}
         */
        this.cacheManager   = cacheManager;

        this.initialize();
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Error)} callback
     */
    acquireLock: function(key, options, callback) {
        var _this       = this;
        var requestType = ServerCacheConsumer.RequestType.ACQUIRE_LOCK;
        var data        = {
            key: key,
            options: options
        };
        this.bugCallClient.request(requestType, data, function(exception, callResponse) {
            if (!exception) {
                var responseType = callResponse.getType();
                if (responseType === "acquireLockResponse") {
                    callback();
                } else if (responseType === "acquireLockException") {
                    console.error("acquireLockException - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else if (responseType === "acquireLockError") {
                    console.error("acquireLockError - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else {
                    callback(new Error("Unknown responseType '" + responseType + "'"));
                }
            } else {
                callback(exception, null);
            }
        });
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
        var _this       = this;
        var requestType = ServerCacheConsumer.RequestType.ADD;
        var data        = {
            key: key,
            value: value,
            options: options
        };
        this.bugCallClient.request(requestType, data, function(exception, callResponse) {
            if (!exception) {
                var responseType = callResponse.getType();
                if (responseType === "addResponse") {

                    //TODO BRN: It is possible that the cache value could flip flop if the cache server is busy sending
                    // out updates for another 'set' that occurred and then this request is processed by the server afterward. B -> A -> B

                    _this.cacheManager.setCache(key, value);
                    callback();
                } else if (responseType === "addException") {
                    console.error("addException - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else if (responseType === "addError") {
                    console.error("addError - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else {
                    callback(new Error("Unknown responseType '" + responseType + "'"));
                }
            } else {
                callback(exception, null);
            }
        });
    },

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Error, *)} callback
     */
    delete: function(key, options, callback) {
        var _this       = this;
        var requestType = ServerCacheConsumer.RequestType.DELETE;
        var data        = {
            key: key,
            options: options
        };
        this.bugCallClient.request(requestType, data, function(exception, callResponse) {
            if (!exception) {
                var responseType = callResponse.getType();
                if (responseType === "deleteResponse") {
                    _this.cacheManager.deleteCache(key);
                    callback();
                } else if (responseType === "deleteException") {
                    console.error("deleteException - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else if (responseType === "deleteError") {
                    console.error("deleteError - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else {
                    callback(new Error("Unknown responseType '" + responseType + "'"));
                }
            } else {
                callback(exception, null);
            }
        });
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
        var cacheValue = undefined;
        var refresh = (options && options.refresh);
        if (!refresh) {
            cacheValue = this.cacheManager.getCache(key);
            if (!TypeUtil.isUndefined(cacheValue)) {
                callback(undefined, cacheValue);
            } else if (!this.cacheManager.isSyncing(key)) {
                this.getCache(key, options, callback);
            } else {
                callback(undefined, undefined);
            }
        } else {
            this.getCache(key, options, callback);
        }
    },

    /**
     * @param {Object} data
     */
    openConnection: function(data) {
        this.bugCallClient.openConnection(data);
    },

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Error)} callback
     */
    releaseLock: function(key, options, callback) {
        var _this       = this;
        var requestType = ServerCacheConsumer.RequestType.RELEASE_LOCK;
        var data        = {
            key: key,
            options: options
        };
        this.bugCallClient.request(requestType, data, function(exception, callResponse) {
            if (!exception) {
                var responseType = callResponse.getType();
                if (responseType === "releaseLockResponse") {
                    callback();
                } else if (responseType === "releaseLockException") {
                    console.error("releaseLockException - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else if (responseType === "releaseLockError") {
                    console.error("releaseLockError - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else {
                    callback(new Error("Unknown responseType '" + responseType + "'"));
                }
            } else {
                callback(exception, null);
            }
        });
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
        var _this       = this;
        var requestType = ServerCacheConsumer.RequestType.SET;
        var data        = {
            key: key,
            value: value,
            options: options
        };
        this.bugCallClient.request(requestType, data, function(exception, callResponse) {
            if (!exception) {
                var responseType = callResponse.getType();
                if (responseType === "setResponse") {
                    _this.cacheManager.setCache(key, value);
                    callback();
                } else if (responseType === "setException") {
                    console.error("setException - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else if (responseType === "setError") {
                    console.error("setError - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else {
                    callback(new Error("Unknown responseType '" + responseType + "'"));
                }
            } else {
                callback(exception, null);
            }
        });
    },

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Exception)} callback
     */
    sync: function(key, options, callback) {
        var _this       = this;
        var requestType = ServerCacheConsumer.RequestType.SYNC;
        var data        = {
            key: key,
            options: options
        };
        this.bugCallClient.request(requestType, data, function(exception, callResponse) {
            if (!exception) {
                var responseType = callResponse.getType();
                if (responseType === "syncResponse") {
                    _this.cacheManager.syncCache(key, this);
                    callback();
                } else if (responseType === "syncException") {
                    console.error("syncException - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else if (responseType === "syncError") {
                    console.error("syncError - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else {
                    callback(new Error("Unknown responseType '" + responseType + "'"));
                }
            } else {
                callback(exception, null);
            }
        });
    },

    /**
     * @param {Array.<string>} keys
     * @param {{}} options
     * @param {function(Exception)} callback
     */
    syncAll: function(keys, options, callback) {
        var _this       = this;
        var requestType = ServerCacheConsumer.RequestType.SYNC_ALL;
        var data        = {
            keys: keys,
            options: options
        };
        this.bugCallClient.request(requestType, data, function(exception, callResponse) {
            if (!exception) {
                var responseType = callResponse.getType();
                if (responseType === "syncResponse") {
                    _this.cacheManager.syncAllCache(keys, this);
                    callback();
                } else if (responseType === "syncException") {
                    console.error("syncException - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else if (responseType === "syncError") {
                    console.error("syncError - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else {
                    callback(new Error("Unknown responseType '" + responseType + "'"));
                }
            } else {
                callback(exception, null);
            }
        });
    },

    /**
     * @param {string} key
     * @param {{}} options
     * @param {function(Exception)} callback
     */
    unsync: function(key, options, callback) {
        var _this       = this;
        var requestType = ServerCacheConsumer.RequestType.UNSYNC;
        var data        = {
            key: key,
            options: options
        };
        this.bugCallClient.request(requestType, data, function(exception, callResponse) {
            if (!exception) {
                var responseType = callResponse.getType();
                if (responseType === "unsyncResponse") {
                    _this.cacheManager.unsyncCacheForKey(key);
                    callback();
                } else if (responseType === "unsyncException") {
                    console.error("unsyncException - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else if (responseType === "unsyncError") {
                    console.error("unsyncError - callResponse:", callResponse);
                    //TODO BRN: Implement
                } else {
                    callback(new Error("Unknown responseType '" + responseType + "'"));
                }
            } else {
                callback(exception, null);
            }
        });
    },


    //-------------------------------------------------------------------------------
    // Private Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {string} key
     * @param {{
     *
     * }} options
     * @param callback
     */
    getCache: function(key, options, callback) {
        var _this = this;
        var requestType = ServerCacheConsumer.RequestType.GET;
        var data        = {
            key: key,
            options: options
        };
        this.bugCallClient.request(requestType, data, function(exception, callResponse) {
            if (!exception) {
                var responseType = callResponse.getType();
                if (responseType === "getResponse") {
                    var value = callResponse.getData().value;
                    _this.cacheManager.setCache(key, value);
                    callback(undefined, value);
                } else if (responseType === "getException") {
                    var exceptionType = callResponse.getData().type;
                    if (exceptionType === "CacheException:NoCache") {
                        callback(undefined, undefined);
                    } else {
                        callback(new Error("Unhandled exception response type'" + exceptionType + "'"));
                    }
                } else {
                    callback(new Error("Unknown responseType '" + responseType + "'"));
                }
            } else {
                callback(exception, null);
            }
        });
    },

    /**
     * @private
     */
    initialize: function() {
        this.bugCallClient.addEventPropagator(this);
    }
});


//-------------------------------------------------------------------------------
// Static Properties
//-------------------------------------------------------------------------------

/**
 * @enum {string}
 */
ServerCacheConsumer.RequestType = {
    ACQUIRE_LOCK: "acquireLock",
    ADD: "add",
    DELETE: "delete",
    GET: "get",
    RELEASE_LOCK: "releaseLock",
    SET: "set",
    SYNC: "sync",
    SYNC_ALL: "syncAll",
    UNSYNC: "unsync"
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheclient.ServerCacheConsumer', ServerCacheConsumer);

