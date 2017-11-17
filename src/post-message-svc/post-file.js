const SlackClient = require('@slack/client').WebClient
const download = require('./download')

class PostFileSvc {

    constructor(slack_api) {
        this.slack_api = slack_api
    }

    event_posted(post_response){
      return [{
        event: 'file-posted',
        body: post_response
      }]
    }

    event_received(event_msg) {

        let slack_api = this.slack_api;

        var event_posted = this.event_posted;

        return new Promise(function(fulfill, reject) {
            let rejectError = (error) => {
                reject(error)
            }
            download.File(event_msg.body.file.url_private_download, "/tmp/", null).then((result) => {
                slack_api.files().post_file({
                    channel: event_msg.body.channel,
                    file_location: result.fileLocation
                }).then((result) => {
                    fulfill(event_posted(result))
                }, rejectError)

            }, rejectError)
        });
    }
}

module.exports = {
    PostFileSvc
}
