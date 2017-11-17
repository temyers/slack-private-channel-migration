'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const AWS = require('aws-sdk-mock');

const sns_handler = require('../../src/common/sns_handler')
const slack_api = require('../../src/common/slack_api')

describe('sns_handler', () => {

    let sandbox = {}
    let snsPublishParams = {}
    process.env['RAPIDS_TOPIC'] = "1"

    beforeAll(() => {
        this.sns_publisher = new sns_handler.SnsPublisher();
    });

    beforeEach(() => {
        snsPublishParams = []
        AWS.mock('SNS', 'publish', function(params, callback) {
            snsPublishParams = params
            callback(null, {});
        });
    });

    afterEach(function() {
        AWS.restore('SNS', 'publish');
    })


    describe('#public_events', ()=>{
      describe('when passed the SNS topic to publish to', () => {
        it('should send the event to the topicArn specified', (done) => {
          let topicArn = "testTopic"
          this.sns_publisher.publish_event({
            event: "migrate-channel"
          }, topicArn)
          expect(snsPublishParams.TargetArn).to.equal(topicArn)
          done()
        })
      })

      describe('when using default destination', () => {

        it('should send the event to the RAPIDS topic', (done) => {
          this.sns_publisher.publish_event({
            event: "migrate-channel"
          })
          expect(snsPublishParams.TargetArn).to.equal(process.env['RAPIDS_TOPIC'])
          done()
        })

      })
    })

});
