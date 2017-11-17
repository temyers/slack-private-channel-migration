'use strict';

const promisify = (result) => {
    return new Promise((accept, reject) => {
        accept(result)
    })
}

class Channel {

    constructor(channel_name) {
        this.message_response = {
            "ok": true,
            "messages": [],
            "has_more": false
        }
        this.channel_name = channel_name
    }

    contains(message) {

        const matching_message = (msg) => {
            return message.text == msg.text && message.user == msg.user
        }
        const match = this.message_response.messages.find(matching_message);
        return promisify(match != undefined)
    }

    messages(ts) {
        this.messages_arg = ts
        return promisify(this.message_response)
    }

    files(ts) {
        this.files_arg = ts
        return promisify(this.files_response)
    }

    has_files(files) {
        this.files_response = files
    }

    has_messages(messages) {
        this.message_response = messages
    }

    messages_spy() {
        return this.messages_arg
    }

    files_spy() {
        return this.files_arg
    }

    create() {
        this.created_channel = this.channel_name
    }

    create_spy() {
        console.log(this.created_channel)
        return this.created_channel
    }
}

class Chat {
    post_message(message) {
        this.message_posted = message
        return promisify(this.stub_response)
    }

    post_message_stub(stub_response) {
        this.stub_response = stub_response
    }

    post_message_spy() {
        return this.message_posted
    }
}

class Files {
    post_file(file) {
        this.file = file
        return promisify(this.stub_response)
    }

    post_file_stub(stub_response) {
        this.stub_response = stub_response
    }
}

class Client {
    constructor(team_token) {
        this.stub_channel = new Channel("stub-channel")
        this.stub_group = new Channel("stub-channel")
        this.stub_channel_exists = true
        this.stub_channel_exists = true
        this.stub_chat = new Chat()
        this.stub_files = new Files()
    }

    channel_exists(channel_name) {
        return promisify(this.stub_channel_exists)
    }

    group_exists(channel_name) {
        return promisify(this.stub_group_exists)
    }

    // Stub the return value for #channel_exists
    channel_exists_returns(exists) {
        this.stub_channel_exists = exists
    }
    group_exists_returns(exists) {
        this.stub_group_exists = exists
    }

    create_channel(channel_name) {
        this.channel(channel_name).create()
    }
    create_group(channel_name) {
        this.group(channel_name).create(channel_name)
    }

    // Spy on the argument to #create_channel
    create_channel_spy() {
        return this.channel().create_spy()
    }


    create_group_spy() {
        return this.group().create_spy()
    }

    /**
     * Only one channel can be stubbed at a time, the channel name is unused
     */
    channel(channel_name) {
            this.stub_channel.channel_name = channel_name
            return this.stub_channel
        }
        /**
         * Only one channel can be stubbed at a time, the channel name is unused
         */
    group(channel_name) {
        this.stub_group.channel_name = channel_name
        return this.stub_group
    }

    chat() {
        return this.stub_chat
    }

    files() {
        return this.stub_files
    }
}

module.exports = {
    Client
}
