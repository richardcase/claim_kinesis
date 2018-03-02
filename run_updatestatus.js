process.env.NODE_LOG_DIR = './logs';

var Producer = require('./producer');

var updateStatus = {
    id: "8af7966c-ac88-4013-894c-2e106ee66760",
    command: 'UpdateClaimStatus',
    payload: {
      claimid: "e41211bb-28b0-41e5-8203-a5abfd1b09a1", //UPDATE before running.
      status: "APPROVED"
    }
};

var producer = new Producer();

producer.send('rewards-commands-poc', JSON.stringify(updateStatus), updateStatus.id,  function(err, response) {
  if (err) {
    console.error(err);
  } else {
    console.log('Sent command');
    console.log(response);
  }
});
