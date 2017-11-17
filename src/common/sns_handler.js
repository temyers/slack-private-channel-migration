'use strict'
const AWS = require('aws-sdk');
const bluebird = require("bluebird");

class SnsPublisher {
    constructor() {
    }

    publish_event(event,topicArn) {

        this.sns = new AWS.SNS();

        var event_topic = topicArn || process.env['RAPIDS_TOPIC']

        var params = {
            Message: JSON.stringify(event),
            Subject: event.event,
            TargetArn: event_topic
        };

        this.sns.publish(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                throw err;
            } else {
                console.log(data); // successful response
            }
        });

    }

    publish_events(events, topicArn) {
        events.forEach(event => {
            this.publish_event(event,topicArn)
        })

    }

}

const subject_match = (event, subject) => {
    return event.Records.find(event => {
        return event.Sns.Subject == subject;
    })
}

// Extract the event from an SNS record
const event_message = (sns_record) => {
    console.log(sns_record.Sns.Message)
    return JSON.parse(sns_record.Sns.Message)
}

// filters SNS events for the given `subject`
// If the SNS event corresponds to the desired subject, the event message is forwarded on to the destination.event_received method
// Otherwise, the default_response is returned.
// @param destination - service with an event_received method
const dispatch_filter = (event, subject, destination, default_response) => {

    const sns_event = subject_match(event, subject);
    if (sns_event) {
        return destination.event_received(event_message(sns_event))
    } else {
        return new Promise((accept, reject) => {
            return accept(default_response)
        });
    }

}

const sns_topic_arn = (event) => {
    return event.Records[0].Sns.TopicArn
}

module.exports = {
    dispatch_filter,
    event_message,
    sns_topic_arn,
    SnsPublisher
}
