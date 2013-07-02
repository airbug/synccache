//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Require('synccacheserver.SyncCacheServerApplication')


//-------------------------------------------------------------------------------
// Requires
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context(module);


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var SyncCacheServerApplication = bugpack.require('synccacheserver.SyncCacheServerApplication');


//-------------------------------------------------------------------------------
// Script
//-------------------------------------------------------------------------------

var syncCacheServerApplication = new SyncCacheServerApplication();
syncCacheServerApplication.start(function(error) {
    console.log("Starting sync cache server...");
    if (!error){
        console.log("Sync cache server successfully started");
    } else {
        console.error(error);
        console.error(error.stack);
        process.exit(1);
    }
});
