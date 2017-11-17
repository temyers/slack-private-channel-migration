'use strict';
const path=require('path')
const fs=require('fs')


const createEvent = (filename) => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../test-data/events/', filename)))
}

const stubMessages = (filename) => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../test-data/', filename)))
}

const testData = (filename) => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../test-data/', filename)))
}

module.exports = {
  createEvent,
  stubMessages,
  testData
}
