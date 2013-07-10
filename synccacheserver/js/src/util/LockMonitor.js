//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('LockMonitor')

//@Require('Class')
//@Require('Lock')
//@Require('Obj')
//@Require('bugcall.CallEvent')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class       = bugpack.require('Class');
var Lock        = bugpack.require('Lock');
var Obj         = bugpack.require('Obj');
var CallEvent   = bugpack.require('bugcall.CallEvent');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var LockMonitor = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    /**
     * @param {EventDispatcher} target
     * @param {Lock} lock
     */
    _constructor: function(target, lock) {

        this._super();

        //-------------------------------------------------------------------------------
        // Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {EventDispatcher}
         */
        this.target     = target;

        /**
         * @private
         * @type {Lock}
         */
        this.lock       = lock;
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     *
     */
    deinitialize: function() {
        this.target.off(CallEvent.CLOSED, this.hearCallClosed, this);
    },

    /**
     *
     */
    initialize: function() {

        // First we must acquire the lock
        // Then we listen to the CallManager call drops
        // Also start listening for the lock to release
        // If the callmanager drops before the lock is released, we need to unlock the lock
        // when the lock releases, then we need to remove the listeners

        this.target.on(CallEvent.CLOSED, this.hearCallClosed, this);
    },


    //-------------------------------------------------------------------------------
    // Event Listeners
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {CallEvent} event
     */
    hearCallClosed: function(event) {
        this.lock.unlock();
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.LockMonitor', LockMonitor);
