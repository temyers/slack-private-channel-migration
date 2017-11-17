'use strict'

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const sns_handler = require('../../src/common/sns_handler')
const handler = require('../../src/dispatch-svc/handler')
// my deps
const test_data = require('../support/test_data')
const createEvent = test_data.createEvent
const SnsPublisherStub = require('../support/stubs').SnsPublisherStub


const success_callback = (done, checks) => {
    return (error, response) => {
        if (error) {
            done.fail(error)
        } else {
            if (checks) {
                checks()
            }

            done()
        }
    }
}

describe('dispatch-svc handler', ()=>{
let snsPublishParams = {}
let sandbox = {}

  afterEach(() => {
      sandbox.restore();
  });

  beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub()
      this.sns_publisher_stub = new SnsPublisherStub(sandbox)
      process.env.MIGRATE_CHANNEL_TOPIC = "1"
      process.env.MIGRATE_EVENT_TOPIC = "2"
      process.env.MIGRATE_MESSAGE_TOPIC = "3"
      process.env.CHANNEL_MIGRATED_TOPIC = "4"
      process.env.CREATE_CHANNEL_TOPIC="5"
  });

  it('should resolve', () => {
    expect(handler).not.to.be.undefined
  })

  it('should dispatch channel-migrated events', (done)=> {
    const migrate_channel_event = createEvent('sns/channel-migrated.json')
    const lambda_callback = success_callback(done,()=>{
      expect(this.sns_publisher_stub.was_called).to.equal(true)
      expect(this.sns_publisher_stub.topicArn).to.equal(process.env.CHANNEL_MIGRATED_TOPIC)
    })
    handler.on_msg(migrate_channel_event,undefined,lambda_callback)
  } )

  it('should dispatch create-channel events', (done)=> {
    const migrate_channel_event = createEvent('sns/create-channel.json')
    const lambda_callback = success_callback(done,()=>{
      expect(this.sns_publisher_stub.was_called).to.equal(true)
      expect(this.sns_publisher_stub.topicArn).to.equal(process.env.CREATE_CHANNEL_TOPIC)
    })
    handler.on_msg(migrate_channel_event,undefined,lambda_callback)
  } )

  it('should dispatch migrate-message events', (done)=> {
    const migrate_channel_event = createEvent('sns/migrate-message.json')
    const lambda_callback = success_callback(done,()=>{
      expect(this.sns_publisher_stub.was_called).to.equal(true)
      expect(this.sns_publisher_stub.topicArn).to.equal(process.env.MIGRATE_MESSAGE_TOPIC)
    })
    handler.on_msg(migrate_channel_event,undefined,lambda_callback)
  } )

  it('should dispatch migrate-channel events', (done)=> {
    const migrate_channel_event = createEvent('sns/migrate-channel.json')
    const lambda_callback = success_callback(done,()=>{
      expect(this.sns_publisher_stub.was_called).to.equal(true)
      expect(this.sns_publisher_stub.topicArn).to.equal(process.env.MIGRATE_CHANNEL_TOPIC)
    })
    handler.on_msg(migrate_channel_event,undefined,lambda_callback)
  } )

  it('should not dispatch for unknown events', (done)=> {
    const migrate_channel_event = createEvent('sns/unknown-event.json')
    const lambda_callback = success_callback(done,()=>{
      expect(this.sns_publisher_stub.was_called).to.equal(false)
    })
    handler.on_msg(migrate_channel_event,undefined,lambda_callback)
  } )

})
