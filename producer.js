var AWS = require('aws-sdk');
var uuidv4 = require('uuid/v4');


if (!AWS.config.region) {
    AWS.config.update({
      region: 'eu-west-1'
    });
}


var kinesis = new AWS.Kinesis();

var createClaim = {
    "claimid": new uuidv4(),
    "accountid": "874849",
    "rewardType": "TOY"
};

kinesis.putRecord({
    StreamName: 'rewards-commands-poc',
    Data: JSON.stringify(createClaim),
    PartitionKey: String(createClaim.claimid)
}, function(err, data) {
    if (err) {
        console.error(err);
    }
    console.log(data);
})
