const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ClaimSchema = new Schema({
  claimid: { type: String },
  accounid: { type: String },
  rewardtype: { type: String },
  rewardid: { type: String },
  status: { type: String },
  createdAt  : { type : Date, default : Date.now },
  modifiedAt  : { type : Date, default : Date.now },
  version: { type: Number }
});

ClaimSchema.methods.applyEvent = function(event) {
  switch(event.eventType) {
    case 'ClaimCreated':
      this.claimid = event.aggregateId;
      this.accounid = event.payload.accountid;
      this.rewardtype = event.payload.rewardtype;
      this.rewardid = event.payload.rewardid;
      this.status = event.payload.status;
      this.version = 1;
      break;
    case 'ClaimStatusChanged':
      this.status = event.payload.status;
      this.version = this.version + 1;
  }
};

module.exports = mongoose.model('Claim', ClaimSchema);
