'use strict';
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const create_dynamodb_row = require('../common/data-store').create_dynamodb_row

class MigrateMessageSvc {

    constructor(awsParams) {
        this.awsParams = awsParams
    }

    event_received(event_msg) {
        let message = create_dynamodb_row(event_msg)

        if (event_msg.body.ts == null || event_msg.body.channel == null) {
            return new Promise((resolve, reject) => {
                reject({
                    message: `${event_msg.body.channel==null?"channel":"timestamp"} does not exist`
                })
            })
        }

        console.log(`Processing event ${JSON.stringify(message)}`)

        var params = {
            TableName: process.env.MIGRATE_TABLE,
            Item: message
        };

        console.log(`Param is ${JSON.stringify(params)}`)

        const svc_client = new AWS.DynamoDB(this.awsParams)

        const dynamoDb = new AWS.DynamoDB.DocumentClient({
            service: svc_client
        });
        return dynamoDb.put(params).promise();
    };
}

module.exports = {
    MigrateMessageSvc,
    create_dynamodb_row: create_dynamodb_row
}
