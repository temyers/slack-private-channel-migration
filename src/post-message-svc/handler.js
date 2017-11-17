 'use strict';

 const slack_api = require('../common/slack_api')
 const PostMessageSvc = require('./post-message').PostMessageSvc
 const PostFileSvc = require('./post-file').PostFileSvc
 const SnsPublisher = require('../common/sns_handler').SnsPublisher
 const base64 = require('base-64');

 const throttle = (data) => {
    return data
 }

 const on_msg = (event, context, callback) => {
     let parsedEvent = {}
     console.log(JSON.stringify(event.Records));
     try {
         parsedEvent = JSON.parse(base64.decode(event.Records[0].kinesis.data));
         console.log(`${JSON.stringify(parsedEvent)}`)
     } catch (e) {
         console.log(`Error is ${e}`)
         context.succeed();
         callback(null, "failure");
         return;
     }

     var sns = new SnsPublisher();
     var slackClient = slack_client();
     const handler = parsedEvent.body.subtype == "file_share" && parsedEvent.body.file.url_private_download ? new PostFileSvc(slackClient) :
         new PostMessageSvc(slackClient);

     return handler.event_received(parsedEvent).then(events => {
         return sns.publish_events(events)
     }).then(throttle).then(() => {
         context.succeed();
         callback(null, {});
     }).catch(error => {
       console.log(`Failed to post message: ${JSON.stringify(parsedEvent)}. Error: ${error} `)
       callback(null, 'failure');
     });
 };

 const slack_client = () => {
     return new slack_api.Client(process.env.TARGET_TEAM_TOKEN);
 }

 module.exports = {
     on_msg
 }
