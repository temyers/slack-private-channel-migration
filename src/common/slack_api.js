 'use strict';
 var Promise = require("bluebird");
 const SlackClient = require('@slack/client').WebClient
 const path = require('path');
 const fs = require('fs');

 // TODO - combine group + channel into one for unified API??

 class Group {

     constructor(client, channel_name) {
         this.slack = client
         this.channel_name = channel_name
         var that = this;
         this.channel_id_promise = () => {
             return this.__channel_info(channel_name).then(result => {
                 return result.id;
             })
         }
     }

     contains(message) {
         return this.channel_id_promise().then(channel_id => {
             return this.slack.groups.historyAsync(channel_id).then(result => {
                 const matching_message = (msg) => {
                     return message.text == msg.text && (message.user == msg.user || message.user == msg.username)
                 }
                 const match = result.messages.find(matching_message);
                 return match != undefined
             });
         });
     }

     files(ts_to) {
         return this.channel_id_promise().then(channel_id => {
             let options = {
                 ts_to: ts_to,
                 channel: channel_id
             }
             return this.slack.files.list(options);
         });
     }


     messages(ts) {
         let options = {
             latest: ts
         }
         return this.channel_id_promise().then(channel_id => {
             return this.slack.groups.historyAsync(channel_id, options);
         });
     }

     archive() {

     }

     create() {
         return this.slack.groups.create(this.channel_name).then(result => {
             this.channel_name = result.group.name
             this.channel_id_promise = () => {
                 new Promise((accept, reject) => {
                     accept(result.group.id)
                 })
             }
         }).catch(e => {
             console.log("failed to create: " + e.toString())
             throw e;
         })
     }

     // Private
     __channel_info(channel_name) {
         const options = {
             exclude_archived: true
         }
         return this.slack.groups.listAsync(options).then((data) => {
             const matching_channel = (group) => {
                 return group.name == channel_name
             }
             const group = data.groups.find(matching_channel)
             return group;
         });
     }
 }

 // TODO - refactor - these can be combined, by passing in the slack method to work on.
 class Channel {

     constructor(client, channel_name) {
         this.slack = client
         this.channel_name = channel_name
         var that = this;
         this.channel_id_promise = () => {
             return this.__channel_info(channel_name).then(result => {
                 return result.id;
             })
         }
     }


     files(ts_to) {
         return this.channel_id_promise().then(channel_id => {
             let options = {
                 ts_to: ts_to,
                 channel: channel_id
             }
             return this.slack.files.list(options);
         });
     }

     archive() {
         return this.channel_id_promise().then(channel_id => {
                 // Can this be refactored to remove the control flow
                 this.slack.channels.archive(channel_id)
             })
             .catch((e) => {
                 console.log('failed to archive channel: ' + e.toString())
             });
     }

     create() {

         return this.slack.channels.create(this.channel_name).then(result => {
             this.channel_name = result.channel.name
             this.channel_id_promise = () => {
                 new Promise((accept, reject) => {
                     accept(result.channel.id)
                 })
             }
         }).catch(e => {
             console.log("failed to create: " + e.toString())
             throw e;
         })
     }

     // Private
     __channel_info(channel_name) {
         const options = {
             exclude_archived: true
         }
         return this.slack.channels.listAsync(options).then((data) => {
             const matching_channel = (channel) => {
                 return channel.name == channel_name
             }
             const channel = data.channels.find(matching_channel)
             return channel;
         });
     }
 }

 class Files {
     constructor(client) {
         this.client = client
         this.files = this.client.slack.files
         Promise.promisifyAll(this.files)
     }
     post_file(message) {
         // TODO handle failures
         return this.client.public_channel(message.channel).channel_id_promise().catch(e => {
             // try private group
             console.log('trying private group')
             return this.client.group(message.channel).channel_id_promise()
         }).catch(e => {
             throw new Error('channel_not_found')
         }).then(channel_id => {
             var filePath = path.dirname(message.file_location)
             var fileName = path.parse(message.file_location).base

             var streamOpts = {
                 file: fs.createReadStream(message.file_location),
                 channels: channel_id
             };

             return this.files.upload(fileName, streamOpts)
         })
     }
 }

 class Chat {
     constructor(client) {
         this.client = client
         this.chat = this.client.slack.chat
         Promise.promisifyAll(this.chat)
     }
     post_message(message) {
         return this.client.public_channel(message.channel).channel_id_promise().catch(e => {
             // try private group
             console.log('trying private group')
             return this.client.group(message.channel).channel_id_promise()
         }).catch(e => {
             throw new Error('channel_not_found')
         }).then(channel_id => {
             const options = {
                 as_user: message.as_user || false,
                 parse: 'full',
                 username: message.user,
                 thread_ts: message.ts
             }
             return this.chat.postMessageAsync(channel_id, message.text, options)
         })
     }
 }

 class Client {
     constructor(team_token) {
         this.slack = new SlackClient(team_token);
         Promise.promisifyAll(this.slack.groups)
         Promise.promisifyAll(this.slack.channels)
     }

     channel_archived(channel_name) {
         return this.slack.channels.listAsync().then((data) => {

             const matching_channel = (channel) => {
                 return channel.name == channel_name && channel.is_archived
             }
             const match = data.channels.find(matching_channel)
             return match != undefined
         });
     }

     channel_exists(channel_name) {
         return this.slack.channels.listAsync().then((data) => {

             const matching_channel = (channel) => {
                 return channel.name == channel_name
             }
             const match = data.channels.find(matching_channel)
             return match != undefined
         });

     }
     group_exists(channel_name) {
         return this.slack.groups.listAsync().then((data) => {

             const matching_channel = (group) => {
                 return group.name == channel_name
             }
             const match = data.groups.find(matching_channel)
             return match != undefined
         });
     }

     //@deprecated
     // Use public_channel(channel_name).create() instead
     create_channel(channel_name) {
         return this.public_channel(channel_name).create()
     }

     // Use channel(channel_name).create() instead
     create_group(channel_name) {
         return this.channel(channel_name).create()
     }

     archive_channel(channel_name) {
         return this.channel_exists(channel_name).then(result => {
             return this.public_channel(channel_name).archive()
         })
     }

     group(channel_name) {
         return new Group(this.slack, channel_name)
     }

     // FIXME - this is named about a public channel, but really relates to a group
     // TODO - rename to group(channel_name)
     channel(channel_name) {
         return this.group(channel_name)
     }

     public_channel(channel_name) {
         return new Channel(this.slack, channel_name)
     }

     chat() {
         return new Chat(this)
     }

     files() {
         return new Files(this)
     }
 }

 module.exports = {
     Client
 }
