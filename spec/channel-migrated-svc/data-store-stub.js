'use strict';

const create_dynamodb_row = require('../../src/common/data-store').create_dynamodb_row
const testData = require('../support/test_data').testData

class DataStoreStub {

    constructor() {

    }

    will_return(filename) {
      this.results=testData(`datastore/${filename}`)
    }

    query(channel_name, last_key) {
        this.channel_name = channel_name
        this.last_key = last_key

        return new Promise((resolve, reject) => {

            resolve(this.results)
        })
    }

    getQueryParams() {
      return{
        channel_name: this.channel_name,
        last_key: this.last_key
      }
    }

}



module.exports = DataStoreStub
