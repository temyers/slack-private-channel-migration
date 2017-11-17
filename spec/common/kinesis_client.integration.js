'use strict'

const AWS = require('aws-sdk');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const bluebird = require("bluebird");

const test_data = require('../support/test_data')
const createEvent = test_data.createEvent
const stubMessages = test_data.stubMessages
const kinesis_client = require('../../src/common/kinesis_client')

const stream_name = 'testStream'
const TIMEOUT = 60 * 1000

describe('kinesis_client', () => {
    const read_records_from_kinesis = () => {
        const dsParams = {
            StreamName: stream_name
        }
        return this.kinesis.describeStream(dsParams).promise()
            .then(streamData => {
                var shard_query_promises = []
                streamData.StreamDescription.Shards.forEach(shard => {
                    const shard_params = {
                        ShardId: shard.ShardId,
                        ShardIteratorType: 'AT_SEQUENCE_NUMBER',
                        StreamName: stream_name,
                        StartingSequenceNumber: shard.SequenceNumberRange.StartingSequenceNumber
                    }
                    const shard_results = this.kinesis.getShardIteratorAsync(shard_params).then(iterator => {
                        return this.kinesis.getRecordsAsync({
                            ShardIterator: iterator.ShardIterator
                        })
                    })
                    shard_query_promises.push(shard_results)
                })
                return Promise.all(shard_query_promises)
            }).then(all_shard_records => {
                const mapped_records = all_shard_records.map(records => records.Records)
                const flattened_records = [].concat.apply([], mapped_records)
                return flattened_records
            })
    }

    beforeAll(() => {
        const params = {
            endpoint: 'http://localstack:4568',
            region: 'ap-southeast-2'
        }
        this.kinesis = new AWS.Kinesis(params);
        bluebird.promisifyAll(this.kinesis)
    })

    describe('KinesisPublisher', () => {

        beforeAll(() => {
            this.kinesis_publisher = new kinesis_client.KinesisPublisher(stream_name, this.kinesis)

        })

        describe('#publish_events', () => {
            describe('when stream exists', () => {
                beforeEach((done) => {
                    const params = {
                        ShardCount: 1,
                        StreamName: stream_name
                    }
                    this.kinesis.createStream(params, (error, data) => {
                        if (error) {
                            done.fail(error)
                        }

                        this.kinesis.waitFor('streamExists', {
                            StreamName: stream_name
                        }, (error, data) => {

                            if (error) {
                                done.fail(error)
                            } else {
                                done();
                            }
                        })
                    })


                }, TIMEOUT)

                afterEach((done) => {
                    const params = {
                        StreamName: stream_name
                    }
                    this.kinesis.deleteStream(params, (error, data) => {
                        if (error) {
                            done.fail(error)
                        }

                        // localstack kinesis.waitFor doesn't work reliably :(
                        this.kinesis.waitFor('streamNotExists', {
                            StreamName: stream_name
                        }, (error, data) => {
                            if (error) {
                                done.fail(error)
                            } else {
                                done();
                            }
                        })
                    });
                }, TIMEOUT)

                describe('when publishing []', () => {

                    beforeEach(done => {
                        this.kinesis_publisher.publish_events([]).then(done).catch(done.fail)
                    })

                    it('should not publish anything to kinesis', done => {
                        const dsParams = {
                            StreamName: stream_name
                        }
                        read_records_from_kinesis().then(records => {
                            expect(records.length).to.equal(0)
                            done()
                        }).catch(done.fail)
                    })
                })

                describe('when publishing events', () => {
                    beforeEach(done => {
                        this.published_events = [
                            createEvent('journey/migrate-private-test/02_migrate-message.json'),
                            createEvent('journey/migrate-private-test/02_migrate-message_snippet.json'),
                        ]
                        this.kinesis_publisher.publish_events(this.published_events).then(done).catch(done.fail)
                    })

                    it('should publish the records to kinesis', done => {
                        read_records_from_kinesis().then(records => {
                            expect(records.length).to.equal(2)
                            done()
                        }).catch(done.fail)
                    })
                })
            })
        })

    })
})
