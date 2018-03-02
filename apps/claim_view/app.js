'use strict';

var kcl = require('aws-kcl');
var util = require('util');
var mongoose = require('mongoose');
var logger = require('../../utils/logger');
var Claim = require('../../models/claim');

var mongodbConnectString = 'mongodb://localhost:27017/rewards';

function recordProcessor() {
  var log = logger().getLogger('claimview');
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

        var event = JSON.parse(data);
        var query = Claim.findOne({ 'claimid': event.aggregateId });

        query.exec(function (err, claim) {
          if (err)  {
            log.error(util.format('Error quering for claim %s', err));
            return err
          }

          if (!claim) {
            log.debug(util.format('No claim found so creating new claim: %s', event.aggregateId));
            claim = new Claim();
          } else {
            log.debug(util.format('Claim found %s', event.aggregateId));
          }
          log.debug(util.format('Applying event %s with id %s to claim %s',event.eventType, event.id, event.aggregateId));
          claim.applyEvent(event);

          log.debug(util.format('About to save claim %s', event.aggregateId));
          claim.save();
          log.debug(util.format('Saved claim %s', event.aggregateId));

        });
      }
      if (!sequenceNumber) {
        completeCallback();
        return;
      }
      //TODO: checkpoint needs to be handled above
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
