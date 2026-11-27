# CloudForge: Advanced Cloud-Based Collaborative Project Workspace
### Serverless, Event-Driven AWS Architecture Design for Student Engineering Teams

> **Implementation status:** Stage 1 updates are local code changes only; no AWS deployment was performed as part of this work. Existing AWS resource state is unverified, and Cognito, DynamoDB, S3, and API Gateway have not been end-to-end tested. The current frontend deployment may still use an earlier build. Do not treat the architecture below as a live AWS deployment.
>
> The deployment scripts and SAM template can create AWS resources and may incur charges. AWS account permissions, Vocareum sandbox limits, and costs are unverified. Do not run deployment or provisioning commands until an administrator confirms what is permitted and the potential charges are understood.

[![AWS Architecture](https://img.shields.io/badge/AWS-Serverless-orange.svg?logo=amazon-aws)](https://aws.amazon.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Mangum-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TailwindCSS-61DAFB.svg?logo=react)](https://react.dev/)
[![Course](https://img.shields.io/badge/Course-Cloud%20Computing%20(UCS531)-blue.svg)](https://www.thapar.edu/)

---

## 1. Project Overview & Academic Identification
* **Course:** Cloud Computing (UCS531)
* **Academic Institution:** Thapar Institute of Engineering and Technology, Patiala

### Development Team
| Team Member | Roll No. | University Email | Phone |
| :--- | :--- | :--- | :--- |
| **Gagandeep Kaur** | 1024170063 | `gkaur10_be24@thapar.edu` | +91 9478402714 |
| **Puneet Singh** | 1024170066 | `psingh18_be24@thapar.edu` | +91 7340983346 |
| **Aditya Gupta** | 1024170204 | `agupta5_be24@thapar.edu` | +91 9582159039 |

---

## 2. Problem Statement & Solution

### The Problem
Student development teams struggle with:
1. **Accidental File Overwriting:** Team members frequently overwrite code, datasets, or reports on shared drives without version history.
2. **Lack of Role-Based Permissions (RBAC):** All team members have equal destructive access with no project lead governance.
3. **Insecure File Sharing:** Sharing files with evaluators or peer teams often involves permanent public links without expiration.
4. **No Real-Time Activity Tracking:** Inability to audit who modified files, when versions changed, or what actions were performed.
5. **Chaotic Final Submissions:** Manually assembling deliverables into a final submission zip file causes missing dependencies, mismatched versions, and grading disputes.

### The CloudForge Solution
A cloud-native, serverless, and event-driven workspace where student teams:
* Manage project code, datasets, reports, and slide decks in one centralized hub.
* Designed to upload and download files from **Amazon S3** using pre-signed URLs and S3 Object Versioning when configured.
* Includes code for activity logging and an **EventBridge ➔ SQS ➔ Lambda** background pipeline; cloud deployment is pending.
* Supports time-limited pre-signed file links when the backend is deployed.
* Includes an API for restoring historical file versions using `s3:CopyObject`.
* Can generate timestamped S3 snapshot folders and `.zip` archives. S3 Object Lock and immutable retention are not configured.

---

## 3. End-to-End System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLOUDFORGE ARCHITECTURE                              │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ 1. USERS ]
  Student Development Teams (project roles: Admin, Editor, Contributor, Viewer)
      │
      ▼
  [ 2. FRONTEND ]
  React.js + Tailwind CSS Project Dashboard (currently hosted on Vercel)
      │
      ├── Authentication ──► [ Planned Amazon Cognito User Pool ]
      │
      ├── REST API Calls ──► [ Amazon API Gateway (Cognito JWT Authorizer) ]
      │                            │
      │                            ▼
      │                      [ AWS Lambda: REST API Handler (FastAPI + Mangum) ]
      │                            │
      │                            ├── Read/Write Metadata ──► [ Amazon DynamoDB (3 Tables) ]
      │                            └── Pre-Signed URL Gen  ──► [ Amazon S3 Bucket ]
      │
      └── Direct Data Transfer ──────────────────────────────► [ Amazon S3 (Versioned) ]
                                                                   │
                                                            Object Events
                                                                   │
                                                                   ▼
  [ 5. EVENT PROCESSING LAYER ]                              Amazon EventBridge
  Amazon CloudWatch ◄── [ AWS Lambda: Event Worker ] ◄── Amazon SQS Queue
                                                         (cloudforge-file-events-queue)
```

### The 5 Architectural Layers
1. **Users:** Intended Cognito-authenticated team members with API access determined by project ownership and membership.
2. **Frontend:** React.js Single Page Application (SPA) with responsive dashboard, metrics cards, drag-and-drop uploader, version history drawer, share modal, and live activity feed.
3. **Auth + API Layer:**
   * **Amazon Cognito:** User Pool email/password sign-in, signup confirmation, password reset and JWT issuance.
   * **Amazon API Gateway:** HTTP API protected by a Cognito-compatible JWT Authorizer; project membership is enforced by the Lambda handler.
   * **AWS Lambda (REST API):** Python 3.11 + FastAPI + Mangum providing high-performance REST APIs.
4. **Storage & Database Layer:**
   * **Amazon S3:** The SAM template defines project-file and `/snapshots/` storage, **Object Versioning**, **EventBridge notifications**, and frontend-origin-restricted **CORS**. These resources have not been deployed. S3 Object Lock is not configured.
   * **Amazon DynamoDB:** Three on-demand NoSQL tables:
     * `CloudForge_Projects`: Partition key `projectId`
     * `CloudForge_FileVersions`: PK `fileId`, Sort key `versionId`
     * `CloudForge_ActivityLogs`: PK `projectId`, Sort key `timestamp`
   * **AWS Backup:** A sample plan document exists, but the SAM template does not deploy an AWS Backup vault or plan.
5. **Event Processing & Monitoring Layer:**
   * **Amazon EventBridge:** Captures S3 `Object Created` and `Object Deleted` events and routes them to SQS.
   * **Amazon SQS:** Durable queue (`cloudforge-file-events-queue`) decoupling file storage events from backend processing.
   * **AWS Lambda (Event Worker):** Triggered by SQS batches; updates `CloudForge_FileVersions`, recalculates project storage, and writes audit logs to `CloudForge_ActivityLogs`.
   * **Amazon CloudWatch:** Real-time metrics dashboard, invocation logs, and error tracing.

---

## 4. Repository Structure

```text
cloudforge/
├── frontend/                  # React.js + Tailwind CSS Project Dashboard
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # Navbar, FileTable, VersionModal, ShareModal, ActivityFeed, InviteModal, SnapshotModal
│   │   ├── pages/             # Login, DashboardOverview, ProjectWorkspace
│   │   ├── services/          # api.js (Axios + Cognito JWT), auth.js
│   │   ├── App.jsx            # Main app router and state manager
│   │   ├── index.jsx          # React DOM entry point
│   │   └── index.css          # Tailwind CSS styling and theme
│   ├── package.json           # Dependencies: react, tailwindcss, lucide-react, axios
│   ├── vite.config.js         # Vite dev & build configuration
│   ├── tailwind.config.js     # Tailwind theme and brand color config
│   └── .env.example           # Vite API URL and Cognito public configuration
├── backend/                   # Python Backend & Event Worker
│   ├── api_handler/           # REST API Lambda (FastAPI + Mangum)
│   │   ├── main.py            # All REST endpoints with Cognito auth & S3 logic
│   │   └── requirements.txt   # fastapi, mangum, boto3, pydantic
│   └── event_worker/          # SQS-triggered Background Lambda
│       ├── worker.py          # Parses S3->EventBridge->SQS events, logs versions & activity
│       └── requirements.txt   # boto3
├── infrastructure/            # AWS Setup Scripts & IaC
│   ├── setup_aws.sh           # Automated Bash script using AWS CLI
│   ├── setup_aws.ps1          # Automated PowerShell script for Windows
│   ├── iam-policy.json        # Least-privilege IAM policy for Lambda execution
│   ├── template.yaml          # AWS SAM / CloudFormation IaC deployment template
│   └── aws_backup_plan.json   # AWS Backup vault and protection plan definition
├── docs/                      # Academic Submission Deliverables
│   ├── Project_Proposal.md    # Formal proposal with problem statement & objectives
│   ├── Project_Report.md      # Comprehensive 5-page technical report draft
│   └── Presentation_Outline.md# 10-slide presentation & step-by-step live demo script
└── README.md                  # Complete deployment guide & API reference
```

---

## 5. REST API Reference

The API Gateway JWT authorizer requires a Cognito-issued bearer token for all routes. The backend reads identity only from validated API Gateway authorizer claims. Development identity headers are not accepted. Project-scoped routes additionally check that the authenticated email is the project owner or a member.

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | API service health check | Authenticated |
| `GET` | `/projects` | List projects where user is owner or member | Authenticated |
| `POST` | `/projects` | Create a new project workspace | Authenticated |
| `GET` | `/projects/{id}` | Get project metadata | Project owner/member |
| `POST` | `/projects/{id}/members` | Add a project member | Project Admin |
| `POST` | `/projects/{id}/upload-url` | Generate S3 Pre-Signed PUT URL (valid 300s) | Project Admin/Editor/Contributor |
| `GET` | `/projects/{id}/files` | List project files | Project owner/member |
| `DELETE` | `/projects/{id}/files/{file}` | Delete the current S3 object version (bucket versioning may retain older versions) | Project Admin/Editor/Contributor |
| `GET` | `/projects/{id}/files/{file}/versions` | Fetch S3 versions for a project file | Project owner/member |
| `GET` | `/projects/{id}/files/{file}/download` | Generate a temporary file download URL | Project owner/member |
| `GET` | `/projects/{id}/files/{file}/versions/download?versionId=...` | Generate a temporary historical-version download URL | Project owner/member |
| `POST` | `/projects/{id}/files/{file}/recover` | Restore historical version via `s3:CopyObject` | Project Admin/Editor |
| `POST` | `/projects/{id}/files/{file}/share` | Generate an expiring S3 Pre-Signed GET URL | Project Admin/Editor/Contributor |
| `POST` | `/projects/{id}/snapshot` | Create a point-in-time S3 archive and `.zip` | Project Admin |
| `GET` | `/projects/{id}/snapshots` | List project snapshots and issue temporary download URLs | Project owner/member |
| `GET` | `/projects/{id}/activities` | Retrieve chronological activity audit logs | Project owner/member |

---

## 6. Step-by-Step Deployment Guide

### Prerequisites
* AWS Account with Administrative or PowerUser privileges.
* AWS CLI installed and configured (`aws configure`).
* Python 3.11 installed.
* Node.js v18+ and npm installed.

---

### Step 1: Provision AWS Infrastructure via CLI or SAM

> **Do not run this step without explicit approval.** It creates AWS resources, and charges or sandbox restrictions may apply. This repository has not been validated against the ACCDEV sandbox permissions or its current cost limits.

#### Option A: Automated CLI Script (Recommended)
On Linux/macOS:
```bash
cd infrastructure
chmod +x setup_aws.sh
./setup_aws.sh
```

On Windows (PowerShell):
```powershell
cd infrastructure
.\setup_aws.ps1 -Region us-east-1
```

The script will automatically:
1. Create the S3 bucket with **Object Versioning**, **EventBridge notifications**, and **CORS**.
2. Provision the 3 DynamoDB tables (`CloudForge_Projects`, `CloudForge_FileVersions`, `CloudForge_ActivityLogs`).
3. Create the SQS queue (`cloudforge-file-events-queue`) with policies allowing EventBridge publishing.
4. Create the EventBridge rule matching S3 events and routing to SQS.
5. Create the Cognito User Pool and app client. Project permissions are checked from project membership in DynamoDB; Cognito groups do not grant project access.

#### Option B: AWS SAM Deployment
```bash
cd infrastructure
sam build
sam deploy --guided
```

---

### Step 2: Deploy Backend Lambdas

Package and deploy the REST API handler:
```bash
cd backend/api_handler
pip install -r requirements.txt -t .
zip -r api_handler.zip .
aws lambda create-function \
  --function-name cloudforge-api-handler \
  --runtime python3.11 \
  --handler main.handler \
  --role <LAMBDA_EXECUTION_ROLE_ARN> \
  --zip-file fileb://api_handler.zip \
  --environment "Variables={CLOUDFORGE_S3_BUCKET=<BUCKET_NAME>,PROJECTS_TABLE=CloudForge_Projects,FILE_VERSIONS_TABLE=CloudForge_FileVersions,ACTIVITY_LOGS_TABLE=CloudForge_ActivityLogs}"
```

Deploy the SQS-triggered Event Worker:
```bash
cd ../event_worker
pip install -r requirements.txt -t .
zip -r event_worker.zip .
aws lambda create-function \
  --function-name cloudforge-event-worker \
  --runtime python3.11 \
  --handler worker.lambda_handler \
  --role <LAMBDA_EXECUTION_ROLE_ARN> \
  --zip-file fileb://event_worker.zip \
  --environment "Variables={PROJECTS_TABLE=CloudForge_Projects,FILE_VERSIONS_TABLE=CloudForge_FileVersions,ACTIVITY_LOGS_TABLE=CloudForge_ActivityLogs}"

# Attach SQS trigger to the worker
aws lambda create-event-source-mapping \
  --function-name cloudforge-event-worker \
  --batch-size 10 \
  --event-source-arn <SQS_QUEUE_ARN>
```

---

### Step 3: Run and Deploy Frontend

#### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cd frontend
cp .env.example .env
```
Fill in the outputs from Step 1:
```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=us-east-1
```

> There is no mock-authentication or local-data fallback. The Cognito User Pool, app client, and API Gateway URL must be configured for authentication and project APIs to work. Vite configuration values are public identifiers, not AWS credentials; never put AWS access keys or secrets in frontend environment variables.

#### 2. Run Locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite in your terminal (normally `http://localhost:5173`).

#### 3. Deploy to AWS Amplify
1. Push your repository to GitHub.
2. In the AWS Console, open **AWS Amplify** and select **Host web app**.
3. Connect your repository and select the `frontend` directory.
4. Set the build command to `npm run build` and publish directory to `dist`.
5. Add the environment variables from your `.env` file in Amplify Console settings.
6. Click **Deploy**. Your app will be live on a global AWS CloudFront URL!

---

## 7. Academic Evaluation & Demonstration Guide

There are no seeded demo accounts or instant-login shortcuts. After an AWS deployment is approved and configured, create a Cognito user through the sign-up screen, then verify authentication, project access, file upload/download, version recovery, sharing, activity logs, and snapshot creation. These AWS-backed flows have not yet been deployed or end-to-end tested; S3 snapshots are not immutable unless Object Lock is separately configured.

---

## 8. License & Acknowledgments
Developed for **Cloud Computing (UCS531)** at **Thapar Institute of Engineering and Technology**.  
Licensed under the **MIT License**.
