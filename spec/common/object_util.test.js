'use strict'

const chai = require('chai');
const expect = chai.expect;
const handler = require('../../src/common/object_util')

describe('object_util', () => {

  describe('#merge_object object', () => {
    beforeAll(() => {
      this.object = {
        foo: "bar"
      }
    })

    it('returns a clone of itself when merged with {}', () => {
      const result = handler.merge_object(this.object, {});

      expect(result).to.deep.equal(this.object)
      expect(result).not.to.equal(this.object)

    })

    it('it adds a simple property', () => {
      const expected = {
        foo: 'bar',
        ts: 1
      }

      const result = handler.merge_object(this.object, {
        ts: 1
      })

      expect(result).to.deep.equal(expected)
      expect(this.object.ts).to.equal(undefined)
    })

    it('it overrides a simple property', () => {
      const result = handler.merge_object(this.object, {
        foo: 'baz'
      })

      expect(result).to.deep.equal({
        foo: 'baz'
      })
      expect(this.object.foo).to.equal('bar')
    })

    it('it changes a nested key', () => {
      const orig = {
        foo: 'bar',
        body: {
          ts: 1
        }
      }

      const to_merge = {
        body: {
          ts: 2
        }
      }

      const result = handler.merge_object(orig, to_merge)

      expect(result.body.ts).to.equal(2)
      expect(result.foo).to.equal('bar')
    })

    it('adds a nested key', () => {
      const orig = {
        foo: 'bar',
        body: {
          ts: 1
        }
      }

      const to_merge = {
        body: {
          bar: 'baz'
        }
      }

      const result = handler.merge_object(orig, to_merge)
      expect(result.body).to.deep.equal({
        ts: 1,
        bar: 'baz'
      })

    })

    it('should merge deeply nested properties', () => {
      const orig = {
        foo: 'bar',
        body: {
          bar: 'jeff'
        }
      }

      const to_merge = {
        body: {
          bar: {
            foo: 'bar'
          }
        }
      }

      const result = handler.merge_object(orig, to_merge)
      expect(result).to.deep.equal({
        foo: 'bar',
        body: {
          bar: {
            foo: 'bar'
          }
        }
      })
    })

  })
})
