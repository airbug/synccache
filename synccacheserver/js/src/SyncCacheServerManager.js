//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('SyncCacheServerManager')

//@Require('Class')
//@Require('Map')
//@Require('Obj')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class   = bugpack.require('Class');
var Map     = bugpack.require('Map');
var Obj     = bugpack.require('Obj');


//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

var SyncCacheServerManager = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function() {

        this._super();

        //-------------------------------------------------------------------------------
        // Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {Map.<string, *>}
         */
        this.syncCacheMap  = new Map();
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} cacheKey
     * @return {(* | undefined)}
     */
    findCacheByCacheKey: function(cacheKey) {
        return this.syncCacheMap.get(cacheKey);
    },

    /**
     * @param {string} cacheKey
     * @return {*}
     */
    removeCacheByCacheKey: function(cacheKey) {
        return this.syncCacheMap.remove(cacheKey);
    },

    /**
     * @param {string} cacheKey
     * @param {*} cache
     * @return {(* | undefined)}
     */
    createOrUpdateCache: function(cacheKey, cache) {
        return this.syncCacheMap.put(cacheKey, cache);
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.SyncCacheServerManager', SyncCacheServerManager);
