'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const bluebird = require("bluebird");

const handler = require('../../src/post-message-svc/handler')
const PostMessageSvc = require('../../src/post-message-svc/post-message').PostMessageSvc
const PostFileSvc = require('../../src/post-message-svc/post-file').PostFileSvc

const SnsPublisher = require('../../src/common/sns_handler').SnsPublisher
const base64 = require('base-64');
const slack_api = require('../../src/common/slack_api')
const test_data = require('../support/test_data')
const createEvent = test_data.createEvent
const stubMessages = test_data.stubMessages

// stub APIs
const StubSlackClient = require('../common/slack_api_stub').Client


describe('post-message-svc handler', () => {

    let sandbox = {}
    let eventParams = {}
    let snsParams = {}
    let classCalled = ""
    let fakeEvents = [1, 2, 3]

    afterEach(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        this.event_received = createEvent('kinesis/template-post-message.json')
        this.event_json = createEvent('journey/migrate-private-test/02_migrate-message.json')
        this.event_received.Records[0].kinesis.data = base64.encode(JSON.stringify(this.event_json))
        classCalled = ""
        sandbox = sinon.sandbox.create();
        sandbox.stub()
        sandbox.stub(PostMessageSvc.prototype, 'event_received').callsFake((params) => {
            eventParams = params
            classCalled = "PostMessageSvc"
            return new Promise((resolve, reject) => {
                resolve(fakeEvents)
            })
        })

        sandbox.stub(PostFileSvc.prototype, 'event_received').callsFake((params) => {
            eventParams = params;
            classCalled = "PostFileSvc"
            return new Promise((resolve, reject) => {
                resolve(fakeEvents)
            })
        })

        sandbox.stub(SnsPublisher.prototype, 'publish_events').callsFake((params) => {
            snsParams = params
            return new Promise((resolve, reject) => {
                resolve([])
            })
        })
    });

    it('should decode the data from kinesis', (done) => {
        const lambda_callback = (error, response) => {
            expect(eventParams).to.deep.equal(this.event_json)
            if (error) {
                done.fail(error)
            } else {
                done()
            }
        }
        handler.on_msg(this.event_received, {
            succeed: () => {}
        }, lambda_callback)
    })

    it('should pass the events returned to SnsPublisher', (done) => {
        const lambda_callback = (error, response) => {
            expect(snsParams).to.deep.equal(fakeEvents)
            if (error) {
                done.fail(error)
            } else {
                done()
            }
        }
        handler.on_msg(this.event_received, {
            succeed: () => {}
        }, lambda_callback)
    })


    it('should send chat to PostMessageSvc based on subtype', (done) => {
        const lambda_callback = (error, response) => {
            expect(classCalled).to.equal("PostMessageSvc")
            if (error) {
                done.fail(error)
            } else {
                done()
            }
        }

        handler.on_msg(this.event_received, {
            succeed: () => {}
        }, lambda_callback)
    })

    it('should send file subtype without url_private_download to PostMessageSvc', (done) => {
        this.event_received = createEvent('kinesis/template-post-file.json')
        this.event_json = createEvent('migrate-message_file_without_url_private_download.json')
        this.event_received.Records[0].kinesis.data = base64.encode(JSON.stringify(this.event_json))

        const lambda_callback = (error, response) => {
            expect(classCalled).to.equal("PostMessageSvc")
            expect(eventParams).to.deep.equal(this.event_json)
            if (error) {
                done.fail(error)
            } else {
                done()
            }
        }

        handler.on_msg(this.event_received, {
            succeed: () => {}
        }, lambda_callback)
    })

    it('should send file to PostFileSvc based on subtype', (done) => {
        this.event_received = createEvent('kinesis/template-post-file.json')
        this.event_json = createEvent('journey/migrate-private-test/02_migrate-message_snippet.json')
        this.event_received.Records[0].kinesis.data = base64.encode(JSON.stringify(this.event_json))

        const lambda_callback = (error, response) => {
            expect(classCalled).to.equal("PostFileSvc")
            expect(eventParams).to.deep.equal(this.event_json)
            if (error) {
                done.fail(error)
            } else {
                done()
            }
        }

        handler.on_msg(this.event_received, {
            succeed: () => {}
        }, lambda_callback)
    })

    it('should not callback with error on failure', done => {

        const expected_error = new Error('boom')
        sandbox.restore();
        sandbox = sinon.sandbox.create();
        sandbox.stub()
        sandbox.stub(PostMessageSvc.prototype, 'event_received').callsFake((params) => {
            return new Promise((resolve, reject) => {
                throw expected_error
            })
        })

        sandbox.stub(PostFileSvc.prototype, 'event_received').callsFake((params) => {
            return new Promise((resolve, reject) => {
                throw expected_error
            })
        })

        sandbox.stub(SnsPublisher.prototype, 'publish_events').callsFake((params) => {
            return new Promise((resolve, reject) => {
                throw expected_error
            })
        })

        handler.on_msg(this.event_received, undefined, (error, response) => {
            expect(error).to.equal(null)
            done()
        }).catch(done.fail)
    })

});
