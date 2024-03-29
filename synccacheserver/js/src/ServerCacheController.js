//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('ServerCacheController')

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

var ServerCacheController = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function(bugCallRouter, consumerManager, serverCacheService) {

        this._super();

        //-------------------------------------------------------------------------------
        // Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugCallRouter}
         */
        this.bugCallRouter      = bugCallRouter;

        /**
         * @private
         * @type {ConsumerManager}
         */
        this.consumerManager    = consumerManager;

        /**
         * @private
         * @type {ServerCacheService}
         */
        this.serverCacheService = serverCacheService;
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
            acquireLock: function(request, responder) {
                var data        = request.getData();
                var lockType    = data.type;
                var key         = data.key;
                var consumer    = _this.consumerManager.getConsumerForCallManager(request.getCallManager());
                _this.serverCacheService.acquireLock(consumer, key, lockType, function(error) {
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {key: key};
                        response    = responder.response("acquireLockResponse", data);
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            data        = {
                                key: key,
                                exception: exception.toObject()
                            };
                            response    = responder.response("acquireLockException", data);
                        } else {
                            //TODO BRN: This should not be sent out if we are in prod mode
                            data    = {
                                key: key,
                                error: error.message
                            };
                            response    = responder.response("acquireLockError", data);
                        }
                    }
                    responder.sendResponse(response);
                });
            },
            add: function(request, responder) {
                var data    = request.getData();
                var options = data.options;
                var key     = data.key;
                var value   = data.value;
                var consumer    = _this.consumerManager.getConsumerForCallManager(request.getCallManager());
                _this.serverCacheService.add(consumer, key, value, options, function(error) {
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {key: key};
                        response    = responder.response("addResponse", data);
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            data        = {
                                key: key,
                                exception: exception.toObject()
                            };
                            response    = responder.response("addException", data);
                        } else {
                            //TODO BRN: This should not be sent out if we are in prod mode
                            data    = {
                                key: key,
                                error: error.message
                            };
                            response    = responder.response("addError", data);
                        }
                    }
                    responder.sendResponse(response);
                });
            },
            delete: function(request, responder) {
                var data    = request.getData();
                var options = data.options;
                var key     = data.key;
                _this.serverCacheService.delete(key, options, function(error) {
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
                var consumer    = _this.consumerManager.getConsumerForCallManager(request.getCallManager());
                _this.serverCacheService.get(consumer, key, options, function(error, value) {
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
            releaseLock: function(request, responder) {
                var data        = request.getData();
                var lockType    = data.type;
                var key         = data.key;
                _this.serverCacheService.releaseLock(key, lockType, function(error) {
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {
                            key: key
                        };
                        response    = responder.response("releaseLockResponse", data);
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            data        = {
                                key: key,
                                exception: exception.toObject()
                            };
                            response    = responder.response("releaseLockException", data);
                        } else {
                            //TODO BRN: This should not be sent out if we are in prod mode
                            data    = {
                                key: key,
                                error: error.message
                            };
                            response    = responder.response("releaseLockError", data);
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
                var consumer    = _this.consumerManager.getConsumerForCallManager(request.getCallManager());
                _this.serverCacheService.set(consumer, key, value, options, function(error) {
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
                var consumer    = _this.consumerManager.getConsumerForCallManager(request.getCallManager());
                _this.serverCacheService.sync(consumer, key, options, function(error){
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
            syncAll: function(request, responder) {
                var data    = request.getData();
                var options = data.options;
                var keys    = data.keys;
                var consumer    = _this.consumerManager.getConsumerForCallManager(request.getCallManager());
                _this.serverCacheService.syncAll(consumer, keys, options, function(error){
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {key: key};
                        response    = responder.response("syncAllResponse", data);
                    } else {
                        if (Class.doesExtend(error, Exception)) {
                            var exception = error;
                            data        = {
                                key: key,
                                exception: exception.toObject()
                            };
                            response    = responder.response("syncAllException", data);
                        } else {
                            //TODO BRN: This should not be sent out if we are in prod mode
                            data    = {
                                key: key,
                                error: error.message
                            };
                            response    = responder.response("syncAllError", data);
                        }
                    }
                    responder.sendResponse(response);
                });
            },
            unsync: function(request, responder) {
                var data    = request.getData();
                var options = data.options;
                var key     = data.key;
                var consumer    = _this.consumerManager.getConsumerForCallManager(request.getCallManager());
                _this.serverCacheService.unsync(consumer, key, options, function(error){
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

bugpack.export('synccacheserver.ServerCacheController', ServerCacheController);
