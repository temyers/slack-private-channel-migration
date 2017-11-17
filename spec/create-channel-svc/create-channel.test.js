'use strict'

const chai = require('chai');
const expect = chai.expect;

const Service = require('../../src/create-channel-svc/create-channel').CreateChannelSvc
const StubSlackClient = require('../common/slack_api_stub').Client
const test_data = require('../support/test_data')

describe('CreateChannelSvc', () => {
    beforeAll(() => {
        this.slack_stub = new StubSlackClient()
        this.svc = new Service(this.slack_stub)
    })
    describe('when destination channel does not exist', () => {

        beforeEach(() => {
            this.slack_stub.channel_exists_returns(false)
            this.slack_stub.group_exists_returns(false)
        });

        describe('when migrating to a private channel', () => {

            beforeEach(() => {
                this.event_received = test_data.createEvent('create-channel.json')
                this.generated_events = this.svc.event_received(this.event_received);
            });

            it('should return a promise of an message', (callback) => {
                this.generated_events.then(result => {
                    // A channel created event
                    expect(result).to.be.an.instanceOf(Object)
                    callback()
                }).catch(e => {
                    callback.fail(e)
                })
            })

            it('should call the slack API to create the private channel', (callback) => {
                this.generated_events.then(result => {
                    expect(this.slack_stub.create_group_spy()).to.equal(this.event_received.body["group_name"])
                    callback()
                }).catch(e => {
                    callback.fail(e)
                })

            });

            it('should return a channel-created event', (callback) => {
                this.generated_events.then(result => {
                    expect(result).to.deep.include.members([test_data.createEvent('group-created.json')])
                    callback()
                }).catch(e => {
                    callback.fail(e)
                })
            })

            // TODO handle failure.

        })

        describe('when migrating to a public channel', () => {

            beforeEach(() => {
                this.event_received = test_data.createEvent('create-public-channel.json')
                this.generated_events = this.svc.event_received(this.event_received);
            });


            it('should call the slack API to create the public channel', (callback) => {
                this.generated_events.then(result => {
                    expect(this.slack_stub.create_channel_spy()).to.equal(this.event_received.body.channel_name)
                    callback()
                }).catch(e => {
                    callback.fail(e)
                })

            });

            it('should return a channel-created event', (callback) => {
                this.generated_events.then(result => {
                    expect(result).to.deep.include.members([test_data.createEvent('channel-created.json')])
                    callback()
                }).catch(e => {
                    callback.fail(e)
                })
            })

            // TODO handle failure.

        });
    })

    describe('when destination channel exists', () => {
        beforeEach(() => {
            this.slack_stub.channel_exists_returns(true)
            this.generated_events = this.svc.event_received(this.event_received);
        });

        it('should not generate a channel-created event', (callback) => {
            this.generated_events.then(result => {
                expect(result).to.be.empty
                callback()
            }).catch(e => {
                callback.fail(e)
            })
        });
    })
});
