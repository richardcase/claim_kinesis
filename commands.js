var uuidv4 = require('uuid/v4');

module.exports = {
  'CreateClaim': cmd => ({
    isValid: () => cmd.payload && cmd.payload.accountid && cmd.payload.rewardtype,
    aggregate: 'claim',
    aggregateMustExist: false,
    event: meta => ({
      id: String(uuidv4()),
      ...meta,
      eventType: 'ClaimCreated',
      aggregateType: this.aggregate,
      aggregateId: String(uuidv4()),
      payload: {
        accountid: cmd.payload.accountid,
        rewardtype: cmd.payload.rewardtype,
        rewardid: cmd.payload.rewardid,
        status: 'pending'
      },
      parentid: cmd.id
    })
  }),
  'UpdateClaimStatus': cmd => ({
    isValid: () => cmd.payload && cmd.payload.status && cmd.payload.claimid,
    aggregate: 'claim',
    aggregateMustExist: true,
    event: meta => ({
      id: String(uuidv4()),
      aggregateType: this.aggregate,
      aggregateId: cmd.payload.claimid,
      ...meta,
      eventType: 'ClaimStatusChanged',
      payload: {
        claimid: cmd.payload.claimid,
        status: cmd.payload.status
      },
      parent: cmd.id
    })
  })
}
