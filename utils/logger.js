/***
Copyright 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Amazon Software License (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at
http://aws.amazon.com/asl/
or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
***/

'use strict';

var log4js = require('log4js');

function logger() {
  var logDir = process.env.NODE_LOG_DIR !== undefined ? process.env.NODE_LOG_DIR : '.';

  log4js.configure({
    appenders: { file: { type: 'file', filename: logDir + '/' + 'application.log' } },
    categories: { default: { appenders: ['file'], level: 'trace' } }
  });

  return {
    getLogger: function (category) {
      return log4js.getLogger(category);
    }
  };
}

module.exports = logger;
