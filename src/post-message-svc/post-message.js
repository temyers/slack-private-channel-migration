'use strict';

class PostMessageSvc{

  constructor(slack_api) {
    this.slack_api = slack_api
  }

  event_posted(post_response){
    return [{
      event: 'message-posted',
      body: post_response
    }]
  }

  event_received(event){

    return this.slack_api.chat().post_message(event.body).then(this.event_posted)
  }

}

module.exports = {
  PostMessageSvc
}
