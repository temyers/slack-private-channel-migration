provider "aws" {
  region     = "ap-southeast-2"
}

variable "region" {
  default = "ap-southeast-2"
}

variable "contact" {
  default = "tim.myerscough@mechanicalrock.io"
}

variable "environment" {
  default = "dev"
}

variable "app" {
  default = "slack-migration"
}



resource "aws_sns_topic" "dead_letter_topic" {
  name = "slack_migration_dead_letters",
  display_name = "Slack Migration - Dead Letters"
}

resource "aws_sns_topic" "migrate_message" {
  name = "slack_migration_migrate_message",
  display_name = "Slack Migration - Migrate Message"
}

resource "aws_sns_topic" "migrate_channel" {
  name = "slack_migration_migrate_channel",
  display_name = "Slack Migration - Migrate Channel"
}

resource "aws_sns_topic" "migrate_event" {
  name = "slack_migration_migrate_event",
  display_name = "Slack Migration - Migrate Event"
}

resource "aws_sns_topic" "channel_migrated" {
  name = "slack_migration_channel_migrated",
  display_name = "Slack Migration - Channel Migrated Event"
}

resource "aws_sns_topic" "rapids" {
  name = "slack_migration_rapids",
  display_name = "Slack Migration - Rapids Event"
}

resource "aws_kinesis_stream" "slack_stream" {
  name             = "slack_stream"
  shard_count      = 1
  retention_period = 24

  shard_level_metrics = [
    "IncomingBytes",
    "OutgoingBytes",
  ]

  tags {
    Environment = "${var.environment}"
    Contact = "${var.contact}"
    App = "${var.app}"
  }
}

output "dead_letter_arn" {
  value = "${aws_sns_topic.dead_letter_topic.arn}"
  description = "The ARN of the dead letter topic, for sending failed messages to."
}

output "migrate_message_arn" {
  value = "${aws_sns_topic.migrate_message.arn}"
  description = "The ARN of the migrate message topic"
}

output "migrate_channel_arn" {
  value = "${aws_sns_topic.migrate_channel.arn}"
  description = "The ARN of the migrate channel topic"
}

output "migrate_event_arn" {
  value = "${aws_sns_topic.migrate_channel.arn}"
  description = "The ARN of the migrate channel topic"
}
