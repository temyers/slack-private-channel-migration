'use strict';

const messages = require('./messages')

const read_messages = (channel_name, ts) => {
    return slack_client().channel(channel_name).messages(ts);
}

const create_channel_event = (channel_name) => {
    return {
        "event": "create-channel",
        "body": {
            "group_name": channel_name
        }
    }
}

const migrate_channel_event = (event_msg, oldest_ts) => {
    if (oldest_ts) {
        var copy = merge_object(event_msg, {
            body: {
                ts: oldest_ts
            }
        });
        return copy
    }
    return event_msg;
}

const channel_migrated_event = (dest) => {
    return {
        "event": "channel-migrated",
        "body": {
            "channel_name": dest
        }
    }
}

const merge_object = (object, to_merge) => {
    var copy = JSON.parse(JSON.stringify(object));
    Object.keys(to_merge).forEach(property => {
        if (copy[property] instanceof Object) {
            copy[property] = merge_object(copy[property], to_merge[property])
        } else {
            copy[property] = to_merge[property]
        }
    })
    return copy
}

class MigrateChannelSvc {
    constructor(slack_client) {
        this.slack_client = slack_client
    }

    event_received(event_msg) {
        let migrate_message_event = (message) => {
            message.channel = event_msg.body.channel_to
            return {
                "event": "migrate-message",
                "body": message
            }
        }

        return this.read_messages(event_msg.body.group_from, event_msg.body.ts).then(result => {
            var more_events = []
            if (result.has_more) {
                const oldest_ts = messages.oldest_timestamp(result.messages)
                more_events = [migrate_channel_event(event_msg, oldest_ts)]
            } else {
                more_events = [channel_migrated_event(event_msg.body.channel_to)]
            }

            return result.messages.map(migrate_message_event).concat(more_events)

        })
    };

    read_messages(channel_name, ts) {
        return this.slack_client.channel(channel_name).messages(ts);
    }
}

module.exports = {
    MigrateChannelSvc
}
