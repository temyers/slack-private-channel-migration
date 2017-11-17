'use strict';

// globals
const table_name = "FAKE_TABLE"
process.env['MIGRATE_TABLE'] = table_name

// imports
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const test_data = require('../support/test_data')
const createEvent = test_data.createEvent
const testData = test_data.testData
const MigrateMessageSvc = require('../../src/migrate-message-svc/migrate-message').MigrateMessageSvc
const DataStore = require('../../src/common/data-store').DataStore
const DataStoreStub = require('./data-store-stub')

const AWS = require('aws-sdk');

describe('data-store', () => {

    const channel_name = "private-test"
    const TIMEOUT = 60 * 1000;
    const total_events = 50

    const populate_dynamodb = () => {
        let template = createEvent('journey/migrate-private-test/02_migrate-message.json')

        let migrateEventsPromise = []
        this.source_events = []
        for (var i = total_events - 1; i >= 0; i--) {
            template.body.text = `message ${i}`
            template.body.channel = channel_name
            template.body.ts = `${i}`

            this.source_events.push(template)

            migrateEventsPromise.push(this.migrateMessageSvc.event_received(template))
        }

        console.log(`count is ${migrateEventsPromise.length}`)

        return Promise.all(migrateEventsPromise)
    }

    beforeAll(done => {
        const params = {
            endpoint: "http://localstack:4569",
            region: "ap-southeast-2"
        }

        this.migrateMessageSvc = new MigrateMessageSvc(params)

        this.dynamodb = new AWS.DynamoDB(params)
        this.dynamoDBClient = new AWS.DynamoDB.DocumentClient({
            service: this.dynamodb
        });

        this.dynamodb.createTable({
            AttributeDefinitions: [{
                AttributeName: "channel",
                AttributeType: "S"
            }, {
                AttributeName: "timestamp",
                AttributeType: "N"
            }],
            KeySchema: [{
                AttributeName: "channel",
                KeyType: "HASH"
            }, {
                AttributeName: "timestamp",
                KeyType: "RANGE"
            }],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            },
            TableName: table_name
        }, (createTableError, createTableData) => {

            if (createTableError) {
                done.fail(createTableError)
            }

            this.dynamodb.waitFor('tableExists', {
                TableName: table_name
            }, (error, data) => {
                if (error) {
                    done.fail(error)
                } else {
                    populate_dynamodb().then(done).catch(done.fail)
                }
            })
        })

    }, TIMEOUT)

    afterAll(done => {
        this.dynamodb.deleteTable({
            TableName: table_name
        }, (error, data) => {
            if (error) {
                done.fail(error)
            }

            this.dynamodb.waitFor('tableNotExists', {
                TableName: table_name
            }, (error2, data2) => {
                if (error2) {
                    done.fail(error2)
                } else {
                    done()
                }
            })
        })
    }, TIMEOUT)

    it('should populate localstack', done => {

        var params = {
            TableName: table_name,
            KeyConditionExpression: "#key = :value",
            ExpressionAttributeNames: {
                "#key": "channel"
            },
            ExpressionAttributeValues: {
                ":value": `${channel_name}`
            },
            Select: 'COUNT'
        };

        this.dynamoDBClient.query(params, function(err, data) {
            if (err) {
                done.fail(err)
            } else {
                console.log("Query succeeded.");
                expect(data.Count).to.equal(total_events)
                done()
            }
        });
    })

    describe('#query ', () => {

        describe('when results are paged', () => {
            const page_size = 49
            beforeAll(() => {
                this.data_store = new DataStore(table_name, page_size, this.dynamoDBClient)
            })

            it('should return Promise of a QueryResult', done => {
                this.data_store.query(channel_name).then(results => {
                    expect(results).not.to.be.undefined
                    expect(results.last_key).not.to.be.undefined
                    expect(results.messages).to.be.an.instanceOf(Array)
                    done()
                }).catch(done.fail)
            })

            it('should return (paged count) items', done => {
                this.data_store.query(channel_name).then(results => {
                    expect(results.messages.length).to.equal(page_size)
                    done()
                }).catch(done.fail)
            })

            it('should return the last key in the page', done => {
                this.data_store.query(channel_name).then(results => {
                    expect(results.last_key).not.to.be.undefined
                    expect(results.last_key.channel).to.equal(channel_name)
                    expect(results.last_key.timestamp).to.equal(48)

                    console.log(JSON.stringify(results.last_key))

                    done()
                }).catch(done.fail)
            })

            it('should return oldest items first', done => {
                this.data_store.query(channel_name).then(results => {
                    expect(results.messages[0].timestamp).to.equal(0)
                    done()
                }).catch(done.fail)
            })

            it('should produce paged_results test data', done => {
              this.data_store.query(channel_name).then(results => {
                expect(testData('datastore/paged_results.json')).to.deep.equal(results)
              }).then(done).catch(done.fail)
            })
        })

        describe('when using a previous page key', () => {
            const page_size = 49;
            beforeAll(() => {
                this.data_store = new DataStore(table_name, page_size, this.dynamoDBClient)
                this.last_key = {
                    channel: channel_name,
                    timestamp: 45
                }
            })

            it('should return results from the next page', done => {
                this.data_store.query(channel_name, this.last_key).then(results => {
                    expect(results.messages.length).to.equal(4)
                    expect(results.last_key).to.be.undefined
                    done()

                }).catch(done.fail)
            })
            it('should not return the last item from the previous page', done => {
                this.data_store.query(channel_name, this.last_key).then(results => {

                    const previous_page_item = results.messages.filter(item => {
                        return item.timestamp == 45
                    })
                    expect(previous_page_item).to.deep.equal([])
                    done()
                }).catch(done.fail)
            })

            it('should produce previous_page_key test data', done => {
              this.data_store.query(channel_name).then(results => {
                expect(testData('datastore/previous_page_key.json')).to.deep.equal(results)
              }).then(done).catch(done.fail)
            })
        })

        describe('when messages in DynamoDb is <= pagesize', () => {

            describe('when pagesize > #items', () => {
                const page_size = 51;
                beforeAll(() => {
                    this.data_store = new DataStore(table_name, page_size, this.dynamoDBClient)
                })

                it('should not return a page_key', done => {
                    this.data_store.query(channel_name).then(results => {
                        expect(results.last_key).to.be.undefined
                        done()

                    }).catch(done.fail)
                })

                it('should return all the results', done => {
                    this.data_store.query(channel_name).then(results => {
                        expect(results.messages.length).to.equal(50)
                        done()

                    }).catch(done.fail)
                })

                it('should produce all_results test data', done => {
                  this.data_store.query(channel_name).then(results => {
                    expect(testData('datastore/all_results.json')).to.deep.equal(results)
                  }).then(done).catch(done.fail)
                })
            })

            describe('when pagesize == #items', () => {
                const page_size = 50;
                beforeAll(() => {
                    this.data_store = new DataStore(table_name, page_size, this.dynamoDBClient)
                })

                it('should return a page_key', done => {
                    this.data_store.query(channel_name).then(results => {
                        expect(results.last_key).not.to.be.undefined
                        console.log(JSON.stringify(results.last_key))
                        done()

                    }).catch(done.fail)
                })

                it('should return all the results', done => {
                    this.data_store.query(channel_name).then(results => {
                        expect(results.messages.length).to.equal(50)
                        done()

                    }).catch(done.fail)
                })
            })
        })
    })

    describe('data-store stub', ()=> {

      beforeEach(() => {
        this.data_store_stub=new DataStoreStub();
      })

      describe('#query ', () => {
        it('should return stubbed results', done => {
          this.data_store_stub.will_return('all_results.json')
          this.data_store_stub.query(channel_name).then(results => {
            expect(results).to.deep.equal(testData('datastore/all_results.json'))
          }).then(done).catch(done.fail)
        })
      })

      describe('#getQueryParams', ()=>{
        it('should return the channel name queried', ()=>{
          this.data_store_stub.query(channel_name)
          expect(this.data_store_stub.getQueryParams().channel_name).to.equal(channel_name)
        })
        it('should not return the last_key unless queried', ()=>{
          this.data_store_stub.query(channel_name)
          expect(this.data_store_stub.getQueryParams().last_key).to.be.undefined
        })
        it('should return the last_key when queried', ()=>{
          this.data_store_stub.query(channel_name,'fakeLastKey')
          expect(this.data_store_stub.getQueryParams().last_key).to.equal('fakeLastKey')
        })
      })


    })

})
