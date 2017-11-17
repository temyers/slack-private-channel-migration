'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const AWS = require('aws-sdk-mock');
const {
    createEvent
} = require('../support/test_data')
const Service = require('../../src/migrate-message-svc/migrate-message').MigrateMessageSvc

describe('migrate-message svc', () => {

    let sandbox = sinon.sandbox.create();
    let dynamodbUpdateParams = {};
    let fakeResult = {
        result: "Ok"
    }

    beforeAll(() => {
        this.svc = new Service()
    })

    beforeEach((done) => {
        AWS.mock('DynamoDB.DocumentClient', 'put', function(params, callback) {
            dynamodbUpdateParams = params;
            callback(null, fakeResult);
        });
        this.event_received = createEvent('journey/migrate-private-test/02_migrate-message.json')
        done();
    })

    afterEach(function() {
        AWS.restore('DynamoDB.DocumentClient', 'put');
        sandbox.restore();
    })

    it('should event ts to set the dynamodb timestamp', callback => {
        this.svc.event_received(this.event_received).then(result => {
            expect(dynamodbUpdateParams.Item.timestamp).to.equal(parseFloat(this.event_received.body.ts))
        }).then(callback).catch(callback.fail);
    })

    it('should store the entire event', callback => {
        this.svc.event_received(this.event_received).then(result => {
            expect(dynamodbUpdateParams.Item.event).to.deep.equal(this.event_received)
        }).then(callback).catch(callback.fail);

    })

    it('should set the channel of the Item to channel in event', callback => {
        this.svc.event_received(this.event_received).then(result => {
            expect(dynamodbUpdateParams.Item.channel).to.equal(this.event_received.body.channel)
        }).then(callback).catch(callback.fail);
    })

    it('should retrieve the table name from environment variable', callback => {
        process.env["MIGRATE_TABLE"] = "test"

        this.svc.event_received(this.event_received).then(result => {
            expect(dynamodbUpdateParams.TableName).to.equal(process.env.MIGRATE_TABLE)
        }).then(callback).catch(callback.fail);
    })

    it('should return dynamodb promise ', callback => {
        this.svc.event_received(this.event_received).then(result => {
            expect(result).to.equal(fakeResult)
        }).then(callback).catch(callback.fail);
    })

    it('should return promise and fail it when timestamp does not exist ', callback => {
        this.event_received.body.ts = null;
        this.svc.event_received(this.event_received).then(result => {
            fail("The call should not succeed");
        }).catch(
            (reason) => {
                expect(reason.message).to.equal("timestamp does not exist")
                callback()
            });
    })

    it('should return promise and fail it when channel does not exist ', callback => {
        this.event_received.body.channel = null;
        this.svc.event_received(this.event_received).then(result => {
            fail("The call should not succeed");
        }).catch(
            (reason) => {
                expect(reason.message).to.equal("channel does not exist")
                callback()
            });
    })

});
