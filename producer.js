var AWS = require('aws-sdk');
var logger = require('./utils/logger');
var util = require('util');

if (!AWS.config.region) {
  AWS.config.update({
    region: 'eu-west-1'
  });
}

function Producer() {
  this.kinesis = new AWS.Kinesis();
  this.log = logger().getLogger('kinesis-producer');
}

Producer.prototype.send = function (streamName, data, key, callback) {
  this.log.debug(util.format('Sending message to kinesis stream %s with key %s', streamName, key));
  var _this = this;
  this.kinesis.putRecord({
    StreamName: streamName,
    Data: data,
    PartitionKey: key
  }, function (err, response) {
    if (err) {
      _this.log.error(util.format('error sending to kinesis: %s', err));
      callback(err, null);
    } else {
      _this.log.debug(util.format('Sent message to kinesis stream %s with key %s. ShardId %s SequenceNumber', streamName, key, response.ShardId, response.SequenceNumber));
      callback(null, response);
    }
  });
};

module.exports = Producer;
