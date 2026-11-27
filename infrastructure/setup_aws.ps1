# ==============================================================================
# CloudForge AWS Infrastructure Automation Script (PowerShell for Windows)
# Course: Cloud Computing - UCS531
# Authors: Gagandeep Kaur, Puneet Singh, Aditya Gupta
# ==============================================================================
param (
    [string]$Region = "us-east-1",
    [string]$BucketPrefix = "cloudforge-storage"
)

$ErrorActionPreference = "Stop"

$RandomSuffix = -join ((97..122) + (48..57) | Get-Random -Count 6 | ForEach-Object {[char]$_})
$BucketName = "$BucketPrefix-$RandomSuffix"
$QueueName = "cloudforge-file-events-queue"
$UserPoolName = "cloudforge-user-pool"
$UserClientName = "cloudforge-web-client"
$EventRuleName = "cloudforge-s3-events-rule"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting CloudForge AWS Infrastructure Provisioning" -ForegroundColor Cyan
Write-Host " Region: $Region" -ForegroundColor Green
Write-Host " Bucket: $BucketName" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. S3
Write-Host "--> 1. Creating S3 Bucket: $BucketName" -ForegroundColor Yellow
if ($Region -eq "us-east-1") {
    aws s3api create-bucket --bucket $BucketName --region $Region
} else {
    aws s3api create-bucket --bucket $BucketName --region $Region --create-bucket-configuration LocationConstraint=$Region
}

Write-Host "--> Enabling S3 Versioning..." -ForegroundColor Yellow
aws s3api put-bucket-versioning --bucket $BucketName --versioning-configuration Status=Enabled

Write-Host "--> Enabling EventBridge Notifications on S3..." -ForegroundColor Yellow
aws s3api put-bucket-notification-configuration --bucket $BucketName --notification-configuration '{\"EventBridgeConfiguration\": {}}'

$corsConfig = @'
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
'@
Set-Content -Path "$env:TEMP\s3-cors.json" -Value $corsConfig
aws s3api put-bucket-cors --bucket $BucketName --cors-configuration "file://$env:TEMP\s3-cors.json"

# 2. DynamoDB
Write-Host "--> 2. Provisioning DynamoDB Tables..." -ForegroundColor Yellow
aws dynamodb create-table --table-name CloudForge_Projects --attribute-definitions AttributeName=projectId,AttributeType=S --key-schema AttributeName=projectId,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $Region
aws dynamodb create-table --table-name CloudForge_FileVersions --attribute-definitions AttributeName=fileId,AttributeType=S AttributeName=versionId,AttributeType=S --key-schema AttributeName=fileId,KeyType=HASH AttributeName=versionId,KeyType=RANGE --billing-mode PAY_PER_REQUEST --region $Region
aws dynamodb create-table --table-name CloudForge_ActivityLogs --attribute-definitions AttributeName=projectId,AttributeType=S AttributeName=timestamp,AttributeType=S --key-schema AttributeName=projectId,KeyType=HASH AttributeName=timestamp,KeyType=RANGE --billing-mode PAY_PER_REQUEST --region $Region

# 3. SQS
Write-Host "--> 3. Creating SQS Queue..." -ForegroundColor Yellow
$QueueUrl = aws sqs create-queue --queue-name $QueueName --attributes VisibilityTimeout=120 --query "QueueUrl" --output text --region $Region
$QueueArn = aws sqs get-queue-attributes --queue-url $QueueUrl --attribute-names QueueArn --query "Attributes.QueueArn" --output text --region $Region

$sqsPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEventBridgeToSend",
      "Effect": "Allow",
      "Principal": { "Service": "events.amazonaws.com" },
      "Action": "sqs:SendMessage",
      "Resource": "$QueueArn"
    }
  ]
}
"@
Set-Content -Path "$env:TEMP\sqs-policy.json" -Value $sqsPolicy
aws sqs set-queue-attributes --queue-url $QueueUrl --attributes Policy=(Get-Content "$env:TEMP\sqs-policy.json" -Raw) --region $Region

# 4. EventBridge
Write-Host "--> 4. Configuring EventBridge Rule..." -ForegroundColor Yellow
$eventPattern = @"
{
  "source": ["aws.s3"],
  "detail-type": ["Object Created", "Object Deleted"],
  "detail": { "bucket": { "name": ["$BucketName"] } }
}
"@
aws events put-rule --name $EventRuleName --event-pattern $eventPattern --state ENABLED --description "Route S3 events to SQS" --region $Region
aws events put-targets --rule $EventRuleName --targets "Id"="1","Arn"="$QueueArn" --region $Region

# 5. Cognito
Write-Host "--> 5. Creating Cognito User Pool, Web Client & legacy groups..." -ForegroundColor Yellow
$UserPoolId = aws cognito-idp create-user-pool --pool-name $UserPoolName --policies '{\"PasswordPolicy\":{\"MinimumLength\":8,\"RequireUppercase\":true,\"RequireLowercase\":true,\"RequireNumbers\":true,\"RequireSymbols\":false}}' --auto-verified-attributes email --username-attributes email --query "UserPool.Id" --output text --region $Region
$ClientId = aws cognito-idp create-user-pool-client --user-pool-id $UserPoolId --client-name $UserClientName --no-generate-secret --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH --query "UserPoolClient.ClientId" --output text --region $Region

# These groups are not used for project authorization; the API checks DynamoDB membership.
aws cognito-idp create-group --group-name "ProjectLead" --user-pool-id $UserPoolId --description "Project Leads" --region $Region
aws cognito-idp create-group --group-name "Contributor" --user-pool-id $UserPoolId --description "Student Contributors" --region $Region

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " CloudForge AWS Infrastructure Setup Completed!" -ForegroundColor Green
Write-Host " Bucket:       $BucketName" -ForegroundColor White
Write-Host " UserPoolId:   $UserPoolId" -ForegroundColor White
Write-Host " ClientId:     $ClientId" -ForegroundColor White
Write-Host " QueueUrl:     $QueueUrl" -ForegroundColor White
Write-Host " Region:       $Region" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
