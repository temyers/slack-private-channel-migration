'use strict';

const slack_api = require('../../src/common/slack_api')
const test_data = require('../support/test_data')
const chai = require('chai');
const expect = chai.expect;
var Promise = require("bluebird");
const uuidV1 = require('uuid/v1');
// channel names can be max 21 chars
const uuid = () => {
    return uuidV1().substring(0, 21)
}

const userToId={
  'alice.adams':'U7WQGNHPE',
  'bruce.banner':'U7WLV4ZTM',
  'charlie.chaplin':'U7WP3UGKC',
}

// See spec/test-data/manual-setup
const timestampOfAThread='1510151014.000130'
const messageTextOfAThread='A thread'
const messageTextOfLatestMessage='Yet another message'
const messageTextOfEarliestMessage='This is a message'

describe('slack-api', () => {

    beforeAll((done) => {
        this.slack = new slack_api.Client(process.env.SOURCE_TEAM_TOKEN_integration)
        this.existing_private_group = 'slack-int-existing'
        this.new_private_group = 'slack-int-priv'
        this.existing_public_channel = 'general'

        // Ensure a private channel exists to post to
        this.new_private_channel='slack-bot-test-priv'
        this.slack.group_exists(this.new_private_channel).then(exists => {
          if(!exists){
            this.slack.group(this.new_private_channel).create()
          }
        }).then(done).catch(done.fail)
    })

    describe('#group_exists()', () => {

        it('should return the promise of a result', () => {
            expect(this.slack.group_exists(this.existing_private_group)).to.be.an.instanceOf(Promise)
        })

        it('should return true when the private channel exists', (callback) => {

            this.slack.group_exists(this.existing_private_group).then((result) => {
                expect(result).to.equal(true)
                callback();
            }).catch(e => {
                callback.fail(e)
            });
        });

        it('should return false when the private channel does not exist', (callback) => {
            this.slack.group_exists('general').then((result) => {

                expect(result).to.equal(false);
                callback();
            }).catch(e => {
                callback.fail(e)
            });
        });

    });

    describe('#channel_exists()', () => {

        it('should return the promise of a result', () => {
            expect(this.slack.channel_exists(this.existing_public_channel)).to.be.an.instanceOf(Promise)
        })

        it('should return true when the public channel exists', (callback) => {

            this.slack.channel_exists(this.existing_public_channel).then((result) => {
                expect(result).to.equal(true)
                callback();
            }).catch(e => {
                callback.fail(e)
            });
        });

        it('should return false when the public channel does not exist', (callback) => {
            this.slack.channel_exists('a-really-secret-group').then((result) => {

                expect(result).to.equal(false);
                callback();
            }).catch(e => {
                callback.fail(e)
            });
        });

    })

    describe('#create_chanel()', () => {

        beforeEach(() => {
            this.to_create = uuid();
        })

        afterEach((callback) => {
            this.slack.archive_channel(this.to_create).then(callback).catch(callback);
        })

        describe('when the channel does not exist', () => {
            it('should create a public channel', (callback) => {
                this.slack.public_channel(this.to_create)
                    .create()
                    .then(() => {
                        return this.slack.channel_exists(this.to_create)
                    })
                    .then(result => {
                        expect(result).to.equal(true);
                        callback()
                    }).catch(callback.fail);
            })
        })
        describe('when the channel already exists', () => {
            beforeEach(callback => {
                this.to_create = uuid();
                this.slack.public_channel(this.to_create)
                    .create().then(callback)
            })

            it('should do nothing', callback => {
                    this.slack.channel_exists(this.to_create).then(result => {
                        expect(result).to.equal(true)
                        callback()
                    }).catch(callback.fail)
                })
        })

    })

    describe('#archive_channel()', () => {
        describe('when the channel does not exist', () => {
            beforeEach(() => {
                this.to_delete = uuid();
                jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
            })
            it('should not fail', (callback) => {
                this.slack.archive_channel(this.to_delete).then(complete => {
                    return this.slack.channel_exists(this.to_delete);
                }).then(result => {
                    expect(result).to.equal(false)
                    callback()
                }).catch(e => {
                    callback.fail(e)
                })
            })
        })
        describe('when the channel already exists', () => {
            beforeEach((callback) => {
                this.to_delete = uuid();
                this.slack.public_channel(this.to_delete)
                    .create().then(callback)
            })

            it('should archive the channel', (callback) => {
                    this.slack.archive_channel(this.to_delete).then(() => {
                        // it's archived so exists
                        return this.slack.channel_exists(this.to_delete);
                    }).then(result => {
                        // archived channels exist
                        expect(result).to.equal(true)
                        return this.slack.channel_archived(this.to_delete);
                    }).then(result => {
                        expect(result).to.equal(true)
                        callback()
                    }).catch(e => {
                        callback.fail(e)
                    })
                })
        })

    })

    describe('#channel()', () => {


        describe('with known private channel', () => {
            beforeAll(() => {
                expect(this.slack).not.to.be.undefined
                this.channel = this.slack.channel(this.existing_private_group)
            });

            it('should resolve', () => {
                expect(this.channel).not.to.be.undefined
            });

            it('should have a #contains', () => {
                expect(this.channel.contains).not.to.be.undefined
            });

            describe('#contains', () => {

                it('should return true when the channel contains the expected message', (done) => {
                    this.channel.contains({
                        user: userToId['charlie.chaplin'],
                        text: 'Yet another message'
                    }).then(result => {
                        expect(result).to.equal(true);
                    }).then(done).catch(done.fail);
                })
            });
        });

        describe('#messages', () => {
            it('should return the promise of messages', () => {
                expect(this.channel.messages()).to.be.an.instanceOf(Promise)
            })

            it('should return the slack response', (callback) => {
                this.channel.messages().then(message_response => {
                    expect(message_response.ok).to.equal(true)
                    expect(message_response.messages).to.be.an('array')
                    expect(message_response.has_more).to.equal(false)
                }).then(callback).catch(callback.fail)
            })

            it('should return messages', (callback) => {
                this.channel.messages().then(message_response => {
                    const messages = message_response.messages
                    expect(messages).to.be.an('array')
                    expect(messages.length).to.be.above(0)
                        // It's a slack message - don't care about the content
                    expect(messages[0]).to.have.property('ts');
                    expect(messages[0]).to.have.property('type');
                    expect(messages[0]).to.have.property('text');
                    expect(messages[0]).to.have.property('user');
                }).then(callback).catch(callback.fail)
            })

            it('should return the latest messages when no timestamp is passed', (callback) => {
                this.channel.messages().then(message_response => {
                    const messages = message_response.messages
                    expect(messages.map(msg => msg.text)).to.include(messageTextOfLatestMessage)
                }).then(callback).catch(callback.fail)
            })
            it('should return messages before a supplied timestamp (exclusive)', (callback) => {
                this.channel.messages(timestampOfAThread).then(message_response => {
                    const messages = message_response.messages
                    expect(messages.map(msg => msg.text)).not.to.include(messageTextOfAThread)
                    expect(messages.map(msg => msg.text)).to.include(messageTextOfEarliestMessage)
                }).then(callback).catch(callback.fail)
            })
        });
    });

    describe('#files()', () => {

        beforeAll(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
            this.files = this.slack.files()
        })

        describe('#post_file()', () => {
            it('should upload the file to public channel', (callback) => {

                let filePath = "./spec/test-data/scenario/integration/post_file/fakeFile.txt"
                this.files.post_file({
                    channel: this.existing_public_channel,
                    file_location: filePath
                }).then(response => {
                    expect(response.ok).to.equal(true)
                    callback();
                }).then(callback).catch(callback.fail)
            })

            it('should upload the file to private channel', (callback) => {

                let filePath = "./spec/test-data/scenario/integration/post_file/fakeFile.txt"
                this.files.post_file({
                    channel: this.new_private_channel,
                    file_location: filePath
                }).then(response => {
                    expect(response.ok).to.equal(true)
                    callback();
                }).then(callback).catch(callback.fail)
            })
        });

        describe('files_exists', () => {

            it('should return the files on the public channel', (done) => {
                this.slack.public_channel(this.existing_public_channel).files().then((response) => {
                    expect(response.ok).to.equal(true)
                    expect(response.files.length > 0).to.equal(true)
                    done()
                }, (error) => {
                    fail(error)
                    done()
                })
            })

            it('should return the files on the private channel', (done) => {
                this.slack.group(this.new_private_channel).files().then((response) => {
                    expect(response.ok).to.equal(true)
                    expect(response.files.length > 0).to.equal(true)
                    done()
                }, (error) => {
                    fail(error)
                    done()
                })
            })
        });

    });

    describe('#chat()', () => {

        beforeEach(() => {
            this.chat = this.slack.chat()
        })

        describe('#post_message()', () => {

            describe('post to a private channel', () => {
                it('should post the message', (callback) => {
                    const message = test_data.stubMessages('scenario/integration/post_message/post_message.json')
                    this.chat.post_message(message).then(response => {
                        expect(response.ok).to.equal(true)
                    }).then(callback).catch(callback.fail)
                })

                it('should reply to a message when a ts is supplied', (callback) => {
                    this.slack.group('slack-bot-test-priv').messages().then(response => {
                        // find the first non-reply
                        return response.messages.find(msg => {
                            return msg.thread_ts == undefined
                        })
                    }).then(message => {
                        return message.ts
                    }).then(existing_message_timestamp => {
                        this.existing_message_timestamp = existing_message_timestamp
                        const message = test_data.stubMessages('scenario/integration/post_message/post_reply.json')
                        message.ts = existing_message_timestamp
                        return this.chat.post_message(message)
                    }).then(response => {
                        expect(response.ok).to.equal(true)
                        expect(response.message.thread_ts).to.equal(this.existing_message_timestamp)
                    }).then(callback).catch(callback.fail)

                })

                describe('when the user does not exist in the team', () => {
                    it('should post as that username successfully', (callback) => {
                        const message = test_data.stubMessages('scenario/integration/post_message/post_message_unknown_user.json')
                        return this.chat.post_message(message)
                            .then(response => {
                                expect(response.ok).to.equal(true)
                                expect(response.message.username).to.equal("doris.day")
                            }).then(callback).catch(callback.fail)
                    })
                })
            })

            describe('when the destination channel does not exist', () => {
                it('should fail', callback => {
                    const message = test_data.stubMessages('scenario/integration/post_message/post_message_unknown_channel.json')
                    return this.chat.post_message(message)
                        .then(callback.fail).catch(e => {
                            expect(e.toString()).to.include('channel_not_found')
                        }).then(callback)
                })
            })

            describe('when the destination channel is already archived', () => {
                it('should fail', callback => {
                    const message = test_data.stubMessages('scenario/integration/post_message/post_message_archived.json')
                    return this.chat.post_message(message)
                        .then(callback.fail).catch(e => {
                            expect(e.toString()).to.include('channel_not_found')
                        }).then(callback)
                })
            })

            describe('post to a public channel', () => {
                it('should post the message', (callback) => {
                    const message = test_data.stubMessages('scenario/integration/post_message/post_message_public.json')
                    this.chat.post_message(message).then(response => {
                        expect(response.ok).to.equal(true)
                    }).then(callback).catch(callback.fail)
                })
            })

        })

    })

});
