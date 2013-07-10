//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('LockManager')

//@Require('Class')
//@Require('Lock')
//@Require('LockStriped')
//@Require('Map')
//@Require('Obj')
//@Require('bugflow.BugFlow')
//@Require('synccache.SyncCacheDefines')
//@Require('synccacheserver.CacheException')
//@Require('synccacheserver.LockMonitor')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class               = bugpack.require('Class');
var Lock                = bugpack.require('Lock');
var LockStriped         = bugpack.require('LockStriped');
var Map                 = bugpack.require('Map');
var Obj                 = bugpack.require('Obj');
var BugFlow             = bugpack.require('bugflow.BugFlow');
var SyncCacheDefines        = bugpack.require('synccache.SyncCacheDefines');
var CacheException      = bugpack.require('synccacheserver.CacheException');
var LockMonitor         = bugpack.require('synccacheserver.LockMonitor');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $parallel       = BugFlow.$parallel;
var $series         = BugFlow.$series;
var $task           = BugFlow.$task;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var LockManager = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     *
     */
    _constructor: function() {

        this._super();

        //-------------------------------------------------------------------------------
        // Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {Set.<LockMonitor>}
         */
        this.lockToLockMonitorMap   = new Map();

        /**
         * @private
         * @type {LockStriped}
         */
        this.readLockStriped        = new LockStriped(1000);

        /**
         * @private
         * @type {Semaphore}
         */
        this.writeLockStriped       = new LockStriped(1000);
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {EventDispatcher} target
     * @param {string} key
     * @param {SyncCacheDefines.LockType} type
     * @param {function((Exception | Error), Object} callback
     */
    acquireMonitoredLock: function(target, key, type, callback) {

        // First we must acquire the lock
        // Then we listen for call drops
        // Also start listening for the lock to release
        // If the callmanager drops before the lock is released, we need to unlock the lock
        // when the lock releases, then we need to remove the listeners

        var _this = this;
        if (!SyncCacheDefines.LockType[type]) {
            callback(new Error("Unknown lock type '" + type + "'"));
        } else {
            $parallel([
                $task(function(flow) {
                    if (type === SyncCacheDefines.READ || type === SyncCacheDefines.READ_WRITE) {
                        _this.acquireMonitoredReadLock(target, key, function(error) {
                            flow.complete(error);
                        });
                    } else {
                        flow.complete();
                    }
                }),
                $task(function(flow) {
                    if (type === SyncCacheDefines.WRITE || type === SyncCacheDefines.READ_WRITE) {
                        _this.acquireMonitoredWriteLock(target, key, function(error) {
                            flow.complete(error);
                        });
                    } else {
                        flow.complete();
                    }
                })
            ]).executeFlow(callback);
        }
    },

    /**
     * @param {string} key
     * @param {SyncCacheDefines.LockType} type
     * @param {function((Exception | Error), Object} callback
     */
    acquireUnmonitoredLock: function(key, type, callback) {
        var _this = this;
        if (!SyncCacheDefines.LockType[type]) {
            callback(new Error("Unknown lock type '" + type + "'"));
        } else {
            $parallel([
                $task(function(flow) {
                    if (type === SyncCacheDefines.READ || type === SyncCacheDefines.READ_WRITE) {
                        _this.acquireReadLock(key, function() {
                            flow.complete();
                        });
                    } else {
                        flow.complete();
                    }
                }),
                $task(function(flow) {
                    if (type === SyncCacheDefines.WRITE || type === SyncCacheDefines.READ_WRITE) {
                        _this.acquireWriteLock(key, function() {
                            flow.complete();
                        });
                    } else {
                        flow.complete();
                    }
                })
            ]).executeFlow(callback);
        }
    },


    //-------------------------------------------------------------------------------
    // Private Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {EventDispatcher} target
     * @param {*} key
     * @param {function(Error)} callback
     */
    acquireMonitoredReadLock: function(target, key, callback) {
        var _this = this;
        var readLock = null;
        $series([
            $task(function(flow) {
                _this.acquireReadLock(key, function(_readLock) {
                    readLock = _readLock;
                    flow.complete();
                });
            }),
            $task(function(flow) {
                _this.generateLockMonitor(target, readLock);
                flow.complete();
            })
        ]).executeFlow(callback);
    },

    /**
     * @private
     * @param {EventDispatcher} target
     * @param {*} key
     * @param {function(Error)} callback
     */
    acquireMonitoredWriteLock: function(target, key, callback) {
        var _this = this;
        var writeLock = null;
        $series([
            $task(function(flow) {
                _this.acquireWriteLock(key, function(_writeLock) {
                    writeLock = _writeLock;
                    flow.complete();
                });
            }),
            $task(function(flow) {
                _this.generateLockMonitor(target, writeLock);
                flow.complete();
            })
        ]).executeFlow(callback);
    },

    /**
     * @private
     * @param {*} key
     * @param {function(Lock)} callback
     */
    acquireReadLock: function(key, callback) {
        var readLock = this.readLockStriped.getForKey(key);
        readLock.tryLock(function() {
            callback(readLock);
        });
    },

    /**
     * @private
     * @param {*} key
     * @param {function(Lock)} callback
     */
    acquireWriteLock: function(key, callback) {
        var writeLock = this.writeLockStriped.getForKey(key);
        writeLock.tryLock(function() {
            callback(writeLock);
        });
    },

    /**
     * @private
     * @param {EventDispatcher} target
     * @param {Lock} lock
     */
    generateLockMonitor: function(target, lock) {
        var lockMonitor = new LockMonitor(target, lock);
        lockMonitor.initialize();
        if (!this.lockToLockMonitorMap.containsKey(lock)) {
            this.lockToLockMonitorMap.put(lock, lockMonitor);
            lock.on(Lock.EventTypes.RELEASED, this.hearLockReleased, this);
        } else {
            throw new Error("lock monitor already assigned for this lock. This should not happen!");
        }
    },


    //-------------------------------------------------------------------------------
    // Event Listeners
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {Event} event
     */
    hearLockReleased: function(event) {
        var lockMonitor = this.lockToLockMonitorMap.remove(event.getTarget());
        lockMonitor.deinitialize();
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.LockManager', LockManager);
