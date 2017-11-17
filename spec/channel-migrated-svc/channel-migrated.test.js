'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const test_data = require('../support/test_data')
const ChannelMigratedSvc = require('../../src/channel-migrated-svc/channel-migrated').ChannelMigratedSvc
const DataStore = require('./data-store-stub')
const createEvent = test_data.createEvent
const stubMessages = test_data.stubMessages
const AWS = require('aws-sdk-mock');

const create_dynamodb_row = require('../../src/common/data-store').create_dynamodb_row

describe('channel-migrated-svc', () => {
    beforeAll(done => {

        this.data_store_stub = new DataStore()
        this.svc = new ChannelMigratedSvc(this.data_store_stub)
        done()
    })

    it('has a dependency on data store', () => {
        expect(this.svc.data_store).to.equal(this.data_store_stub)
    })


    describe('#event_received', () => {

        beforeEach(done => {
            this.data_store_stub.will_return('all_results.json')
            this.generated_events = this.svc.event_received(createEvent('journey/migrate-private-test/03_channel-migrated.json'));
            done()
        })

        afterEach(function() {})

        it('should return the promise of an Array', done => {
            this.generated_events.then(res => {
                expect(res).to.be.an.instanceOf(Array)
                done()
            }).catch(done.fail)
        })

        it('should return migrate-message events', done => {
            this.generated_events.then(result => {
                expect(result).to.deep.include(
                  {
                    "event": "migrate-message",
                    "body": {
                      "channel": "private-test",
                      "text": "message 43",
                      "type": "message",
                      "user": "U00000001",
                      "ts": "43"
                    }
                  })
                done()
            }).catch(e => {
                done.fail(e)
            })

        })

        it('shoud query the datastore using the channel specified in the event', done => {
            this.generated_events.then(result => {
                let channel_to_query = this.data_store_stub.getQueryParams().channel_name;
                expect(channel_to_query).to.equal(createEvent('journey/migrate-private-test/02_migrate-message.json').body.channel)
                done()
            }).catch(e => {
                done.fail(e)
            })
        })

        it('should return one event per message returned', done => {
            this.generated_events = this.svc.event_received(createEvent('journey/migrate-private-test/03_channel-migrated.json'));

            this.generated_events.then(result => {
                expect(result.length).to.equal(50)
                done()
            }).catch(e => {
                done.fail(e)
            })
        })

        describe('dynamodb results are paged', () => {
            beforeEach(done => {
                this.data_store_stub.will_return('paged_results.json')
                this.generated_events = this.svc.event_received(createEvent('journey/migrate-private-test/03_channel-migrated.json'));
                done()
            })

            it('should return a channel-migrated event', done => {
                this.generated_events.then(results => {
                    expect(results.filter(event => event.event == 'channel-migrated').length).to.equal(1)
                    done()
                }).catch(done.fail)
            })

            it('should return the last-key in the channel-migrated event', done => {
              this.generated_events.then(results => {
                return results.filter(event => event.event == 'channel-migrated').pop()
              }).then(channel_migrated_event => {
                  expect(channel_migrated_event.body.last_key).not.to.be.undefined
                  expect(channel_migrated_event.body.last_key).to.deep.equal({"channel": "private-test","timestamp": 48})

                  expect(channel_migrated_event).to.deep.equal(createEvent('journey/migrate-private-test/03_channel-migrated_with_lastkey.json'))
              }).then(done).catch(done.fail)
            })
        })

        describe('channel-migrated event contains last-key', () => {
          beforeEach(() => {
              this.generated_events = this.svc.event_received(createEvent('journey/migrate-private-test/03_channel-migrated_with_lastkey.json'));
          })

            it('should query using the page key', () => {
              console.log(this.data_store_stub.getQueryParams().last_key)
              console.log({
                "channel": "private-test",
                "timestamp": 48
              })
              expect(this.data_store_stub.getQueryParams().last_key).to.deep.equal({
                channel: "private-test",
                timestamp: 48
              })
            })
        })




    })
})
