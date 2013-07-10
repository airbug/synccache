//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('ClientCacheConsumer')

//@Require('Class')
//@Require('Exception')
//@Require('Obj')
//@Require('bugcall.RequestFailedException')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack         = require('bugpack').context();


//-------------------------------------------------------------------------------
// Bugpack Modules
//-------------------------------------------------------------------------------

var Class                   = bugpack.require('Class');
var Exception               = bugpack.require('Exception');
var Obj                     = bugpack.require('Obj');
var RequestFailedException  = bugpack.require('bugcall.RequestFailedException');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var ClientCacheConsumer = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @param {BugCallServer} bugCallServer
     * @param {CallManager} callManager
     */
    _constructor: function(bugCallServer, callManager) {

        this._super();


        //-------------------------------------------------------------------------------
        // Instance Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugCallServer}
         */
        this.bugCallServer  = bugCallServer;

        /**
         * @private
         * @type {CallManager}
         */
        this.callManager    = callManager;

        this.initialize();
    },


    //-------------------------------------------------------------------------------
    // Getters and Setters
    //-------------------------------------------------------------------------------

    /**
     * @return {CallManager}
     */
    getCallManager: function() {
        return this.callManager;
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} key
     * @param {function(Error)}
     */
    delete: function(key, callback) {
        var _this = this;
        _this.bugCallServer.request(this.callManager, ClientCacheConsumer.RequstTypes.DELETE, {key: key}, function(error, callResponse) {

            if (!error) {
                //TEST
                console.log("Delete cacheKey callResponse:", callResponse);
                if (callResponse.getType() === "deleteResponse") {
                    callback();
                } else if (callResponse.getType() === "deleteException") {
                    console.error("unhandled deleteException response:", callResponse);
                    //TODO BRN: Handle exceptions...
                } else if (callResponse.getType() == "deleteError") {
                    console.error("undhandled deleteError response:", callResponse);
                    //TODO BRN: Handle errors...
                }
            } else {
                if (Class.doesExtend(error, Exception)) {
                    var exception = error;
                    console.error(exception);
                    if (Class.doesExtend(exception, RequestFailedException)) {
                        //TODO BRN: If a request fails, we need to figure out what the reason is..
                        //If a node has gone down, the node needs to be removed from the known client sync list.
                        console.warn("Could not complete request to callManager:", _this.callManager);
                        callback();
                    } else {
                        //TODO BRN: Unhandled exception types
                        console.error("Unhandled Exception:", exception);
                        callback(exception);
                    }
                } else {
                    callback(error);
                }
            }
        });
    },

    /**
     * @param {string} key
     * @param {*} value
     * @param {function(Error)} callback
     */
    set: function(key, value, callback) {
        var _this = this;
        _this.bugCallServer.request(this.callManager, ClientCacheConsumer.RequstTypes.SET, {key: key, value: value}, function(error, callResponse) {

            if (!error) {
                //TEST
                console.log("Set cacheKey callResponse:", callResponse);
                if (callResponse.getType() === "setResponse") {
                    callback();
                } else if (callResponse.getType() == "setException") {

                } else if (callResponse.getType() == "setError") {

                }
            } else {
                if (Class.doesExtend(error, Exception)) {
                    var exception = error;
                    console.error(exception);
                    if (Class.doesExtend(exception, RequestFailedException)) {
                        //TODO BRN: If a request fails, we need to figure out what the reason is..
                        //If a node has gone down, the node needs to be removed from the known client sync list.
                        console.warn("Could not complete request to callManager:", _this.callManager);
                        callback();
                    } else {
                        //TODO BRN: Unhandled exception types
                        console.error("Unhandled Exception:", exception);
                        callback(exception);
                    }
                } else {
                    callback(error);
                }
            }
        });
    },


    //-------------------------------------------------------------------------------
    // Private Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     */
    initialize: function() {
        this.callManager.addEventPropagator(this);
    }
});


//-------------------------------------------------------------------------------
// Static Properties
//-------------------------------------------------------------------------------

/**
 * @static
 * @enum {string}
 */
ClientCacheConsumer.RequstTypes = {
    DELETE: "delete",
    SET: "set"
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.ClientCacheConsumer', ClientCacheConsumer);
