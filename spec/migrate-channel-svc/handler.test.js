'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const bluebird = require("bluebird");

const handler = require('../../src/migrate-channel-svc/handler')
const MigrateChannelSvc = require('../../src/migrate-channel-svc/migrate-channel').MigrateChannelSvc

const sns_handler = require('../../src/common/sns_handler')

const slack_api = require('../../src/common/slack_api')
const test_data = require('../support/test_data')
const createEvent = test_data.createEvent
const stubMessages = test_data.stubMessages

// stub APIs
const StubSlackClient = require('../common/slack_api_stub').Client

describe('migrate-channel-svc handler', () => {

    let sandbox = {}
    let mockDispatchFilter = {}
    let mockSnsPublisher = {}
    let fakeEvent = "fakeEvent"
    let fakeEventList = [{}]

    afterEach(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        this.event_received = createEvent('sns/migrate-channel.json')
        sandbox = sinon.sandbox.create();
        mockDispatchFilter = sinon.sandbox.stub(sns_handler, 'dispatch_filter')

        mockDispatchFilter.returns(Promise.resolve(fakeEventList));

        sinon.sandbox.stub(sns_handler, 'sns_topic_arn').returns(fakeEvent);
        mockSnsPublisher = sinon.sandbox.stub(sns_handler.SnsPublisher.prototype, 'publish_events').callsFake(() => {
            return {}
        })
    });

    it('should retrieve topic arn and publish events', (done) => {
        const lambda_callback = (error, response) => {
            expect(mockSnsPublisher.firstCall.args[0]).to.equal(fakeEventList)

            if (error) {
                done.fail(error)
            } else {
                done()
            }
        }

        handler.on_msg(this.event_received, undefined, lambda_callback)
    })

    it('should call dispatch_filter with MigrateChannelSvc', (done) => {
        const lambda_callback = (error, response) => {
            expect(mockDispatchFilter.firstCall.args[1]).to.equal("migrate-channel")
            expect(mockDispatchFilter.firstCall.args[2] instanceof MigrateChannelSvc).to.equal(true)

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
