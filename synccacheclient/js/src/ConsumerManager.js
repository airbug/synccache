//-------------------------------------------------------------------------------
// Annotations
//-------------------------------------------------------------------------------

//@Package('synccacheclient')

//@Export('ConsumerManager')

//@Require('Class')
//@Require('EventReceiver')
//@Require('HashUtil')
//@Require('List')
//@Require('Map')
//@Require('bugcall.BugCallClient')
//@Require('bugcall.CallClient')
//@Require('bugcall.CallEvent')
//@Require('bugcall.CallManager')
//@Require('bugflow.BugFlow')
//@Require('socketio:client.SocketIoClient')
//@Require('socketio:client.SocketIoConfig')
//@Require('synccacheclient.ServerCacheConsumer')


//-------------------------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------------------------

var bugpack = require('bugpack').context();


//-------------------------------------------------------------------------------
// BugPack
//-------------------------------------------------------------------------------

var Class                       = bugpack.require('Class');
var EventReceiver               = bugpack.require('EventReceiver');
var HashUtil                    = bugpack.require('HashUtil');
var List                        = bugpack.require('List');
var Map                         = bugpack.require('Map');
var BugCallClient               = bugpack.require('bugcall.BugCallClient');
var CallClient                  = bugpack.require('bugcall.CallClient');
var CallEvent                   = bugpack.require('bugcall.CallEvent');
var CallManager                 = bugpack.require('bugcall.CallManager');
var BugFlow                     = bugpack.require('bugflow.BugFlow');
var SocketIoClient              = bugpack.require('socketio:client.SocketIoClient');
var SocketIoConfig              = bugpack.require('socketio:client.SocketIoConfig');
var ServerCacheConsumer         = bugpack.require('synccacheclient.ServerCacheConsumer');


//-------------------------------------------------------------------------------
// Simplify References
//-------------------------------------------------------------------------------

var $forEachParallel = BugFlow.$forEachParallel;


//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

var ConsumerManager = Class.extend(EventReceiver, {

    //-------------------------------------------------------------------------------
    // Constructor
    //-------------------------------------------------------------------------------

    _constructor: function(config, cacheManager, serverSocketIoFactory) {

        this._super();

        //-------------------------------------------------------------------------------
        // Instance Properties
        //-------------------------------------------------------------------------------

        /**
         * @private
         * @type {CacheManager}
         */
        this.cacheManager               = cacheManager;

        /**
         * @private
         * @type {{
         *     syncCacheIps: Array.<string>
         * }}
         */
        this.config                     = config;

        /**
         * @private
         * @type {List.<string>}
         */
        this.ipList                     = new List();

        /**
         * @private
         * @type {Map.<string, ServerCacheConsumer>}
         */
        this.ipToServerCacheConsumerMap = new Map();

        /**
         * @private
         * @type {ServerSocketIoFactory}
         */
        this.serverSocketIoFactory      = serverSocketIoFactory;
    },


    //-------------------------------------------------------------------------------
    // Public Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @param {string} key
     * @return {*}
     */
    getConsumerForKey: function(key) {
        var ip = this.hashKeyToIp(key);
        return this.ipToServerCacheConsumerMap.get(ip);
    },

    /**
     * @param {function(Error)} callback
     */
    initialize: function(callback) {
        var _this = this;
        if (this.config && this.config.syncCacheIps) {
            this.config.syncCacheIps.forEach(function(ip) {
                var consumer = _this.createConsumer(ip);

                //TODO BRN: Pass any connection data here

                consumer.openConnection();
            });
            callback();
        } else {
            callback(new Error("No sync cache server ips were specified in the config"));
        }
    },


    //-------------------------------------------------------------------------------
    // Private Instance Methods
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {string} ip
     */
    createConsumer: function(ip) {
        if (this.ipToServerCacheConsumerMap.containsKey(ip)) {
            var socketIoConfig = new SocketIoConfig({
                port: 80,
                host: ip,
                resource: "/api/socket"
            });
            var socketIoClient = new SocketIoClient(this.serverSocketIoFactory, socketIoConfig);
            var callClient = new CallClient(socketIoClient);
            var callManager = new CallManager();
            var bugCallClient = new BugCallClient(callClient, callManager);
            var serverCacheConsumer = new ServerCacheConsumer(bugCallClient, this.cacheManager);

            // NOTE BRN: We add this as an event propagator to the client so that the BugCallRouter can listen to
            // this manager as the source of INCOMING_REQUEST events

            serverCacheConsumer.addEventPropagator(this);
            //serverCacheConsumer.addEventListener(CallEvent.CLOSED, this.hearCallClosed, this);
            serverCacheConsumer.addEventListener(CallEvent.OPENED, this.hearCallOpened, this);
            this.ipToServerCacheConsumerMap.put(ip, serverCacheConsumer);
            this.ipList.add(ip);
        } else {
            throw new Error("ConsumerManager already has client for ip address '" + ip + "'");
        }
    },

    /**
     * @private
     * @param {string} key
     * @return {string}
     */
    hashKeyToIp: function(key) {
        //TODO BRN: Need to run a test on the distribution probability across the ips using this hash algorithm.
        var hash = HashUtil.hash(key);
        var ipCount = this.ipList.getCount();
        var index = hash % ipCount;
        return this.ipList.getAt(index);
    },


    //-------------------------------------------------------------------------------
    // Event Listeners
    //-------------------------------------------------------------------------------

    /**
     * @private
     * @param {CallEvent} event
     */
    /*hearCallClosed: function(event) {
        //TODO BRN: If a call drops with a server, then the server will stop syncing all keys with that particular call
        // If the call is re-established, we need to re-send a 'syncAll' request to each client
    },*/

    /**
     * @private
     * @param {CallEvent} event
     */
    hearCallOpened: function(event) {
        /** @type {ServerCacheConsumer} */
        var consumer = event.getCurrentTarget();
        /** @type {Collection.<string>} */
        var keys = this.cacheManager.getSyncKeysForConsumer(consumer);
        consumer.syncAll(keys.getValueArray(), {}, function(exception) {
            console.error(exception);
            //TODO BRN: What to do if an exception occurs?
        });
    }
});


//-------------------------------------------------------------------------------
// Exports
//-------------------------------------------------------------------------------

bugpack.export('synccacheclient.ConsumerManager', ConsumerManager);
