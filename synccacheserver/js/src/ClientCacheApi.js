//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('ClientCacheApi')

//@Require('Class')
//@Require('Obj')
//@Require('bugatomic.BugAtomic')
//@Require('bugatomic.LockOperator')
//@Require('bugflow.BugFlow'))


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class               = bugpack.require('Class');
var Obj                 = bugpack.require('Obj');
var BugAtomic           = bugpack.require('bugatomic.BugAtomic');
var BugFlow             = bugpack.require('bugflow.BugFlow');
var LockOperator        = bugpack.require('bugatomic.LockOperator');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $iterableParallel    = BugFlow.$iterableParallel;


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var ClientCacheApi = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function(consumerManager) {

        this._super();


        //-------------------------------------------------------------------------------
        // Declare Variables
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {BugAtomic}
         */
        this.bugAtomic          = new BugAtomic(new LockOperator(1000));

        /**
         * @private
         * @type {ConsumerManager}
         */
        this.consumerManager    = consumerManager;
    },


    //-------------------------------------------------------------------------------
    // Public Class Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} key
     * @param {function(Error)} callback
     */
    delete: function(key, callback) {

        // NOTE BRN: Create a copy of the call manager set so that it does not
        // change underneath us while this call is queued.

        var consumerSet = this.consumerManager.getConsumerSetByCacheKey(key).clone();
        this.bugAtomic.operation(key, "delete", ["write"], false, function(operation) {
            $iterableParallel(consumerSet, function(flow, consumer) {
                consumer.delete(key, function(error) {
                    flow.callback(error);
                });
            }).execute(function(error) {
                operation.complete();
                callback(error);
            });
        });
    },

    /**
     * @param {string} key
     * @param {*} value
     * @param {function(Error)} callback
     */
    set: function(key, value, callback) {

        // NOTE BRN: Create a copy of the call manager set so that it does not
        // change underneath us while this call is queued.

        var consumerSet = this.consumerManager.getConsumerSetByCacheKey(key).clone();
        this.bugAtomic.operation(key, "set", ["write"], false, function(operation) {
            $iterableParallel(consumerSet, function(flow, consumer) {
                consumer.set(key, function(error) {
                    flow.callback(error);
                });
            }).execute(function(error) {
                operation.complete();
                callback(error);
            });
        });
    }
});

//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheclient.ClientCacheApi', ClientCacheApi);
