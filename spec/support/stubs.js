'use strict'

const ChannelMigratedSvc = require('../../src/channel-migrated-svc/channel-migrated').ChannelMigratedSvc
const SnsPublisher = require('../../src/common/sns_handler').SnsPublisher
const KinesisPublisher = require('../../src/common/kinesis_client').KinesisPublisher

class ChannelMigratedSvcStub {

    constructor(sandbox) {
        this.generated_events = []
        this.was_called = false
        this.eventParams = {}

        sandbox.stub(ChannelMigratedSvc.prototype, 'event_received').callsFake((params) => {
            this.eventParams = params
            this.was_called = true
                // classCalled = "ChannelMigratedSvc"
            return new Promise((resolve, reject) => {
                if (this.error) {
                    throw this.error
                }
                resolve(this.generated_events)
            })
        })

    }

    will_throw(error) {
        this.error = error;
        return this;
    }
}

class SnsPublisherStub {

    constructor(sandbox) {
        this.events_received = []
        this.was_called = false

        sandbox.stub(SnsPublisher.prototype, 'publish_event').callsFake((params,topicArn) => {

            this.events_received.push(params)
            this.topicArn=topicArn
            this.was_called = true
        })
        sandbox.stub(SnsPublisher.prototype, 'publish_events').callsFake((params,topicArn) => {
            this.events_received = this.events_received.concat(params)
            this.topicArn=topicArn
            this.was_called = true
        })


    }
}

class KinesisPublisherStub {

    constructor(sandbox) {
        this.events_received = []
        this.was_called = false

        sandbox.stub(KinesisPublisher.prototype, 'publish_events').callsFake((params) => {
            this.events_received = this.events_received.concat(params)
            this.was_called = true
        })


    }
}

module.exports = {
  KinesisPublisherStub,
  SnsPublisherStub,
  ChannelMigratedSvcStub
}
