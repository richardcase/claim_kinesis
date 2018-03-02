'use strict';

var kcl = require('aws-kcl');
var util = require('util');
var logger = require('./utils/logger');
var DB = require('./DB.js')
var Producer = require('./producer');
var commands = require('./commands');

var mongodbConnectString = 'mongodb://localhost:27017';
var mongoDbName = 'rewards';
//var mongodbCollection = 'commands';
var database = new DB();
var producer = new Producer();


var logDir = process.env.NODE_LOG_DIR !== undefined ? process.env.NODE_LOG_DIR : '.';
var logfile = logDir + '/' + 'command_processor.log';

function recordProcessor() {
  var log = logger(logfile).getLogger('recordProcessor');
  log.debug(util.format('Using node version: %s', process.version));
  var shardId;

  return {

    initialize: function (initializeInput, completeCallback) {
      shardId = initializeInput.shardId;

      log.debug(util.format('About to connect to %s.', mongodbConnectString));
      database.connect(mongodbConnectString, mongoDbName, function(err) {
        if (err) {
          log.error(util.format('There was an error connecting to mongo: %s', err));
        }
        completeCallback();
      })
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
        if (!command.isValid()) {
          log.error(util.format('Invalid command: %s', cmd));
        } else {
          const meta = {}
          let event = command.event(meta);
          log.info(util.format('Event: %s', event));

          producer.send('rewards-events-poc', JSON.stringify(event), event.payload.claimid,  function(err, response) {
            if (err) {
              log.error(util.format('error sending event: %s', err));
              //TODO: handle checkpoint properly
            } else {
              log.debug(util.format('Event %s sent. SharId %s, SequnceNumber %s ', event.id, response.ShareId, response.SequenceNumber ));
              //TODO: handle checkpoint properly
            }
          });
        }

        /*
        var objectToStore = {}
        try {

        } catch (err) {
          // Looks like it wasn't JSON so store the raw string
          objectToStore.payload = data;
        }
        objectToStore.metaData = {};
        objectToStore.metaData.mongoLabel = "Added by consumer";

        log.debug(util.format('About to save document'));
        database.addDocument(mongodbCollection, objectToStore, function(err) {
          if (err) {
            log.error(util.format('There was an error saving document %s', err));
          } else {
            log.debug('Document saved');
          }
        });*/

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
