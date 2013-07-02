//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('CallService')

//@Require('Class')
//@Require('DualMultiSetMap')
//@Require('Exception')
//@Require('Obj')
//@Require('bugatomic.BugAtomic')
//@Require('bugcall.BugCallServerEvent')
//@Require('bugcall.RequestFailedException')
//@Require('bugflow.BugFlow')


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
var Obj                     = bugpack.require('Obj');
var BugAtomic               = bugpack.require('bugatomic.BugAtomic');
var BugCallServerEvent      = bugpack.require('bugcall.BugCallServerEvent');
var RequestFailedException  = bugpack.require('bugcall.RequestFailedException');
var BugFlow                 = bugpack.require('bugflow.BugFlow');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $forEachParallel    = BugFlow.$forEachParallel;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var CallService = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @param {BugCallServer} bugCallServer
     */
    _constructor: function(bugCallServer) {

        this._super();


        //-------------------------------------------------------------------------------
        // Declare Variables
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugAtomic}
         */
        this.bugAtomic                  = new BugAtomic(1);

        /**
         * @private
         * @type {BugCallServer}
         */
        this.bugCallServer              = bugCallServer;

        /**
         * @private
         * @type {DualMultiSetMap.<string, CallManager>}
         */
        this.cacheKeyToCallManagerMap   = new DualMultiSetMap();

        this.initialize();
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} cacheKey
     * @param {CallManager} callManager
     */
    unsyncCallManagerForCacheKey: function(cacheKey, callManager) {
        this.cacheKeyToCallManagerMap.removeKeyValuePair(cacheKey, callManager);
    },

    /**
     * @param {string} cacheKey
     * @return {Set.<CallManager>}
     */
    getCallManagerSetByCacheKey: function(cacheKey) {
        return this.cacheKeyToCallManagerMap.getValue(cacheKey);
    },

    /**
     * @param {CallManager} callManager
     * @return {Set.<string>}
     */
    getCacheKeySetByCallManager: function(callManager) {
        return this.cacheKeyToCallManagerMap.getKey(callManager);
    },

    /**
     * @param {string} cacheKey
     * @return {Boolean}
     */
    hasCacheKey: function(cacheKey) {
        return this.cacheKeyToCallManagerMap.containsKey(cacheKey);
    },

    /**
     * @param {string} cacheKey
     * @param {CallManager} callManager
     */
    syncCallManagerForCacheKey: function(cacheKey, callManager) {
        this.cacheKeyToCallManagerMap.put(cacheKey, callManager);
    },

    /**
     * @param {string} cacheKey
     * @param {function(Error)}
     */
    sendDeleteCache: function(cacheKey, callback) {
        _this.unsyncCallManagerForSyncKey(callManager, cacheKey);
        _this.bugCallServer.request(SyncCacheServerService.RequstTypes.DELETE, {cacheKey: cacheKey}, function(error, callResponse) {

            if (!error) {
                //TEST
                console.log("Delete cacheKey callResponse:", callResponse);
                if (callResponse.getType() === "deleteResponse") {

                } else if (callResponse.getType() == "deleteError") {

                }
            } else {
                //TODO BRN: What to do if there was an error?
                console.error(error);
            }
        });
    },

    /**
     *
     * @param cacheKey
     * @param cache
     * @param callback
     */
    sendSetCache: function(cacheKey, cache, callback) {
        var _this = this;

        // NOTE BRN: Create a copy of the call manager set so that it does not
        // change underneath us while this call is queued.

        var callManagerSet  = this.getCallManagerSetByCacheKey(cacheKey).clone();
        this.bugAtomic.operation(cacheKey, true, function(operation) {
            $forEachParallel(callManagerSet, function(flow, callManager) {
                _this.bugCallServer.request(callManager, CallService.RequstTypes.DELETE, {cacheKey: cacheKey, cache: cache}, function(error, callResponse) {

                    if (!error) {
                        //TEST
                        console.log("Delete cacheKey callResponse:", callResponse);
                        if (callResponse.getType() === "deleteResponse") {

                        } else if (callResponse.getType() == "deleteError") {

                        }
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            console.error(exception);
                            if (Class.doesExtend(exception, RequestFailedException)) {
                                //TODO BRN: If a request fails, we need to figure out what the reason is..
                                //If a node has gone down, the node needs to be removed from the known client sync list.
                                console.warn("Could not complete request to callManager:", callManager);
                                flow.complete();
                            } else {
                                //TODO BRN: Unhandled exception types
                                console.error("Unhandled Exception:", exception);
                                flow.error(exception);
                            }
                        } else {
                            flow.complete(error);
                        }
                    }
                });
            }).execute(function(error) {
                operation.complete();
                callback(error);
            });
        });
    },


    //-------------------------------------------------------------------------------
    // Private Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     */
    initialize: function() {
        this.bugCallServer.on(BugCallServerEvent.CALL_CLOSED, this.hearBugCallServerCallClosed, this);
    },

    /**
     * @private
     * @param {CallManager} callManager
     */
    unsyncCallManager: function(callManager) {
        this.cacheKeyToCallManagerMap.removeByValue(callManager);
    },


    //-------------------------------------------------------------------------------
    // Event Listeners
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {BugCallServerEvent} event
     */
    hearBugCallServerCallClosed: function(event) {
        var data            = event.getData();
        var callManager     = data.callManager;
        this.unsyncCallManager(callManager);
    }
});


//-------------------------------------------------------------------------------
// Static Properties
//-------------------------------------------------------------------------------

CallService.RequstTypes = {
    DELETE: "delete",
    SET: "set"
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.CallService', CallService);
