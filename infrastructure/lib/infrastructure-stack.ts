import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // INFRASTRUCTURE REMOVED
    // Since we are using Render (Backend) and Vercel (Frontend),
    // we do not need to deploy any infrastructure on AWS via CDK.
    
    // AWS Bedrock and AWS Polly are accessed via APIs using IAM User Credentials (in .env),
    // so they do not require CloudFormation resources here.
    
    // If you ever need a custom VPC or private DB on AWS, uncomment or restore the previous code.
  }
}
