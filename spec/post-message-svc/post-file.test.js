'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const test_data = require('../support/test_data')
const Service = require('../../src/post-message-svc/post-file').PostFileSvc
const download = require('../../src/post-message-svc/download')
const StubSlackClient = require('../common/slack_api_stub').Client
const createEvent = test_data.createEvent
const stubMessages = test_data.stubMessages

describe('PostFileSvc', () => {

    let sandbox = {}
    let mockDownload = {}
    let event_received = createEvent('journey/migrate-private-test/02_migrate-message_snippet.json');
    let fakeFileLocation = "fakeLocation";

    beforeAll(() => {
        this.slack_stub = new StubSlackClient()
        this.svc = new Service(this.slack_stub)
    })

    afterEach(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockDownload = sinon.sandbox.stub(download, 'File');
        mockDownload.returns(Promise.resolve({
            fileLocation: fakeFileLocation
        }));

        this.slack_stub.files().post_file_stub({
            "ok": true
        })

        this.result = this.svc.event_received(event_received);
    });

    it('should download file to the tmp folder', (callback) => {
        this.result.then(res => res[0]).then((res) => {
            expect(mockDownload.firstCall.args[0]).to.be.defined;
            expect(mockDownload.firstCall.args[0]).to.equal(event_received.body.file.url_private_download);
            expect(mockDownload.firstCall.args[1]).to.equal("/tmp/");
        }).then(callback).catch(e => callback.fail(e))
    })

    it('should post the file to Slack', (callback) => {
        this.result.then((res) => {
            const {
                file_location,
                channel
            } = this.slack_stub.files().file;
            expect(file_location).to.equal(fakeFileLocation);
            expect(channel).to.equal(event_received.body.channel);
        }).then(callback).catch(callback.fail)
    })

    it('should return the promise of an Array', (callback) => {
        this.result.then((events_returned) => {
            expect(events_returned).to.be.an('array')
        }).then(callback).catch(callback.fail)
    })

    it('should return a single event', (callback) => {
        this.result.then((events_returned) => {
            expect(events_returned.length).to.equal(1)
        }).then(callback).catch(callback.fail)
    })

    it('should return a file-posted event', done => {
      this.result.then(events_returned => {
        expect(events_returned[0].event).to.equal('file-posted')
        expect(events_returned[0]).to.deep.equal(createEvent('journey/migrate-private-test/05_file-posted.json'))
      }).then(done).catch(done.fail)
    })
});
