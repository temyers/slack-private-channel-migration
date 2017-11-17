'use strict';

class ChannelMigratedSvc {
    constructor(data_store) {
        this.data_store = data_store
    }

    event_received(event) {

        return this.data_store.query(event.body.channel_name,event.body.last_key).then((result) => {

            let events = result.messages.map(item => item.event)

            if (result.last_key) {
                events.push({
                    "event": "channel-migrated",
                    "body": {
                      channel_name: event.body.channel_name,
                      last_key: result.last_key
                    }
                })
            }

            return events;
        })

    }
}

module.exports = {
    ChannelMigratedSvc
}
