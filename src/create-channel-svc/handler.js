'use strict';

const slack_api = require('../common/slack_api')
const CreateChannelSvc = require('./create-channel').CreateChannelSvc
const sns_handler = require('../common/sns_handler')

const snsPublisher = new sns_handler.SnsPublisher();

const on_msg = (event, context, callback) => {
    const handler = new CreateChannelSvc(slack_client());
    sns_handler.dispatch_filter(event, 'create-channel', handler, []).then(events => {
        return snsPublisher.publish_events(events)
    }).then(() => {
        const response = {
            statusCode: 200,
            body: 'OK',
        };
        callback(null, response);
    });
};

const slack_client = () => {
    return new slack_api.Client(process.env.TARGET_TEAM_TOKEN);
}

module.exports = {
    on_msg
}