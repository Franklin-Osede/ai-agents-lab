import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as rds from "aws-cdk-lib/aws-rds";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. VPC (Virtual Private Cloud)
    // - 2 Availability Zones for high availability
    // - 1 NAT Gateway to save costs (Standard SaaS practice: Private subnets for backend)
    const vpc = new ec2.Vpc(this, "AiAgentsLabVpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    // 2. Database (RDS PostgreSQL)
    // - Budget friendly: t4g.micro (ARM based, cheaper)
    // - Security: Private subnet (not accessible from internet)
    const db = new rds.DatabaseInstance(this, "AiAgentsDB", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Autoscaling storage
      databaseName: "ai_agents_core",
      deletionProtection: false, // For MVP/Dev only
      publiclyAccessible: false,
    });

    // Allow Fargate to connect to DB
    // We will grant access rule later when service is created,
    // or by default security group logic if we attach properly.

    // 3. ECS Cluster (Fargate)
    const cluster = new ecs.Cluster(this, "AiAgentsCluster", {
      vpc,
      containerInsights: true, // Metrics
    });

    // 4. Load Balancer + Fargate Service
    // - Placeholder image for now (Standard Hello World)
    // - Will be replaced by our NestJS image later
    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "AiAgentsApiService",
        {
          cluster,
          memoryLimitMiB: 512, // Minimal cost
          cpu: 256, // Minimal cost
          taskImageOptions: {
            image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
            secrets: {
              // Securely retrieve the password from the auto-generated RDS secret
              POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(db.secret!),
            },
            environment: {
              NODE_ENV: "production",
              // Database Connection (Injected from the RDS resource above)
              POSTGRES_HOST: db.dbInstanceEndpointAddress,
              POSTGRES_PORT: db.dbInstanceEndpointPort.toString(),
              POSTGRES_USER: "postgres", // Default for RDS
              POSTGRES_DB: "ai_agents_core",

              // AWS Config (For Bedrock/Polly)
              AWS_REGION: cdk.Stack.of(this).region,

              // App Config
              PORT: "80",
            },
          },
          publicLoadBalancer: true,
        }
      );

    // Grant DB Access
    db.connections.allowFrom(fargateService.service, ec2.Port.tcp(5432));

    // Output values to connect via CLI later if needed
    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: db.dbInstanceEndpointAddress,
    });
  }
}
