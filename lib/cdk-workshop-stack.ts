import { Duration, 
  Stack, 
  StackProps, 
  CfnOutput,
  RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cdk from 'aws-cdk-lib';

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, name: string, props?: StackProps) {
    super(scope, name, props);

    /*==Lambda function, api gateway and model validation==*/
      // defines an AWS Lambda resource
      const getUser = new lambda.Function(this, 'HelloHandler', {
        runtime: lambda.Runtime.NODEJS_16_X,    // execution environment
        code: lambda.Code.fromAsset('lambda/helloHandler'),  // code loaded from "lambda" directory
        handler: 'index.handler',                // file is "hello", function is "handler"
        functionName: 'helloHandler'
      });
      // defines an API Gateway REST API resource backed by our "hello" function.
      const getUserApi = new apigw.LambdaRestApi(this, 'Endpoint', {
        restApiName:"getUser",
        description: 'example api gateway',
        deployOptions: {
          stageName: 'dev',
        },
        proxy:false,
        handler: getUser,
        defaultCorsPreflightOptions:  {
          allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
          ],
          allowOrigins: apigw.Cors.ALL_ORIGINS,
          allowMethods: ["GET"]
        }
      });
      const getUserModel = new apigw.Model(this, "model-validator", {
        restApi: getUserApi,
        contentType: "application/json",
        description: "To validate the request body",
        modelName: "getUsermodelcdk",
        schema: {
          schema: apigw.JsonSchemaVersion.DRAFT4,
          title: 'pollRequest',
          type: apigw.JsonSchemaType.OBJECT,
          required: ["username","phone","email"],
          properties: {
            "username": { 
              type: apigw.JsonSchemaType.STRING,
              pattern: "^[a-zA-Z]"
            },
            "phone": { 
              type: apigw.JsonSchemaType.STRING,
              pattern: "^[0-9]"
            },
            "email": { 
              type: apigw.JsonSchemaType.STRING ,
              pattern: "^(.+)@(.+)$"
            },
          },
        },
      });
      const getUserApiIntegration = new apigw.LambdaIntegration(getUser);
      const items = getUserApi.root.addResource("getUser");
      const users = getUserApi.root.addResource("user");
      items.addMethod("GET", getUserApiIntegration);
      users.addMethod("POST", getUserApiIntegration, {
        requestValidator: new apigw.RequestValidator(
          this,
          "body-validator",
          {
            restApi: getUserApi,
            requestValidatorName: "body-validator",
            validateRequestBody: true,
          }
        ),
        requestModels: {
          "application/json": getUserModel,
        },
      });
    /*==End==*/
    /*==Simple static web site using s3 and cloudfront==*/
      var siteDomain=`${this.account}-static-website`
      const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI', {
        comment: `OAI for ${name}`
      });
      new CfnOutput(this, 'Site', { value: 'http://' + siteDomain });
      // Content bucket
      const siteBucket = new s3.Bucket(this, 'SiteBucket', {
        bucketName: siteDomain,
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

        /**
         * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
         * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
         * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
         */
        removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code

        /**
         * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
         * setting will enable full cleanup of the demo.
         */
        autoDeleteObjects: true, // NOT recommended for production code
      });
      // Grant access to cloudfront
      siteBucket.addToResourcePolicy(new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [siteBucket.arnForObjects('*')],
        principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
      }));
      new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });
      // CloudFront distribution
      const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
        defaultRootObject: "index.html",
        //domainNames: [siteDomain],
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        errorResponses:[
          {
            httpStatus: 403,
            responseHttpStatus: 403,
            responsePagePath: '/error.html',
            ttl: Duration.minutes(30),
          }
        ],
        defaultBehavior: {
          origin: new cloudfront_origins.S3Origin(siteBucket, {originAccessIdentity: cloudfrontOAI}),
          compress: true,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        }
      })
      new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
      // Deploy site contents to S3 bucket
      new s3deployment.BucketDeployment(this, 'DeployWithInvalidation', {
        sources: [s3deployment.Source.asset("./site-contents")],
        destinationBucket: siteBucket,
        distribution,
        distributionPaths: ['/*'],
      });
    /*==End==*/
    /*==Layer example using nodeJs and python==*/
      //Create lambda layer 1 for node js
      const layer_1 = new lambda.LayerVersion(this, 'CommonNodeJsUtilsL1', {
        code: lambda.Code.fromAsset('lambda/layers/nodejs_layers/layer_1'),
        description: 'axios and lodash npm library',
        compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });
      //Create lambda layer 2 for node js
      const layer_2 = new lambda.LayerVersion(this, 'CommonNodeJsUtilsL2', {
        code: lambda.Code.fromAsset('lambda/layers/nodejs_layers/layer_2'),
        description: 'Custom utility',
        compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });
      // Integrate layer 1 and layer 2 with lambda function
      const nodeLayerLambda = new lambda.Function(this, 'NodeJsLayerTest', {
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromAsset('lambda/nodeJsLayerHandler'),
        handler: 'index.handler',
        functionName:'nodeJsLayerTest',
        environment:{
          "URL":"https://google.com"
        },
        timeout: Duration.seconds(30),
        layers:[layer_1,layer_2]
      });

      //Create lambda layer 1 for python
      const layer_3 = new lambda.LayerVersion(this, 'CommonPythonUtilsL1', {
        code: lambda.Code.fromAsset('lambda/layers/python_layers/layer_1'),
        description: 'fastjsonschema and requests pip library',
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });
      //Create lambda layer 2 for python
      const layer_4 = new lambda.LayerVersion(this, 'CommonPythonUtilsL2', {
        code: lambda.Code.fromAsset('lambda/layers/python_layers/layer_2'),
        description: 'custom utility',
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
        removalPolicy: cdk.RemovalPolicy.DESTROY
      });
      // Integrate layer 1 and layer 2 with lambda function
      const pythonLayerLambda = new lambda.Function(this, 'PythonLayerTest', {
        runtime: lambda.Runtime.PYTHON_3_10,
        code: lambda.Code.fromAsset('lambda/pythonLayerHandler'),
        handler: 'index.handler',
        functionName:'pythonLayerTest',
        timeout: Duration.seconds(30),
        layers:[layer_3,layer_4]
      });
    /*==End==*/
  }
}