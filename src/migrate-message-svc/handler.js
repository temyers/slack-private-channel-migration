'use strict';

const slack_api = require('../common/slack_api')
const MigrateMessageSvc = require('./migrate-message').MigrateMessageSvc
const dispatch_filter = require('../common/sns_handler').dispatch_filter
const sns_handler = require('../common/sns_handler')

const snsPublisher = new sns_handler.SnsPublisher();

const on_msg = (event, context, callback) => {
    const handler = new MigrateMessageSvc(slack_client());

    sns_handler.dispatch_filter(event, 'migrate-message', handler, []).then(events => {
        return snsPublisher.publish_events([events])
    }).then(() => {
        const response = {
            statusCode: 200,
            body: 'OK',
        };
        callback(null, response);
    }).catch(callback)

};

const slack_client = () => {
    return new slack_api.Client(process.env.TARGET_TEAM_TOKEN);
}

module.exports = {
    on_msg
}
