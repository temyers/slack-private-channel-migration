'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const bluebird = require("bluebird");

const test_data = require('../support/test_data')
const Service = require('../../src/migrate-channel-svc/migrate-channel').MigrateChannelSvc
const StubSlackClient = require('../common/slack_api_stub').Client
const createEvent = test_data.createEvent
const stubMessages = test_data.stubMessages

describe('MigrateChannelSvc', () => {

    beforeAll(() => {
        this.slack_stub = new StubSlackClient()
        this.svc = new Service(this.slack_stub)
    })


    beforeEach(() => {
        this.slack_stub.channel().has_messages(stubMessages('events/journey/migrate-private-test/slack-messages/messages.json'))

    });

    describe('#event_received', ()=> {
      describe('when migrate-channel event contains a timestamp', () => {

        var ts_received;
        beforeEach(() => {
          this.event_received = createEvent('migrate-channel_with_ts.json')

          this.slack_stub.channel().has_messages(stubMessages('events/journey/migrate-private-test/slack-messages/more-messages-avail.json'))

          this.generated_events = this.svc.event_received(this.event_received);
        });

        it('should call slack with the timestamp', (callback) => {
          this.generated_events.then(() => {
            const ts_received = this.slack_stub.channel().messages_spy()
            expect(ts_received).not.to.be.undefined
            expect(ts_received).to.equal(this.event_received.body.ts)
            callback()
          }).catch(e => callback.fail(e))
        })
      })

      describe('when migrate-channel event received', () => {

          beforeEach(() => {
            this.event_received = createEvent('journey/migrate-private-test/01_migrate-channel.json')
          });

          describe('when there are messages returned from the source channel', () => {
            beforeEach(() => {

              this.stubMessages = stubMessages('events/journey/migrate-private-test/slack-messages/messages.json')
              this.slack_stub.channel().has_messages(this.stubMessages)
              this.generated_events = this.svc.event_received(this.event_received);
            })

            it('should create a migrate-message event for each message in the source channel', (callback) => {
              let filter_by_type = (events) => {
                return events.filter(evt => evt.event == 'migrate-message')
              }

              this.generated_events.then(filter_by_type).then(result => {
                expect(result.length).to.equal(this.stubMessages.messages.length)
                callback()
              }).catch(e => {
                callback.fail(e)
              })
            });

            it('should migrate simple messages', callback => {
              this.generated_events.then(result => {
                expect(result).to.deep.include(createEvent('journey/migrate-private-test/02_migrate-message.json'))
                callback()
              }).catch(e => {
                callback.fail(e)
              })
            })

            it('should migrate snippets', callback => {
              this.generated_events.then(result => {
                expect(result).to.deep.include(createEvent('journey/migrate-private-test/02_migrate-message_snippet.json'))
                callback()
              }).catch(e => {
                callback.fail(e)
              })
            })
          });

          describe('when there are older messages available in the source channel', () => {

            beforeEach(() => {
              this.slack_stub.channel().has_messages(stubMessages('events/journey/migrate-private-test/slack-messages/more-messages-avail.json'))
              this.generated_events = this.svc.event_received(this.event_received);
            });

            it('should return a promise of an Array', (callback) => {
              this.generated_events.then(result => {
                expect(result).to.be.an.instanceOf(Array)
                callback()
              }).catch(e => {
                callback.fail(e)
              })
            })

            it('should create a migrate-channel event timestamp of the oldest message returned', (callback) => {
              let filter_by_type = (events) => {
                return events.filter(evt => evt.event == 'migrate-channel')
              }
              this.generated_events.then(filter_by_type).then(result => {
                expect(result.length).to.equal(1)
                expect(result[0].body.ts).not.to.be.undefined
                expect(result[0].body.ts).to.equal("1500363683.084036")
                expect(result[0].body.channel_to).to.equal("private-test")
                return callback()
              }).catch(e => {
                callback.fail(e)
              })
            });
          });

          describe('when the oldest message has been returned from source channel', () => {
            beforeEach(() => {

              this.stubMessages = stubMessages('events/journey/migrate-private-test/slack-messages/messages.json')
              this.slack_stub.channel().has_messages(this.stubMessages)
              this.generated_events = this.svc.event_received(this.event_received);
            })

            it('should create a channel-migrated to indicate no more result to be processed', (callback) => {
              let filter_by_type = (events) => {
                return events.filter(evt => evt.event == 'channel-migrated')
              }

              this.generated_events.then(filter_by_type).then(result => {
                expect(result.length).to.equal(1)
                callback()
              }).catch(e => {
                callback.fail(e)
              })
            });

            it('should have a channel-migrated with the correct channel name', (callback) => {
              let filter_by_type = (events) => {
                return events.filter(evt => evt.event == 'channel-migrated')
              }
              let expected_event = createEvent('journey/migrate-private-test/03_channel-migrated.json')

              this.generated_events.then(filter_by_type).then(result => {
                expect(result[0]).to.deep.equal(expected_event)
                callback()
              }).catch(e => {
                callback.fail(e)
              })
            })


            it('should not create a migrate-channel event', (callback) => {
              let filter_by_type = (events) => {
                return events.filter(evt => evt.event == 'migrate-channel')
              }
              this.generated_events.then(filter_by_type).then(result => {
                expect(result.length).to.equal(0)
                callback()
              }).catch(e => {
                callback.fail(e)
              })
            });


          })

          describe('when subset of messages available are returned(2)', () => {

            beforeEach(() => {
              this.slack_stub.channel().has_messages(stubMessages('events/journey/migrate-private-test/slack-messages/more-messages-avail2.json'))
              this.generated_events = this.svc.event_received(this.event_received);
            });

            it('should create a migrate-channel event timestamp of the oldest message returned', (callback) => {
              let filter_by_type = (events) => {
                return events.filter(evt => evt.event == 'migrate-channel')
              }
              this.generated_events.then(filter_by_type).then(result => {
                expect(result.length).to.equal(1)
                expect(result[0].body.ts).not.to.be.undefined
                expect(result[0].body.ts).to.equal("1500363732.099444")
                callback()
              }).catch(e => {
                callback.fail(e)
              })
            });
          });

        });

    })


});
