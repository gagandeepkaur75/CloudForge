# CloudForge: Advanced Cloud-Based Collaborative Project Workspace
### 100% Serverless, Event-Driven AWS Cloud Architecture for Student Engineering Teams

[![AWS Architecture](https://img.shields.io/badge/AWS-Serverless-orange.svg?logo=amazon-aws)](https://aws.amazon.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Mangum-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TailwindCSS-61DAFB.svg?logo=react)](https://react.dev/)
[![Course](https://img.shields.io/badge/Course-Cloud%20Computing%20(UCS531)-blue.svg)](https://www.thapar.edu/)

---

## 1. Project Overview & Academic Identification
* **Course:** Cloud Computing (UCS531)
* **Academic Institution:** Thapar Institute of Engineering and Technology, Patiala
* **Faculty Advisor:** Dr. Anil Singh

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
* Upload/download files directly to **Amazon S3** via **Pre-Signed URLs** with automatic **S3 Object Versioning**.
* Asynchronously track real-time activity logs via an **EventBridge ➔ SQS ➔ Lambda** background pipeline.
* Share files externally with time-limited pre-signed links (15 min, 1 hour, 24 hours).
* Restore historical file versions with a single click using atomic `s3:CopyObject`.
* Generate immutable, timestamped final academic submission snapshots (`/snapshots/`) with automated `.zip` bundle generation.

---

## 3. End-to-End System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLOUDFORGE ARCHITECTURE                              │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ 1. USERS ]
  Student Development Teams (ProjectLead & Contributor Roles)
      │
      ▼
  [ 2. FRONTEND ]
  React.js + Tailwind CSS Project Dashboard (AWS Amplify / S3 Static Web Hosting)
      │
      ├── Authentication ──► [ Amazon Cognito User Pool + RBAC Groups ]
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
1. **Users:** Student team members assigned role-based permissions (`ProjectLead`, `Contributor`).
2. **Frontend:** React.js Single Page Application (SPA) with responsive dashboard, metrics cards, drag-and-drop uploader, version history drawer, share modal, and live activity feed.
3. **Auth + API Layer:**
   * **Amazon Cognito:** User authentication and RBAC groups (`ProjectLead`, `Contributor`).
   * **Amazon API Gateway:** REST endpoint router protected by a native Cognito JWT Authorizer.
   * **AWS Lambda (REST API):** Python 3.11 + FastAPI + Mangum providing high-performance REST APIs.
4. **Storage & Database Layer:**
   * **Amazon S3:** Stores code, datasets, reports, presentations, version history, and immutable `/snapshots/` archives. Configured with **Object Versioning**, **EventBridge notifications**, and **CORS**.
   * **Amazon DynamoDB:** Three on-demand NoSQL tables:
     * `CloudForge_Projects`: Partition key `projectId`
     * `CloudForge_FileVersions`: PK `fileId`, Sort key `versionId`
     * `CloudForge_ActivityLogs`: PK `projectId`, Sort key `timestamp`
   * **AWS Backup:** Centralized backup plan protecting DynamoDB and S3 resources.
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
│   │   ├── services/          # api.js (Axios + Cognito JWT + Mock fallback), auth.js
│   │   ├── App.jsx            # Main app router and state manager
│   │   ├── index.jsx          # React DOM entry point
│   │   └── index.css          # Tailwind CSS styling and theme
│   ├── package.json           # Dependencies: react, tailwindcss, lucide-react, axios
│   ├── vite.config.js         # Vite dev & build configuration
│   ├── tailwind.config.js     # Tailwind theme and brand color config
│   └── .env.example           # REACT_APP_API_URL, REACT_APP_USER_POOL_ID, REACT_APP_CLIENT_ID
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

All endpoints (except `/health`) require an `Authorization: Bearer <JWT>` header issued by Amazon Cognito. In local testing, requests can also pass `X-User-Email` and `X-User-Roles` headers.

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | API service health check | Public |
| `GET` | `/projects` | List projects where user is owner or member | Authenticated |
| `POST` | `/projects` | Create a new project workspace | Authenticated |
| `GET` | `/projects/{id}` | Get detailed project metadata and stats | Authenticated |
| `POST` | `/projects/{id}/members` | Invite team collaborator by email | `ProjectLead` only |
| `POST` | `/projects/{id}/upload-url` | Generate S3 Pre-Signed PUT URL (valid 300s) | Authenticated |
| `GET` | `/projects/{id}/files` | List active project files with sizes and versions | Authenticated |
| `GET` | `/projects/{id}/files/{file}/versions` | Fetch all historical S3 versions for a file | Authenticated |
| `POST` | `/projects/{id}/files/{file}/recover` | Restore historical version via `s3:CopyObject` | Authenticated |
| `POST` | `/projects/{id}/files/{file}/share` | Generate S3 Pre-Signed GET URL (15m, 1h, 24h) | Authenticated |
| `POST` | `/projects/{id}/snapshot` | Create immutable final snapshot and `.zip` archive | Authenticated |
| `GET` | `/projects/{id}/activities` | Retrieve chronological activity audit logs | Authenticated |

---

## 6. Step-by-Step Deployment Guide

### Prerequisites
* AWS Account with Administrative or PowerUser privileges.
* AWS CLI installed and configured (`aws configure`).
* Python 3.11 installed.
* Node.js v18+ and npm installed.

---

### Step 1: Provision AWS Infrastructure via CLI or SAM

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
5. Create the Cognito User Pool, Web Client, and User Groups (`ProjectLead`, `Contributor`).

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
VITE_USE_MOCK=false
```

> **Note on Local Testing & Demo Mode:**  
> If AWS credentials are not yet available, leave `VITE_USE_MOCK=true` or click the **"Mock Engine"** toggle on the login screen. CloudForge includes a complete in-browser simulation of S3 versioning, pre-signed URLs, recovery, and final zip archiving!

#### 2. Run Locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

#### 3. Deploy to AWS Amplify
1. Push your repository to GitHub.
2. In the AWS Console, open **AWS Amplify** and select **Host web app**.
3. Connect your repository and select the `frontend` directory.
4. Set the build command to `npm run build` and publish directory to `dist`.
5. Add the environment variables from your `.env` file in Amplify Console settings.
6. Click **Deploy**. Your app will be live on a global AWS CloudFront URL!

---

## 7. Academic Evaluation & Demonstration Guide

To demonstrate CloudForge for academic evaluation:
1. **One-Click Sign In:** Click on **Gagandeep Kaur (ProjectLead)** or **Puneet Singh (Contributor)** to demonstrate Cognito authentication and role-based badges.
2. **File Upload via S3 Pre-Signed URL:** Drag and drop code or a dataset; observe the upload progress bar and live S3 versioning registration.
3. **Multi-Versioning & Atomic Recovery:** Upload a modified version of the same file to show `v1` and `v2`. Open the **Version History Modal** and click **"Recover Version"** to watch `s3:CopyObject` restore historical content without deleting history.
4. **Time-Limited Sharing:** Generate a 15-minute S3 Pre-Signed GET URL and test the direct download link.
5. **Real-Time Audit Timeline:** Check the event feed on the right updating in real time with `FILE_UPLOADED`, `VERSION_RECOVERED`, and `LINK_SHARED` events.
6. **Final Academic Snapshot:** Click **"Submit Final Snapshot"** to package all active files into an immutable S3 prefix (`/snapshots/`) and download the generated `.zip` archive.

---

## 8. License & Acknowledgments
Developed for **Cloud Computing (UCS531)** at **Thapar Institute of Engineering and Technology**.  
Guided by **Dr. Anil Singh**.  
Licensed under the **MIT License**.
