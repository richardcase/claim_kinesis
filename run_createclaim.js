process.env.NODE_LOG_DIR = './logs';

var Producer = require('./producer');

var createClaim = {
    id: "e13672e9-c690-4292-a0b3-827454dd3ca1",
    command: 'CreateClaim',
    payload: {
      accountid: "12345678",
      rewardtype: "TOY",
      rewardid: "YAKOV"
    }
};

var producer = new Producer();

producer.send('rewards-commands-poc', JSON.stringify(createClaim), createClaim.id,  function(err, response) {
  if (err) {
    console.error(err);
  } else {
    console.log('Sent command');
    console.log(response);
  }
});
