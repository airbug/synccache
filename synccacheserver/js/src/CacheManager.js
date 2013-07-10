//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheserver')

//@Export('CacheManager')

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

var CacheManager = Class.extend(Obj, {

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
    getCache: function(cacheKey) {
        return this.syncCacheMap.get(cacheKey);
    },

    /**
     * @param {string} cacheKey
     * @return {boolean}
     */
    hasCache: function(cacheKey) {
        return this.syncCacheMap.containsKey(cacheKey);
    },

    /**
     * @param {string} cacheKey
     * @return {*}
     */
    removeCache: function(cacheKey) {
        return this.syncCacheMap.remove(cacheKey);
    },

    /**
     * @param {string} cacheKey
     * @param {*} cache
     * @return {(* | undefined)}
     */
    putCache: function(cacheKey, cache) {
        return this.syncCacheMap.put(cacheKey, cache);
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheserver.CacheManager', CacheManager);
