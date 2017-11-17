'use strict'

const AWS = require('aws-sdk');

class KinesisPublisher {
  constructor(stream_name, aws_kinesis) {
    if (!aws_kinesis) {
      this.kinesis = new AWS.Kinesis();
    } else {
      this.kinesis = aws_kinesis
    }
    this.stream_name = stream_name
  }

  publish_events(events) {

    if(events.length == 0){
      return new Promise((resolve,reject)=>{
        resolve()
      })
    }

    // Put all events in the same shard to enforce sequential publish
    const kinesis_records = events.map(event => {
      return {
        Data: JSON.stringify(event),
        PartitionKey: 'slackMessageSequence'
      }
    })

    console.log(`Publishing ${events.length} messages.`)

    return this.kinesis.putRecords({
      Records: kinesis_records,
      StreamName: this.stream_name }).promise()
  }
}


module.exports = {
  KinesisPublisher
}
