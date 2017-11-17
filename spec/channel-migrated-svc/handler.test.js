'use strict';
// 3rd-party deps
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const AWS = require('aws-sdk-mock');

// my deps
const test_data = require('../support/test_data')
const createEvent = test_data.createEvent
const stubMessages = test_data.stubMessages
const handler = require('../../src/channel-migrated-svc/handler')

// stubbed services
const ChannelMigratedSvc = require('../../src/channel-migrated-svc/channel-migrated').ChannelMigratedSvc
const SnsPublisher = require('../../src/common/sns_handler').SnsPublisher
const KinesisPublisher = require('../../src/common/kinesis_client').KinesisPublisher

const {ChannelMigratedSvcStub,SnsPublisherStub,KinesisPublisherStub} = require('../support/stubs')

const success_callback = (done, checks) => {
    return (error, response) => {
        if (error) {
            done.fail(error)
        } else {
            if (checks) {
                checks()
            }

            expect(response).to.deep.equal({
                statusCode: 200,
                body: 'OK',
            })

            done()
        }
    }
}

describe('channel-migrated-svc handler', () => {

    let sandbox = {}

    afterEach(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub()
        this.channel_migrated_stub = new ChannelMigratedSvcStub(sandbox)
        this.sns_publisher_stub = new SnsPublisherStub(sandbox)
        this.kinesis_publisher_stub = new KinesisPublisherStub(sandbox)

    });

    describe('#on_msg', () => {
        beforeEach(() => {
            this.event_received = createEvent('sns/channel-migrated.json')
            this.event_json = createEvent('journey/migrate-private-test/03_channel-migrated.json')
        })

        it('receives channel-migrated events from SNS', done => {
            handler.on_msg(this.event_received, undefined, success_callback(done))
        })

        it('should callback with error on failure', done => {

            const expected_error = new Error('boom')
            this.channel_migrated_stub.will_throw(expected_error)

            handler.on_msg(this.event_received, undefined, (error, response) => {
                expect(error).to.equal(expected_error)
                done()
            })
        })

        it('invokes ChannelMigratedSvc.event_received with the channel-migrated event', done => {
            const lambda_callback = success_callback(done, () => {
                expect(this.channel_migrated_stub.was_called).to.equal(true)
                expect(this.channel_migrated_stub.eventParams).to.deep.equal(this.event_json)
            })
            handler.on_msg(this.event_received, undefined, lambda_callback)
        })

        describe('when ChannelMigratedSvc generates no events', () => {
            beforeEach(() => {
                this.channel_migrated_stub.generated_events = []
            })

            it('should send [] to kinesis', done => {
                const lambda_callback = success_callback(done, () => {
                    expect(this.kinesis_publisher_stub.was_called).to.equal(true)
                    expect(this.kinesis_publisher_stub.events_received).to.deep.equal([])
                })
                handler.on_msg(this.event_received, undefined, lambda_callback)
            })

            it('should send [] to SNS', done => {
                const lambda_callback = success_callback(done, () => {
                    expect(this.sns_publisher_stub.was_called).to.equal(true)
                    expect(this.sns_publisher_stub.events_received).to.deep.equal([])
                })
                handler.on_msg(this.event_received, undefined, lambda_callback)
            })

        })

        describe('when ChannelMigratedSvc generates 02_migrate-message events', () => {
            beforeEach(() => {
                this.channel_migrated_stub.generated_events = [
                    createEvent('journey/migrate-private-test/02_migrate-message.json'),
                    createEvent('journey/migrate-private-test/02_migrate-message_snippet.json'),
                ]
            })

            it('should forward the migrate-message events to kinesis', done => {
                const lambda_callback = success_callback(done, () => {
                    expect(this.kinesis_publisher_stub.was_called).to.equal(true)
                    expect(this.kinesis_publisher_stub.events_received.length).to.equal(2)
                    expect(this.kinesis_publisher_stub.events_received).to.deep.equal(this.channel_migrated_stub.generated_events)
                })
                handler.on_msg(this.event_received, undefined, lambda_callback)
            })

            it('should not forward the migrate-message events to SNS', done => {
                const lambda_callback = success_callback(done, () => {
                    expect(this.sns_publisher_stub.was_called).to.equal(true)
                    expect(this.sns_publisher_stub.events_received).to.deep.equal([])
                })
                handler.on_msg(this.event_received, undefined, lambda_callback)
            })

        })
        describe('when ChannelMigratedSvc generates channel-migrated events', () => {

            beforeEach(() => {
                this.channel_migrated_stub.generated_events = [
                    createEvent('journey/migrate-private-test/02_migrate-message.json'),
                    createEvent('journey/migrate-private-test/02_migrate-message_snippet.json'),
                    createEvent('journey/migrate-private-test/03_channel-migrated_with_lastkey.json'),
                ]
            })

            it('should forward the channel-migrated events to SNS', done => {
                const expected_sns_events = [createEvent('journey/migrate-private-test/03_channel-migrated_with_lastkey.json')]

                const lambda_callback = success_callback(done, () => {
                    expect(this.sns_publisher_stub.was_called).to.equal(true)
                    expect(this.sns_publisher_stub.events_received).to.deep.equal(expected_sns_events)
                })
                handler.on_msg(this.event_received, undefined, lambda_callback)
            })

            it('should not forward the channel-migrated events to kinesis', done => {
                const expected_kenisis_events = [createEvent('journey/migrate-private-test/02_migrate-message.json'),
                    createEvent('journey/migrate-private-test/02_migrate-message_snippet.json')
                ]

                const lambda_callback = success_callback(done, () => {
                    expect(this.kinesis_publisher_stub.was_called).to.equal(true)
                    expect(this.kinesis_publisher_stub.events_received).to.deep.equal(expected_kenisis_events)
                })
                handler.on_msg(this.event_received, undefined, lambda_callback)
            })

        })


    })


})
