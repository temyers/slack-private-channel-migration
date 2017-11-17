'use strict';

class CreatePrivateChannel {

    destination_exists(event) {
        return this.svc.slack_client.group_exists(this.target(event))
    }

    constructor(svc) {
        this.svc = svc
    }

    channel_created_event(name, team) {
        return {
            "event": "channel-created",
            "body": {
                "group_name": name,
                "team": team
            }
        }
    }

    target(event) {
        return event.body.group_name
    }

    create_destination(event) {
        this.svc.slack_client.create_group(this.target(event))
    }

    create(event) {
        return this.destination_exists(event).then(result => {
            if (!result) {
                this.create_destination(event)
                return [this.channel_created_event(this.target(event), this.svc.target_team(event))]
            }
        })
    }

}

class CreatePublicChannel {
    constructor(svc) {
        this.svc = svc
    }

    destination_exists(event) {
        console.log("Checking destination_exists")
        return this.svc.slack_client.channel_exists(this.target(event))
    }

    channel_created_event(name, team) {
        return {
            "event": "channel-created",
            "body": {
                "channel_name": name,
                "team": team
            }
        }

    }
    target(event) {
        return event.body.channel_name
    }

    create_destination(event) {
        this.svc.slack_client.create_channel(this.target(event))
    }

    create(event) {
        return this.destination_exists(event).then(result => {
            if (!result) {
                this.create_destination(event)
                return [this.channel_created_event(this.target(event), this.svc.target_team(event))]
            }
        })
    }

}

class CreateChannelSvc {
    constructor(slack_client) {
        this.slack_client = slack_client
    }

    target_team(event) {
        return event.body.team
    }

    is_private_dest(event) {
        return event.body.group_name != undefined && event.body.channel_name == undefined
    }

    event_received(event) {

        if (this.is_private_dest(event)) {
            return new CreatePrivateChannel(this).create(event)
        } else {
            return new CreatePublicChannel(this).create(event)
        }
    }
}

module.exports = {
    CreateChannelSvc
}