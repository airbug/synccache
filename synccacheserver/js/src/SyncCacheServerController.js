//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('SyncCacheServerController')

//@Require('Class')
//@Require('Exception')
//@Require('Obj')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class       = bugpack.require('Class');
var Exception   = bugpack.require('Exception');
var Obj         = bugpack.require('Obj');


//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

var SyncCacheServerController = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function(bugCallRouter, syncCacheServerService) {

        this._super();

        //-------------------------------------------------------------------------------
        // Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugCallRouter}
         */
        this.bugCallRouter  = bugCallRouter;


        /**
         * @private
         * @type {SyncCacheServerService}
         */
        this.syncCacheServerService = syncCacheServerService;
    },


    //-------------------------------------------------------------------------------
    // Instance Methods
    //-------------------------------------------------------------------------------

    /**
     *
     */
    configure: function(callback){
        var _this = this;
        this.bugCallRouter.addAll({
            delete: function(request, responder) {
                var data    = request.getData();
                var options = data.options;
                var key     = data.key;
                _this.syncCacheServerService.deleteCache(key, options, function(error) {
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {key: key};
                        response    = responder.response("deleteResponse", data);
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            data        = {
                                key: key,
                                exception: exception.toObject()
                            };
                            response    = responder.response("deleteException", data);
                        } else {
                            //TODO BRN: This should not be sent out if we are in prod mode
                            data    = {
                                key: key,
                                error: error.message
                            };
                            response    = responder.response("deleteError", data);
                        }
                    }
                    responder.sendResponse(response);
                });
            },
            get: function(request, responder){
                var data    = request.getData();
                var options = data.options;
                var key     = data.key;
                _this.syncCacheServerService.getCache(request.getCallManager(), key, options, function(error, value) {
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {
                            key: key,
                            value: value
                        };
                        response    = responder.response("getResponse", data);
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            data        = {
                                key: key,
                                exception: exception.toObject()
                            };
                            response    = responder.response("getException", data);
                        } else {
                            //TODO BRN: This should not be sent out if we are in prod mode
                            data    = {
                                key: key,
                                error: error.message
                            };
                            response    = responder.response("getError", data);
                        }
                    }
                    responder.sendResponse(response);
                });
            },
            set: function(request, responder) {
                var data    = request.getData();
                var options = data.options;
                var key     = data.key;
                var value   = data.value;
                _this.syncCacheServerService.setCache(key, value, options, function(error) {
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {
                            key: key
                        };
                        response    = responder.response("setResponse", data);
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            data        = {
                                key: key,
                                exception: exception.toObject()
                            };
                            response    = responder.response("setException", data);
                        } else {
                            //TODO BRN: This should not be sent out if we are in prod mode
                            data    = {
                                key: key,
                                error: error.message
                            };
                            response    = responder.response("setError", data);
                        }
                    }
                    responder.sendResponse(response);
                })
            },
            sync: function(request, responder) {
                var data    = request.getData();
                var options = data.options;
                var key     = data.key;
                _this.syncCacheServerService.syncCallManager(request.getCallManager(), key, options, function(error){
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {key: key};
                        response    = responder.response("syncResponse", data);
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            data        = {
                                key: key,
                                exception: exception.toObject()
                            };
                            response    = responder.response("syncException", data);
                        } else {
                            //TODO BRN: This should not be sent out if we are in prod mode
                            data    = {
                                key: key,
                                error: error.message
                            };
                            response    = responder.response("syncError", data);
                        }
                    }
                    responder.sendResponse(response);
                });
            },
            unsync: function(request, responder) {
                var data    = request.getData();
                var options = data.options;
                var key     = data.key;
                _this.syncCacheServerService.unsyncCallManager(request.getCallManager(), key, options, function(error){
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {key: key};
                        response    = responder.response("unsyncResponse", data);
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            data        = {
                                key: key,
                                exception: exception.toObject()
                            };
                            response    = responder.response("unsyncException", data);
                        } else {
                            //TODO BRN: This should not be sent out if we are in prod mode
                            data    = {
                                key: key,
                                error: error.message
                            };
                            response    = responder.response("unsyncError", data);
                        }
                    }
                    responder.sendResponse(response);
                });
            }
        })
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.SyncCacheServerController', SyncCacheServerController);
