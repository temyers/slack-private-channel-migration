# slack-private-channel-migration
[Slack](https://slack.com) bot to migrate private channels from one team to another.

Sample project for building a Serverless, event driven, micro-service architecture.

Presented at Latency Conference 2017

## Pre-requisites

* You have at least one Slack Account configured
* You have an AWS account with credentials for command line access.
* Docker, and Docker-compose is installed

## Installation

* Add a slack bot (https://api.slack.com/apps) with the following permissions:  
  * channels:history
  * channels:read
  * channels:write
  * chat:write:bot
  * chat:write:user
  * files:read
  * files:write:user
  * groups:history
  * groups:read
  * groups:write
  * links:read
  * links:write
  * users.profile:read
  * users:read
* Note down the OAuth token - `xoxp-123456789012-123456789012-123456789012-123456789012abcdef1234567890abcd`

## Localstack

For full documentation, see https://bitbucket.org/atlassian/localstack

### Terraform

This project requires some resources configured using Terraform.

To run the infrastructure:

`docker-compose run --rm terraform`

```
> cd infrastructure
> terraform plan
> terraform apply
```

### Dev environment

A Docker development environment is provided:

```
docker-compose build dev-env
docker-compose run --rm dev-env
```

Install dependencies
```
>yarn install
```

### Running Tests:

Run unit tests:
```
npm run test
```

Run integration & acceptance tests
```
export SOURCE_TEAM_TOKEN_integration=xoxp-123456789012-123456789012-123456789012-123456789012abcdef1234567890abcd
npm run test_it
npm run test_accept
```

### Serverless WebPack Integration
To invoke the webpack bundled function locally
```
serverless webpack invoke --function [your function name]
```

To bundle the function
```
serverless webpack
```
Bundled assets will be created in **.webpack** folder

More information can be found [here](https://github.com/elastic-coders/serverless-webpack). Not all third party modules can be bundled. Look on [this](https://webpack.github.io/docs/configuration.html#externals) webpack configuration on externals to exclude modules.

When you do **serverless deploy** , it will deploy the bundled assets.

Deploy to dev:
```
npm run deploy:dev
```

##### Clone the Repo

```
git clone {{repo}}
```
