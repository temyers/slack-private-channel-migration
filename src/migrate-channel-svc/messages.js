'use strict';

// Functions that manipulate messages, and arrays of messages

const oldest = (t1,t2) => {

  return Math.min(t1,t2).toString()
}

// Takes an array of messages
// returns the timestamp of the oldest message
const oldest_timestamp = (messages) => {
  return messages.map(message => message.ts).reduce(oldest)
}

module.exports = {
  oldest,
  oldest_timestamp
}
