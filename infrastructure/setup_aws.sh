#!/usr/bin/env bash
# ==============================================================================
# CloudForge AWS Infrastructure Automation Script
# Course: Cloud Computing - UCS531
# Authors: Gagandeep Kaur, Puneet Singh, Aditya Gupta
# ==============================================================================
set -euo pipefail

# Configuration parameters
AWS_REGION="${AWS_REGION:-us-east-1}"
RANDOM_SUFFIX=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 6 | head -n 1)
BUCKET_NAME="${CLOUDFORGE_BUCKET:-cloudforge-storage-${RANDOM_SUFFIX}}"
QUEUE_NAME="cloudforge-file-events-queue"
USER_POOL_NAME="cloudforge-user-pool"
USER_CLIENT_NAME="cloudforge-web-client"
EVENTBRIDGE_RULE_NAME="cloudforge-s3-events-rule"

echo "=========================================================="
echo " Starting CloudForge AWS Infrastructure Provisioning"
echo " Target Region: ${AWS_REGION}"
echo " S3 Storage Bucket: ${BUCKET_NAME}"
echo "=========================================================="

# ------------------------------------------------------------------------------
# 1. Amazon S3: Create Bucket, Enable Versioning, EventBridge & CORS
# ------------------------------------------------------------------------------
echo "--> 1. Creating Amazon S3 Bucket: ${BUCKET_NAME}"
if [ "${AWS_REGION}" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "${BUCKET_NAME}" --region "${AWS_REGION}"
else
    aws s3api create-bucket --bucket "${BUCKET_NAME}" --region "${AWS_REGION}" \
        --create-bucket-configuration LocationConstraint="${AWS_REGION}"
fi

echo "--> Enabling S3 Object Versioning..."
aws s3api put-bucket-versioning \
    --bucket "${BUCKET_NAME}" \
    --versioning-configuration Status=Enabled

echo "--> Enabling Amazon EventBridge Notifications on S3..."
aws s3api put-bucket-notification-configuration \
    --bucket "${BUCKET_NAME}" \
    --notification-configuration '{"EventBridgeConfiguration": {}}'

echo "--> Configuring CORS on S3 Bucket for direct browser uploads/downloads..."
cat << 'EOF' > /tmp/s3-cors.json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedOrigins": ["https://cloud-forge-nine.vercel.app"],
      "ExposeHeaders": ["ETag", "x-amz-version-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
aws s3api put-bucket-cors --bucket "${BUCKET_NAME}" --cors-configuration file:///tmp/s3-cors.json

# ------------------------------------------------------------------------------
# 2. Amazon DynamoDB: Provision 3 Core Metadata Tables
# ------------------------------------------------------------------------------
echo "--> 2. Provisioning Amazon DynamoDB Tables..."

echo "Creating table CloudForge_Projects..."
aws dynamodb create-table \
    --table-name CloudForge_Projects \
    --attribute-definitions AttributeName=projectId,AttributeType=S \
    --key-schema AttributeName=projectId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "${AWS_REGION}" || true

echo "Creating table CloudForge_FileVersions..."
aws dynamodb create-table \
    --table-name CloudForge_FileVersions \
    --attribute-definitions \
        AttributeName=fileId,AttributeType=S \
        AttributeName=versionId,AttributeType=S \
    --key-schema \
        AttributeName=fileId,KeyType=HASH \
        AttributeName=versionId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region "${AWS_REGION}" || true

echo "Creating table CloudForge_ActivityLogs..."
aws dynamodb create-table \
    --table-name CloudForge_ActivityLogs \
    --attribute-definitions \
        AttributeName=projectId,AttributeType=S \
        AttributeName=timestamp,AttributeType=S \
    --key-schema \
        AttributeName=projectId,KeyType=HASH \
        AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region "${AWS_REGION}" || true

# ------------------------------------------------------------------------------
# 3. Amazon SQS: Provision File Events Queue & IAM Permissions
# ------------------------------------------------------------------------------
echo "--> 3. Creating Amazon SQS Queue: ${QUEUE_NAME}"
QUEUE_URL=$(aws sqs create-queue \
    --queue-name "${QUEUE_NAME}" \
    --attributes VisibilityTimeout=120 \
    --query "QueueUrl" --output text --region "${AWS_REGION}")
QUEUE_ARN=$(aws sqs get-queue-attributes \
    --queue-url "${QUEUE_URL}" \
    --attribute-names QueueArn \
    --query "Attributes.QueueArn" --output text --region "${AWS_REGION}")

echo "Queue URL: ${QUEUE_URL}"
echo "Queue ARN: ${QUEUE_ARN}"

# Allow EventBridge to publish to SQS
cat << EOF > /tmp/sqs-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEventBridgeToSend",
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "sqs:SendMessage",
      "Resource": "${QUEUE_ARN}"
    }
  ]
}
EOF
aws sqs set-queue-attributes \
    --queue-url "${QUEUE_URL}" \
    --attributes Policy="$(cat /tmp/sqs-policy.json | tr -d '\n')" \
    --region "${AWS_REGION}"

# ------------------------------------------------------------------------------
# 4. Amazon EventBridge: Route S3 Events to SQS
# ------------------------------------------------------------------------------
echo "--> 4. Configuring Amazon EventBridge Rule..."
EVENT_PATTERN=$(cat << EOF
{
  "source": ["aws.s3"],
  "detail-type": ["Object Created", "Object Deleted"],
  "detail": {
    "bucket": {
      "name": ["${BUCKET_NAME}"]
    }
  }
}
EOF
)

aws events put-rule \
    --name "${EVENTBRIDGE_RULE_NAME}" \
    --event-pattern "${EVENT_PATTERN}" \
    --state ENABLED \
    --description "Capture S3 Object events for CloudForge projects and route to SQS" \
    --region "${AWS_REGION}"

aws events put-targets \
    --rule "${EVENTBRIDGE_RULE_NAME}" \
    --targets "Id"="1","Arn"="${QUEUE_ARN}" \
    --region "${AWS_REGION}"

# ------------------------------------------------------------------------------
# 5. Amazon Cognito: User Pool, Web Client & legacy groups
# ------------------------------------------------------------------------------
echo "--> 5. Setting up Amazon Cognito User Pool, Web Client & legacy groups..."
USER_POOL_ID=$(aws cognito-idp create-user-pool \
    --pool-name "${USER_POOL_NAME}" \
    --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false}}' \
    --auto-verified-attributes email \
    --username-attributes email \
    --query "UserPool.Id" --output text --region "${AWS_REGION}")

CLIENT_ID=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "${USER_POOL_ID}" \
    --client-name "${USER_CLIENT_NAME}" \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --query "UserPoolClient.ClientId" --output text --region "${AWS_REGION}")

# These groups are not used for project authorization; the API checks DynamoDB membership.
echo "Creating legacy Cognito groups (not used for project authorization)..."
aws cognito-idp create-group \
    --group-name "ProjectLead" \
    --user-pool-id "${USER_POOL_ID}" \
    --description "Project Leads with administrative management and invitation privileges" \
    --region "${AWS_REGION}" || true

aws cognito-idp create-group \
    --group-name "Contributor" \
    --user-pool-id "${USER_POOL_ID}" \
    --description "Student contributors who can upload, edit, share, and review files" \
    --region "${AWS_REGION}" || true

# ------------------------------------------------------------------------------
# Output Summary
# ------------------------------------------------------------------------------
echo "=========================================================="
echo " CloudForge Infrastructure Setup Completed Successfully! "
echo "=========================================================="
echo "S3 Bucket Name:        ${BUCKET_NAME}"
echo "Cognito User Pool ID:  ${USER_POOL_ID}"
echo "Cognito Client ID:     ${CLIENT_ID}"
echo "SQS Queue URL:         ${QUEUE_URL}"
echo "SQS Queue ARN:         ${QUEUE_ARN}"
echo "Region:                ${AWS_REGION}"
echo ""
echo "Save these variables to your frontend/.env and backend configuration!"
