'use strict';

var kcl = require('aws-kcl');
var util = require('util');
var mongoose = require('mongoose');
var logger = require('../../utils/logger');
var Producer = require('../../producer');
var commands = require('../../commands');

var mongodbConnectString = 'mongodb://localhost:27017/rewards';
var producer = new Producer();

function recordProcessor() {
  var log = logger().getLogger('commandprocessor');
  log.debug(util.format('Using node version: %s', process.version));
  var shardId;

  return {

    initialize: function (initializeInput, completeCallback) {
      shardId = initializeInput.shardId;

      log.debug(util.format('About to connect to %s.', mongodbConnectString));
      mongoose.connect(mongodbConnectString,null, function(err) {
        if (err) {
          log.error(util.format('There was an error connecting to mongo: %s', err));
        } else {
          log.debug('Connected to mongo');
        }
        completeCallback();
      });
    },

    processRecords: function (processRecordsInput, completeCallback) {
      if (!processRecordsInput || !processRecordsInput.records) {
        completeCallback();
        return;
      }
      var records = processRecordsInput.records;
      var record, data, sequenceNumber, partitionKey;
      for (var i = 0; i < records.length; i++) {
        record = records[i];
        data = new Buffer(record.data, 'base64').toString();
        sequenceNumber = record.sequenceNumber;
        partitionKey = record.partitionKey;
        log.debug(util.format('ShardID: %s, Record: %s, SeqenceNumber: %s, PartitionKey:%s', shardId, data, sequenceNumber, partitionKey));

        var cmd = JSON.parse(data);
        let command = commands[cmd.command](cmd);

        //TODO: depending on command type query the current
        if (!command.isValid()) {
          log.error(util.format('Invalid command: %s', cmd));
        } else {
          const meta = {}
          let event = command.event(meta);
          log.info(util.format('Event: %s', event));

          let key = event.aggregateType + "-" + event.aggregateId;
          producer.send('rewards-events-poc', JSON.stringify(event), key,  function(err, response) {
            if (err) {
              log.error(util.format('error sending event: %s', err));
              //TODO: handle checkpoint properly
            } else {
              log.debug(util.format('Event %s sent. SharId %s, SequnceNumber %s ', event.id, response.ShareId, response.SequenceNumber ));
              //TODO: handle checkpoint properly
            }
          });
        }

      }
      if (!sequenceNumber) {
        completeCallback();
        return;
      }
      processRecordsInput.checkpointer.checkpoint(sequenceNumber, function (err, sequenceNumber) {
        log.debug(util.format('Checkpoint successful. ShardID: %s, SeqenceNumber: %s', shardId, sequenceNumber));
        completeCallback();
      });
    },

    shutdownRequested: function (shutdownRequestedInput, completeCallback) {
      shutdownRequestedInput.checkpointer.checkpoint(function (err) {
        if (err) {
          log.error(util.format('There was an error checkpointing: %s', err));
        }
        completeCallback();
      });
    },

    shutdown: function (shutdownInput, completeCallback) {
      if (shutdownInput.reason !== 'TERMINATE') {
        completeCallback();
        return;
      }
      // Whenever checkpointing, completeCallback should only be invoked once checkpoint is complete.
      shutdownInput.checkpointer.checkpoint(function (err) {
        if (err) {
          log.error(util.format('There was an error checkpointing: %s', err));
        }
        completeCallback();
      });
    }
  };
}

kcl(recordProcessor()).run();
