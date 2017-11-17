'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const bluebird = require("bluebird");

const handler = require('../../src/migrate-message-svc/handler')
const MigrateMessageSvc = require('../../src/migrate-message-svc/migrate-message').MigrateMessageSvc

const sns_handler = require('../../src/common/sns_handler')

const slack_api = require('../../src/common/slack_api')
const test_data = require('../support/test_data')
const createEvent = test_data.createEvent
const stubMessages = test_data.stubMessages

// stub APIs
const StubSlackClient = require('../common/slack_api_stub').Client

describe('migrate-message-svc handler', () => {

    let sandbox = {}
    let mockDispatchFilter = {}
    let mockSnsPublisher = {}
    let fakeEvent = "fakeEvent"
    let fakeEventList = "string"

    afterEach(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        this.event_received = createEvent('sns/migrate-message.json')
        sandbox = sinon.sandbox.create();
        mockDispatchFilter = sinon.sandbox.stub(sns_handler, 'dispatch_filter')

        mockDispatchFilter.returns(Promise.resolve(fakeEventList));

        sinon.sandbox.stub(sns_handler, 'sns_topic_arn').returns(fakeEvent);
        mockSnsPublisher = sinon.sandbox.stub(sns_handler.SnsPublisher.prototype, 'publish_events').callsFake(() => {
            return {}
        })
    });

    it('should convert the single event returned to array before passing it to SnsPublisher', (done) => {
        const lambda_callback = (error, response) => {
            expect(mockSnsPublisher.firstCall.args[0]).to.deep.equal([fakeEventList])

            if (error) {
                done.fail(error)
            } else {
                done()
            }
        }

        handler.on_msg(this.event_received, undefined, lambda_callback)
    })

    it('should call dispatch_filter with MigrateMessageSvc', (done) => {
        const lambda_callback = (error, response) => {
            expect(mockDispatchFilter.firstCall.args[1]).to.equal("migrate-message")
            expect(mockDispatchFilter.firstCall.args[2] instanceof MigrateMessageSvc).to.equal(true)

            if (error) {
                done.fail(error)
            } else {
                done()
            }
        }

        handler.on_msg(this.event_received, undefined, lambda_callback)
    })

    it('should callback with error on failure', done => {

      const expected_error = new Error('boom')
      sandbox.restore();
      sandbox = sinon.sandbox.create();
      mockDispatchFilter = sinon.sandbox.stub(sns_handler, 'dispatch_filter')
      mockDispatchFilter.returns(Promise.resolve(fakeEventList));
      sinon.sandbox.stub(sns_handler, 'sns_topic_arn').throws(expected_error);
      mockSnsPublisher = sinon.sandbox.stub(sns_handler.SnsPublisher.prototype, 'publish_events').throws(expected_error)

      handler.on_msg(this.event_received, undefined, (error,response) => {
        expect(error).to.equal(expected_error)
        done()
      })
    })

});
