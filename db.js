var MongoClient = require('mongodb').MongoClient;
// var assert = require('assert');
var logger = require('./utils/logger');
var util = require('util');

function DB() {
    this.db = "empty";
    this.log = logger().getLogger('mongo-db');
}

DB.prototype.connect = function(uri, dbName, callback) {
    this.log.debug(util.format('About to connect to %s', uri));
    if (this.db != "empty") {
        callback();
        this.log.debug('Already connected to database.');
    } else {
        var _this = this;
        MongoClient.connect(uri, function(err, client) {
            if (err) {
                _this.log.error(util.format('Error connecting to DB: %s', err.message));
                callback(err);
            } else {
                _this.db = client.db(dbName);
                _this.log.debug(util.format('Connected to database: %s.', dbName));

                _this.log.debug('About to call callback');
                callback();
            }
        })
    }
}

DB.prototype.close = function(callback) {
    this.log.info('Closing database');
    this.db.close();
    this.log.info('Closed database');
    callback();
}

DB.prototype.addDocument = function(coll, doc, callback) {
    var collection = this.db.collection(coll);
    var _this = this;
    collection.insertOne(doc, function(err, result) {
    if (err) {
            _this.log.info(util.format('Error inserting document: %s', err.message));
            callback(err.message);
        } else {
            _this.log.info(util.format('Inserted document into %s collection. With result %s', coll, result));
            callback();
        }
  });
};

module.exports = DB;
