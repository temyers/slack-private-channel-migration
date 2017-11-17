'use strict';

const {SnsPublisher, event_message} = require('../common/sns_handler')

const on_msg = (event, context, callback) => {

  const snsPublisher = new SnsPublisher()

  const event_topic_mapper = {
      "migrate-channel": process.env['MIGRATE_CHANNEL_TOPIC'],
      "migrate-event": process.env['MIGRATE_EVENT_TOPIC'],
      "migrate-message": process.env['MIGRATE_MESSAGE_TOPIC'],
      "channel-migrated": process.env['CHANNEL_MIGRATED_TOPIC'],
      "create-channel": process.env['CREATE_CHANNEL_TOPIC'],


  }

  var parsed_event = event_message(event.Records[0])
  var event_topic = event_topic_mapper[parsed_event.event]
  if (!event_topic) {
      console.log(`No topic destination defined for event type: ${parsed_event.event}`)
      callback()
  }else{

    snsPublisher.publish_event(parsed_event, event_topic)
    callback();
  }
};

module.exports = {
    on_msg
}
