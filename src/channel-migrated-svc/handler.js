'use strict'
const AWS = require('aws-sdk');

const ChannelMigratedSvc = require('./channel-migrated').ChannelMigratedSvc
const sns_handler = require('../common/sns_handler')
const kinesis_client = require('../common/kinesis_client')
const data_store = require('../common/data-store')

const snsEvents = (generated_events) => {
  return generated_events.filter(event => event.event == 'channel-migrated')
}

const kinesis_events = (generated_events) => {
  return generated_events.filter(event => event.event == 'migrate-message')
}


const on_msg = (event, context, callback) => {
  const params = {}
  const dynamodb = new AWS.DynamoDB(params)
  const dynamoDBClient = new AWS.DynamoDB.DocumentClient({
    service: dynamodb
  });

  const snsPublisher = new sns_handler.SnsPublisher();
  const dynamoDb = new data_store.DataStore(process.env.TABLE_NAME, 500, dynamoDBClient);


  const kinesisPublisher = new kinesis_client.KinesisPublisher(process.env.KINESIS_STREAM);

  const svc = new ChannelMigratedSvc(dynamoDb)

  sns_handler.dispatch_filter(event, 'channel-migrated', svc, []).then(results => {
    const response = {
      statusCode: 200,
      body: 'OK',
    };

    snsPublisher.publish_events(snsEvents(results))
    kinesisPublisher.publish_events(kinesis_events(results))

    callback(null, response);
  }).catch(e => callback(e))

}

module.exports = {
  on_msg
}
