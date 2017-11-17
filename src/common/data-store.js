'use strict';

const AWS = require('aws-sdk');

class DataStore {

    constructor(tableName, page_size, dynamoDbClient) {
        this.page_size = page_size
        this.dynamoDbClient = dynamoDbClient
        this.tableName = tableName
    }

    query(channel_name, last_key) {

        var params = {
            TableName: this.tableName,
            KeyConditionExpression: "#key = :value",
            ExpressionAttributeNames: {
                "#key": "channel"
            },
            ExpressionAttributeValues: {
                ":value": `${channel_name}`
            },
            Limit: this.page_size
        };

        if (last_key) {
            params.ExclusiveStartKey = last_key
        }

        return new Promise((resolve, reject) => {
            this.dynamoDbClient.query(params).promise().then(result => {

                var toReturn = {
                    messages: result.Items
                }
                if(result.LastEvaluatedKey){
                  toReturn.last_key = result.LastEvaluatedKey
                }

                resolve(toReturn);
            }, error => {
                reject(error)
            })
        })
    }

}

const create_dynamodb_row = (data) => {
    return {
        event: removeEmpty(data),
        timestamp: parseFloat(data.body.ts),
        channel: data.body.channel
    }
}

const removeEmpty = (obj) => {
    Object.keys(obj).forEach(k =>
        (obj[k] && typeof obj[k] === 'object') && removeEmpty(obj[k]) ||
        (!obj[k] && obj[k] !== undefined) && delete obj[k]
    );
    return obj;
};



module.exports = {
  DataStore,
  create_dynamodb_row
}
