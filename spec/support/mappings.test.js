'use strict';

const mappings = require('./mappings')
const chai = require('chai');
const expect = chai.expect;

describe('mappings', () => {

  beforeAll(() => {
    this.mappings = mappings.mappings();
  });

  describe( "#mappings()", () => {
    it("should load the mapping file", () => {
      expect(this.mappings).to.have.all.keys('teams','channels','users');
    });
  });

  describe("channel_for_team()", () => {
    it("should return the actual channel when given persona team and channel", () => {
      const actual = mappings.channel(this.mappings,'A','private-test');

      expect(actual).to.equal('migrate-source-priv');
    });
  });

  describe("user_id()", () => {
    it("should return the actual id for a user when given persona username and team", () =>{
      const actual = mappings.user_id(this.mappings,'A','alice.adams');

      expect(actual).to.equal('U04FPCP43');
    });
  });
});
