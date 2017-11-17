'use strict';

const slack_api = require('../common/slack_api')
const messages_functions = require('./messages')
const MigrateChannelSvc = require('./migrate-channel').MigrateChannelSvc
const sns_handler = require('../common/sns_handler')


const snsPublisher = new sns_handler.SnsPublisher();

const on_msg = (event, context, callback) => {
    const handler = new MigrateChannelSvc(slack_client());
    sns_handler.dispatch_filter(event, 'migrate-channel', handler, []).then(events => {
        return snsPublisher.publish_events(events)
    }).then(() => {
        const response = {
            statusCode: 200,
            body: 'OK',
        };
        callback(null, response);
    }).catch(callback);

};

const slack_client = () => {
    return new slack_api.Client(process.env.SOURCE_TEAM_TOKEN);
}

module.exports = {
    on_msg
}
