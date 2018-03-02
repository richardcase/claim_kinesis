var uuidv4 = require('uuid/v4');

module.exports = {
  'CreateClaim': cmd => ({
    isValid: () => cmd.payload && cmd.payload.accountid && cmd.payload.rewardtype,
    aggregate: 'claim',
    event: meta => ({
      id: String(uuidv4()),
      ...meta,
      eventType: 'ClaimCreated',
      payload: {
        claimid: String(uuidv4()),
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
    event: meta => ({
      id: String(uuidv4()),
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
