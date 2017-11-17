'use strict';

const path=require('path')
const fs=require('fs')
const yaml = require('js-yaml')

const user_id = (mappings, team, username) => {
  return mappings.users[username][team]
}

const channel = (mappings,team,channel) => {
  return mappings.channels[team][channel]
}

const mappings = () => {
  const mappings_file = path.join(__dirname, "../test-data/persona-mappings.yml");
  return yaml.safeLoad(fs.readFileSync(mappings_file, 'utf8'));
}

module.exports = {
  channel,
  mappings,
  user_id
}
