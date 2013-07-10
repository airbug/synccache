//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheclient')

//@Export('ClientCacheController')

//@Require('Class')
//@Require('Obj')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class   = bugpack.require('Class');
var Obj     = bugpack.require('Obj');


//-------------------------------------------------------------------------------
// Declare Class
//-------------------------------------------------------------------------------

var ClientCacheController = Class.extend(Obj, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function(bugCallRouter, clientCacheService) {

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
         * @type {ClientCacheService}
         */
        this.clientCacheService   = clientCacheService;
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     *
     */
    configure: function(callback){
        var _this = this;
        this.bugCallRouter.addAll({
            delete: function(request, responder) {
                var data    = request.getData();
                var key     = data.key;
                _this.clientCacheService.delete(key, function(error) {
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data        = {key: key};
                        response    = responder.response("deleteResponse", data);
                    } else {
                        data        = {
                            key: key,
                            error: error
                        };
                        response    = responder.response("deleteError", data);
                    }
                    responder.sendResponse(response);
                });
            },
            set: function(request, responder) {
                var data    = request.getData();
                var key     = data.key;
                var value   = data.value;
                _this.clientCacheService.set(key, value, function(error) {
                    var data        = null;
                    var response    = null;
                    if (!error) {
                        data = {key: key};
                        response    = responder.response("setResponse", data);
                    } else {
                        data        = {
                            key: key,
                            error: error
                        };
                        response    = responder.response("setError", data);
                    }
                    responder.sendResponse(response);
                });
            }
        });

        callback();
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheclient.ClientCacheController', ClientCacheController);
