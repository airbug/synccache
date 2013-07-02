//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('syncbugserver')

//@Export('SyncObjectService')

//@Require('Class')
//@Require('Obj')
//@Require('bugcall.BugCallServerEvent')
//@Require('bugflow.BugFlow')
//@Require('synccache.SyncCacheEvent')
//@Require('syncbugserver.SyncException')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class               = bugpack.require('Class');
var Obj                 = bugpack.require('Obj');
var BugCallServerEvent  = bugpack.require('bugcall.BugCallServerEvent');
var BugFlow             = bugpack.require('bugflow.BugFlow');
var SyncCacheEvent      = bugpack.require('synccache.SyncCacheEvent');
var SyncException       = bugpack.require('syncbugserver.SyncException');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $if             = BugFlow.$if;
var $series         = BugFlow.$series;
var $task           = BugFlow.$task;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var SyncObjectService = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @param {BugCallServer} bugCallServer
     * @param {CallService} callService
     * @param {SyncCache} syncCache
     * @param {SyncObjectManager} syncObjectManager
     */
    _constructor: function(callService, syncCache, syncObjectManager) {

        this._super();

        //-------------------------------------------------------------------------------
        // Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugCallServer}
         */
        this.bugCallServer      = bugCallServer;

        /**
         * @private
         * @type {CallService}
         */
        this.callService        = callService;

        /**
         * @private
         * @type {SyncCache}
         */
        this.syncCache          = syncCache;

        /**
         * @private
         * @type {SyncObjectManager}
         */
        this.syncObjectManager  = syncObjectManager;

        this.initialize();
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {CallManager} callManager
     * @param {string} syncKey
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    deleteSyncObject: function(callManager, syncKey, options, callback) {
        var _this = this;
        var newSyncObject = null;
        $series([
            $task(function(flow) {
                _this.removeSyncObject(syncKey, function(error) {
                    flow.complete(error);
                });
            }),
            $task(function(flow) {
                this.syncCache.delete(syncKey, {}, function(exception) {
                    //TODO BRN: What should we do if there was an exception?
                    flow.complete(exception);
                });
            })
        ]).execute(function(error) {
                if (!error) {
                    callback(null, result);
                } else {
                    callback(error);
                }
            });
    },

    /**
     * @param {CallManager} callManager
     * @param {string} syncKey
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    getSyncObject: function(callManager, syncKey, options, callback) {
        var _this = this;
        var result = null;
        var nocache = false;
        var syncObject = null;
        $series([
            $task(function(flow) {
                this.syncCache.get(syncKey, options, function(exception, cache) {
                    if (!exception) {
                        result = cache;
                        flow.complete();
                    } else if (exception.getType() === "nocache") {
                        nocache = true;
                    } else {
                        flow.error(exception);
                    }
                });
            }),
            $if(function(flow) {
                    flow.assert(nocache);
                },
                $series([
                    $task(function(flow) {
                        _this.loadSyncObject(syncKey, function(error, _syncObject) {
                            if (!error) {
                                syncObject = _syncObject;
                                result = syncObject.object;
                            } else {
                                flow.error(error);
                            }
                        });
                    }),
                    $task(function(flow) {

                        //NOTE BRN: We don't wait for the sync cache to complete updating here since this
                        // can take a while.
                        _this.syncCache.set(syncObject.key, syncObject.data, function(error) {
                            if (error) {
                                //TODO BRN: What do we do if this fails? x
                                console.error(error);
                            }
                        });
                        _this.syncCache.sync(syncObject.key, {}, function(error) {
                            if (error) {
                                //TODO BRN: What do we do if this fails? x
                                console.error(error);
                            }
                        });
                        flow.complete();
                    })
                ])
            ).$else(
                $task(function(flow) {
                    _this.syncCallManagerForSyncKey(callManager, syncKey);
                    flow.complete();
                })
            )
        ]).execute(function(error) {
                if (!error) {
                    callback(null, result);
                } else {
                    callback(error);
                }
            });
    },

    /**
     * @param {CallManager} callManager
     * @param {string} syncKey
     * @param {Object} syncObject
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    setSyncObject: function(callManager, syncKey, syncObject, options, callback) {
        var _this = this;
        var newSyncObject = null;
        $series([
            $task(function(flow) {
                _this.updateOrCreateSyncObject(syncKey, syncObject, function(error, _newSyncObject) {
                    if (!error) {
                        newSyncObject = _newSyncObject;
                    } else {
                        flow.error(error);
                    }
                });
            }),
            $task(function(flow) {
                this.syncCache.set(syncKey, newSyncObject.data, {}, function(exception) {
                    //TODO BRN: What should we do if there was an exception?
                    flow.complete(exception);
                });
            })
        ]).execute(function(error) {
                if (!error) {
                    callback(null, result);
                } else {
                    callback(error);
                }
            });
    },

    /**
     * @param {CallManager} callManager
     * @param {string} syncKey
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    syncSyncObject: function(callManager, syncKey, options, callback) {

    },

    /**
     * @param {CallManager} callManager
     * @param {string} syncKey
     * @param {} options
     * @param {function(Exception, Object} callback
     */
    unsyncSyncObject: function(callManager, syncKey, options, callback) {

    },



    //-------------------------------------------------------------------------------
    // Private Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     */
    initialize: function() {
        this.syncCache.on(SyncCacheEvent.DELETE, this.hearSyncCacheDelete, this);
        this.syncCache.on(SyncCacheEvent.SET, this.hearSyncCacheSet, this);
        this.bugCallServer.on(BugCallServerEvent.CALL_CLOSED, this.hearBugCallServerCallClosed, this);
    },

    /**
     * @private
     * @param {string} syncKey
     * @param {function(Error, SyncObject)} callback
     */
    loadSyncObject: function(syncKey, callback) {
        this.syncObjectManager.findSyncObjectBySyncKey(syncKey, function(error, syncObject) {
            if (!error) {
                if (syncObject) {
                    callback(null, syncObject);
                } else {
                    callback(new SyncException(SyncException.NO_SUCH_OBJECT));
                }
            } else {
                callback(error);
            }
        });
    },

    /**
     * @private
     * @param {string} syncKey
     * @param {function(Error)} callback
     */
    removeSyncObject: function(syncKey, callback) {
        this.syncObjectManager.removeSyncObjectBySyncKey(syncKey, callback);
    },

    /**
     * @private
     * @param {CallManager} callManager
     * @param {string} syncKey
     */
    syncCallManagerForSyncKey: function(callManager, syncKey) {
        this.callService.registerCallManagerForSyncKey(syncKey, callManager)
    },

    /**
     * @private
     * @param {CallManager} callManager
     */
    unsyncCallManager: function(callManager) {
        var _this = this;
        var syncKeySet = this.callService.get(callManager);
        if (syncKeySet) {
            syncKeySet.forEach(function(syncKey) {
                _this.unsyncCallManagerForSyncKey(callManager, syncKey);
            });
        }
    },

    /**
     * @private
     * @param {CallManager} callManager
     * @param {string} syncKey
     * @param {function(Error) callback
        */
    unsyncCallManagerForSyncKey: function(callManager, syncKey) {
        this.callService.deregisterCallManagerForSyncKey(syncKey, callManager);
        if (!this.callService.hasSyncKey(syncKey)) {
            this.syncCache.unsync(syncKey, function(error) {
                if (error) {
                    //TODO BRN: What do we do if this fails?
                    console.error(error);
                }
            });
        }
    },

    /**
     * @param {string} syncKey
     * @param {Object} syncObject
     * @param {function(Error, syncObject)} callback
     */
    updateOrCreateSyncObject: function(syncKey, syncObject, callback) {
        this.syncObjectManager.updateOrCreateSyncObject(syncKey, syncObject, callback);
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
    },

    /**
     * @private
     * @param {SyncCacheEvent} syncCacheEvent
     */
    hearSyncCacheDelete: function(syncCacheEvent) {
        var _this           = this;
        var syncKey         = syncCacheEvent.getKey();
        var callManagerSet  = this.callService.getCallManagerSetBySyncKey(syncKey);
        //TODO BRN: Rewrite this using bugflow

        callManagerSet.forEach(function(callManager) {
            _this.unsyncCallManagerForSyncKey(callManager, syncKey);
            _this.bugCallServer.request(SyncObjectService.RequstTypes.DELETE, {syncKey: syncKey}, function(error, callResponse) {

                if (!error) {
                    //TEST
                    console.log("Delete syncKey callResponse:", callResponse);
                    if (callResponse.getType() === "deleteResponse") {

                    } else if (callResponse.getType() == "deleteError") {

                    }
                } else {
                    //TODO BRN: What to do if there was an error?
                    console.error(error);
                }
            });
        });
    },

    /**
     * @private
     * @param {SyncCacheEvent} syncCacheEvent
     */
    hearSyncCacheSet: function(syncCacheEvent) {
        var key     = syncCacheEvent.getKey();
        var data    = syncCacheEvent.getData();
        //TODO BRN: implement
    }
});


SyncObjectService.RequstTypes = {
    DELETE: "delete",
    SET: "set"
};


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('syncbugserver.SyncObjectService', SyncObjectService);
