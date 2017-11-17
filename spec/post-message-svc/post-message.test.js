'use strict';

const chai = require('chai');
const expect = chai.expect;

const Service = require('../../src/post-message-svc/post-message').PostMessageSvc
const StubSlackClient = require('../common/slack_api_stub').Client
const test_data = require('../support/test_data')

describe('post-message svc', () => {

    beforeEach(() => {
        this.slack_stub = new StubSlackClient();
        this.svc = new Service(this.slack_stub);
        this.simple_message = test_data.createEvent('journey/migrate-private-test/02_migrate-message.json')
        this.slack_stub.chat().post_message_stub(test_data.stubMessages('chat/post-response/message-posted.json'))
        this.result=this.svc.event_received(this.simple_message)
    })

    it('should return the promise of an Array', callback => {
        this.result.then(events_returned => {
            expect(events_returned).to.be.an('array')
            callback()
        }).catch(callback.fail);
    })

    it('should post a message', callback => {
        this.result.then(events_returned => {

            const message = this.slack_stub.chat().post_message_spy()
            expect(message).is.not.undefined
            expect(message.text).is.equal(this.simple_message.body.text)
            expect(message.user).is.equal(this.simple_message.body.user)
        }).then(callback).catch(callback.fail)

    })

    it('should return a single event', (callback) => {
        this.result.then((events_returned) => {
            expect(events_returned.length).to.equal(1)
        }).then(callback).catch(callback.fail)
    })

    it('should return a message-posted event', done => {
      this.result.then(events_returned => {
        expect(events_returned[0].event).to.equal('message-posted')
        expect(events_returned[0]).to.deep.equal(test_data.createEvent('journey/migrate-private-test/05_message-posted.json'))
      }).then(done).catch(done.fail)
    })

});
