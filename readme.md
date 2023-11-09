# Welcome to your CDK TypeScript project

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`CdkWorkshopStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to executes your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

# Typescript CDK
-------------------
CDK demo in which crate sample REST API using lambda function, lambda layer, api gateway, model validation. Created sample static website using s3 and cloudfront.

Table of Contents
-------------------

 * [Installation](#installation)
 * [Quick Start](#quick-start)
 * [Persistence](#developmentpersistence)
 * [Out of the box](#out-of-the-box)

 Installation
-------------------

 * [Install CDK 2.77.0 +](https://aws.amazon.com/getting-started/guides/setup-cdk/module-two/)
 * [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
 
View installed cdk and aws cli versions. Once everthing good, create appropriate iam role for aws cdk and configure in your system
```bash
cdk --version
aws --version
```

Quick Start
-------------------

Deploy sample code using CDK. download source code from git

```bash
git clone https://github.com/dineshpithiya/cdk-typescript-sample-app.git
```

Development/Persistence
-------------------

Go inside git clone folder cdk-typescript-sample-app
```bash
cd cdk-typescript-sample-app
```
Synthesize a template from your app
```bash
cdk synth
```
Bootstrapping an environment
```bash
cdk bootstrap
```
Let’s deploy
```bash
cdk deploy
```

Out of the box
-------------------
 * Ubuntu 22.04 LTS
 * CDK 2.77.0 
 * AWS CLI aws-cli/1.22.34 Python/3.10.6 Linux/5.15.0-72-generic botocore/1.23.34
 
License
-------------------

CDK + AWS CLI is open-sourced software licensed under the [AWS license](https://github.com/aws/aws-cdk/blob/main/LICENSE)
