//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccache')

//@Export('SyncCacheClient')

//@Require('Class')
//@Require('EventDispatcher')
//@Require('Map')
//@Require('Set')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack         = require('bugpack').context();


//-------------------------------------------------------------------------------
// Bugpack Modules
//-------------------------------------------------------------------------------

var Class           = bugpack.require('Class');
var EventDispatcher = bugpack.require('EventDispatcher');
var Map             = bugpack.require('Map');
var Set             = bugpack.require('Set');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var SyncCacheClient = Class.extend(EventDispatcher, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     *
     */
    _constructor: function(bugCallClient) {

        this._super();


        //-------------------------------------------------------------------------------
        // Declare Variables
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugCallClient}
         */
        this.bugCallClient = bugCallClient;

        /**
         * @private
         * @type {Map.<string, *>}
         */
        this.valueMap = new Map();
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} key
     * @param {function(Error, *)} callback
     */
    delete: function(key, callback) {

    },

    /**
     * @param {string} key
     * @param {{
     *     refresh: boolean
     * }} options
     * @param {function(Error, *)} callback
     */
    get: function(key, options, callback) {
        if (options && options.refresh) {

        }
        var _this = this;
        var requestType = SyncBugClient.requestType.GET;
        var data        = {
            options: options
        };


        this.syncCacheManager.findSyncObjectBySyncKey(syncKey, function(error, SyncObject) {
            if (!error && SyncObject && !options.refresh) {
                callback(null, SyncObject);
            } else {
                _this.bugCallClient.request(requestType, data, function(exception, callResponse) {
                    if (!exception) {
                        var responseType = callResponse.getType();
                        if (responseType === "getResponse") {
                            var syncObject = callResponse.getData().syncObject;
                            _this.syncObjectManager.createSyncObject(syncKey, syncObject, function(error, syncObject){
                                callback(error, syncObject);
                            });
                        } else {
                            callback(new Error("Unknown responseType '" + responseType + "'"));
                        }
                    } else {
                        callback(exception, null);
                    }
                });
            }
        });
    },

    /**
     * @param {string} key
     * @param {*} value
     * @param {function(Error)} callback
     */
    set: function(key, value, callback) {
        this.valueMap.put(key, value);
    },

    /**
     * @param {string} key
     * @param {function(Exception)} callback
     */
    sync: function(key, callback) {

    },

    /**
     * @param {string} key
     * @param {function(Exception)} callback
     */
    unsync: function(key, callback) {

    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccache.SyncCacheClient', SyncCacheClient);

