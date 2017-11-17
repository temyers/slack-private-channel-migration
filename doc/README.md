# Architecture:

* Event driven architecture
* Each lambda function should aim to handle one type of event
  * Multiple functions may process the same event to do different things
  * Prefer functions that do one thing - multiple operations suggests multiple functions.
* Each lambda should connect to a single slack instance only (src/destination)
* All events should be published to a single event bus (SNS) (Rapids pattern)
  * If this creates too many duplicate events, then we shall refactor to use SNS topic per event type (Rapids pattern)



BIG NOTE HERE:
Posting messages needs to be rate limited to about 1 message/sec
Therefore use a Kinesis stream for pushing messages to Slack, and manage with Lambda.
Kinesis also gives better ordering
