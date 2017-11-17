'use strict';
const messages = require('../../src/migrate-channel-svc/messages')
const chai = require('chai');
const expect = chai.expect;

describe('messages.js', () => {
  describe('#oldest compares 2 timestamps', () => {
    describe('prefixes differ', () => {
      it('should return t1 when prefix older', () => {
        const t2 = "1500363720.095577"
        const t1 = '1500363702.090068' // older

        expect(messages.oldest(t1, t2)).to.equal(t1)
      })

      it('should return t2 when prefix older', () => {
        const t1 = "1500363720.095577"
        const t2 = '1500363702.090068' // older

        expect(messages.oldest(t1, t2)).to.equal(t2)
      })

    })

    describe('prefixes same', () => {
      it('should return t1 when suffix older', () => {
        const t2 = "1500363720.095577"
        const t1 = '1500363720.090068' // older

        expect(messages.oldest(t1, t2)).to.equal(t1)
      })

      it('should return t2 when suffix older', () => {
        const t1 = "1500363720.095577"
        const t2 = '1500363720.090068' // older

        expect(messages.oldest(t1, t2)).to.equal(t2)
      })

    })

  })
})
