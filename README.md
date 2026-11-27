# CloudForge: Cloud-Based Collaborative Project Workspace

### A serverless, event-driven workspace for student teams, built on AWS

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange.svg?logo=amazon-aws)](https://aws.amazon.com/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Mangum%20on%20Lambda-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-61DAFB.svg?logo=react)](https://react.dev/)
[![Course](https://img.shields.io/badge/Course-Cloud%20Computing%20(UCS531)-blue.svg)](https://www.thapar.edu/)

---

## 1. Overview

**Course:** Cloud Computing (UCS531), Thapar Institute of Engineering and Technology, Patiala

CloudForge lets a student team keep all project files in one place with **automatic version history**, **per-project roles**, **time-limited share links**, an **activity log**, and a **one-click final submission snapshot (ZIP)**. It runs entirely on managed AWS services: there are no servers to patch, and it costs almost nothing when idle.

### Team

| Team member | Roll no. |
| :--- | :--- |
| _Add team members here_ | |

---

## 2. Problem and solution

**Problems student teams face**

1. Files get overwritten on shared drives with no history.
2. Everyone has the same (destructive) access; there is no project lead control.
3. Files are shared through permanent public links.
4. Nobody can see who changed what, or when.
5. Final submissions are assembled by hand, causing missing or mismatched files.

**How CloudForge solves them**

| Problem | CloudForge feature | AWS service behind it |
| :--- | :--- | :--- |
| Overwritten files | Every upload is a new version; any old version can be restored | S3 Versioning |
| Equal access for all | Per-project roles: Admin, Editor/Contributor, Viewer | Cognito identity + roles stored in DynamoDB, checked in Lambda |
| Permanent public links | Share links that expire after 15 minutes to 24 hours | S3 pre-signed URLs |
| No audit trail | Activity log of uploads, recoveries, shares, member changes | EventBridge, SQS, Lambda worker, DynamoDB |
| Messy submissions | Snapshot copies all files to a dated folder and builds a ZIP | S3 + Lambda |

---

## 3. Architecture

```text
                         ┌──────────────────────────────┐
   Student's browser ───►│  Amazon CloudFront (HTTPS)   │───► Amazon S3 (frontend bucket, private)
          │              └──────────────────────────────┘      React/Vite static build
          │
          │ 1. Sign in (email + password)
          ├──────────────────────────────► Amazon Cognito User Pool ──► returns JWT ID token
          │
          │ 2. API calls with "Authorization: Bearer <ID token>"
          ▼
   Amazon API Gateway (HTTP API)
     └─ Cognito JWT authorizer (rejects missing/invalid tokens with 401)
          │
          ▼
   AWS Lambda: ApiHandlerFunction (Python 3.11, FastAPI + Mangum)
     ├─ reads/writes ───────────────► Amazon DynamoDB
     │                                  CloudForge_Projects
     │                                  CloudForge_FileVersions
     │                                  CloudForge_ActivityLogs
     └─ creates pre-signed URLs ────► Amazon S3 workspace bucket (versioned, encrypted, private)
                                            ▲
   3. Browser uploads/downloads directly ───┘
                                            │ "Object Created" event
                                            ▼
                                  Amazon EventBridge rule
                                            │
                                            ▼
                                  Amazon SQS queue ──(after 5 failures)──► SQS dead-letter queue
                                            │
                                            ▼
                     AWS Lambda: EventWorkerFunction (Python 3.11)
                       ├─ records the new version ──► DynamoDB CloudForge_FileVersions
                       ├─ recalculates storage ─────► DynamoDB CloudForge_Projects
                       └─ writes audit entry ───────► DynamoDB CloudForge_ActivityLogs

   Amazon CloudWatch: Lambda logs (14-day retention), 6 alarms (Lambda errors/throttles,
   API 5xx, dead-letter queue not empty) that email the team through Amazon SNS, and the
   "cloudforge-overview" dashboard.
```

### 3.1 AWS services used

| # | AWS service | Role in CloudForge | Resource(s) | Key configuration |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Amazon Cognito** | User sign-in and identity | Existing user pool + public app client | `USER_PASSWORD_AUTH` flow, no client secret, verified email required by the API |
| 2 | **Amazon API Gateway** (HTTP API) | Single HTTPS entry point for the REST API | `WorkspaceApi` | Cognito JWT authorizer on every route except the CORS preflight (`OPTIONS /{proxy+}`, no auth); CORS limited to the frontend origin |
| 3 | **AWS Lambda** (API) | Runs all REST endpoints | `ApiHandlerFunction` | Python 3.11, FastAPI via Mangum, 512 MB, 30 s timeout, `/{proxy+}` route |
| 4 | **AWS Lambda** (worker) | Processes file events in the background | `EventWorkerFunction` | Python 3.11, triggered by SQS, batch size 10 |
| 5 | **Amazon S3** (workspace) | Stores project files, versions and snapshots | `cloudforge-workspace-<account>-<region>` | Versioning on, SSE-S3 (AES-256) encryption, all public access blocked, EventBridge notifications on, CORS for the frontend |
| 6 | **Amazon DynamoDB** | Metadata, versions and audit log | `CloudForge_Projects` (PK `projectId`), `CloudForge_FileVersions` (PK `fileId`, SK `versionId`), `CloudForge_ActivityLogs` (PK `projectId`, SK `timestamp`) | On-demand (pay per request); point-in-time recovery (35-day continuous backups) on all 3 tables |
| 7 | **Amazon EventBridge** | Routes S3 "Object Created" events | `cloudforge-s3-events-rule` | Filters on the workspace bucket; target is the SQS queue |
| 8 | **Amazon SQS** | Buffers events so none are lost; retries failures | `cloudforge-file-events-queue` + dead-letter queue | 180 s visibility timeout; moved to DLQ after 5 failed attempts; DLQ keeps messages 14 days |
| 9 | **Amazon CloudWatch** | Logs, metrics, alarms, dashboard | 2 Lambda log groups, 6 alarms, `cloudforge-overview` dashboard | Log retention 14 days (parameter); alarms on Lambda Errors/Throttles (both functions), API Gateway 5xx, and DLQ depth; dashboard shows API traffic/latency, Lambda, SQS and DynamoDB |
| 10 | **Amazon SNS** | Sends alarm notifications | `CloudForge Alarms` topic | Optional email subscription (`AlarmEmail` parameter) |
| 11 | **Amazon CloudFront** | Serves the React app over HTTPS worldwide | Frontend distribution | Private S3 origin via Origin Access Control; HTTPS only; security headers; unknown paths return `index.html` so page refresh works |
| 12 | **Amazon S3** (frontend) | Holds the built website files | Frontend bucket | Private; readable only by CloudFront |
| 13 | **AWS CloudFormation / SAM** | Infrastructure as code: creates everything above in one step | Stack `cloudforge` (+ frontend stack) | `infrastructure/template.yaml` |
| 14 | **AWS IAM** | Permissions for Lambda | Existing lab `LabRole` | No new roles are created |

### 3.2 How a request flows

**Sign-in**

1. The user enters email and password on the CloudFront-hosted site.
2. The browser calls Cognito (`InitiateAuth`, `USER_PASSWORD_AUTH`) and receives an **ID token** (JWT).
3. Every API call sends `Authorization: Bearer <ID token>`. API Gateway checks the token's signature, issuer and audience before Lambda runs. Lambda additionally requires an ID token with a verified email.

**Uploading a file**

1. The browser asks the API for an upload URL: `POST /projects/{id}/upload-url`.
2. Lambda checks the user may write to that project, then returns an **S3 pre-signed PUT URL** valid for 5 minutes.
3. The browser uploads the file **directly to S3** (the file never passes through Lambda, so there is no size or time bottleneck).
4. S3 stores it as a **new version** and sends an "Object Created" event to EventBridge.
5. EventBridge puts the event on the SQS queue; SQS triggers the worker Lambda.
6. The worker records the version, updates the project's storage total, and writes an activity-log entry in DynamoDB.
7. If the worker fails 5 times, the message moves to the dead-letter queue for inspection instead of being lost.

**Restoring an old version:** Lambda copies the chosen S3 version on top of the file (`CopyObject`). This creates a new latest version, so no history is ever deleted.

**Sharing:** Lambda creates a pre-signed GET URL that expires after 15 minutes to 24 hours.

**Snapshot:** Lambda copies all current project files into `snapshots/{projectId}/{timestamp}/`, builds a ZIP (up to 50 MB), and marks the project as submitted.

### 3.3 Why serverless?

| Requirement | How the design meets it |
| :--- | :--- |
| **Scalability** | Lambda, API Gateway, S3, SQS and on-demand DynamoDB scale automatically with load. |
| **Cost** | Pay per request; near-zero cost when nobody is using it. No idle servers. |
| **Reliability** | Managed, multi-AZ services. SQS buffers events and retries; a DLQ catches persistent failures. S3 versioning and DynamoDB point-in-time recovery protect data. |
| **Observability** | CloudWatch logs, a dashboard and alarms (emailed through SNS) show errors, throttling and failed events. |
| **Security** | JWT auth at the gateway, per-project role checks in code, private encrypted buckets, short-lived pre-signed URLs, HTTPS everywhere. |
| **Decoupling** | Uploads go straight to S3; bookkeeping happens asynchronously through EventBridge and SQS, so the user is never kept waiting. |
| **Repeatability** | The whole backend is one SAM/CloudFormation template; it can be created and deleted in minutes. |

---

## 4. Roles and permissions

Roles are per project and stored on the project record in DynamoDB. Lambda checks them on every request.

| Action | Admin (owner) | Editor / Contributor | Viewer | Not a member |
| :--- | :-: | :-: | :-: | :-: |
| View project, files, versions, activity | ✓ | ✓ | ✓ | ✗ (403) |
| Upload, recover version, delete file, folders | ✓ | ✓ | ✗ | ✗ |
| Invite members, change roles, remove members | ✓ | ✗ | ✗ | ✗ |
| Create submission snapshot | ✓ | ✗ | ✗ | ✗ |

---

## 5. REST API reference

All routes need `Authorization: Bearer <Cognito ID token>`. Base URL is the `ApiEndpoint` output of the stack.

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/health` | Health check |
| GET, POST | `/projects` | List my projects / create a project |
| GET, PUT, DELETE | `/projects/{projectId}` | Get / update / delete a project (delete only when empty) |
| GET, POST | `/projects/{projectId}/members` | List / invite members |
| PUT, DELETE | `/projects/{projectId}/members/{email}` | Change role / remove member |
| POST | `/projects/{projectId}/upload-url` | Get a pre-signed S3 upload URL |
| GET | `/projects/{projectId}/files` | List files |
| DELETE | `/projects/{projectId}/files/{fileName}` | Delete a file |
| GET | `/projects/{projectId}/files/{fileName}/versions` | List versions of a file |
| GET | `/projects/{projectId}/files/{fileName}/download` | 5-minute download link for the current file |
| GET | `/projects/{projectId}/files/{fileName}/versions/download?versionId=...` | 5-minute download link for an older version |
| POST | `/projects/{projectId}/files/{fileName}/recover` | Restore an older version |
| POST | `/projects/{projectId}/files/{fileName}/share` | Create a time-limited share link |
| GET, POST | `/projects/{projectId}/folders` | List / create folders |
| DELETE | `/projects/{projectId}/folders/{name}` | Delete an empty folder |
| POST | `/projects/{projectId}/snapshot` | Create a final submission snapshot (ZIP) |
| GET | `/projects/{projectId}/activities` | Project activity log |
| GET | `/activities` | Activity across my projects |
| GET | `/snapshots` | List my snapshots |

---

## 6. Repository structure

```text
CloudForge/
├── frontend/                      React 18 + Vite + Tailwind single-page app
│   ├── src/
│   │   ├── pages/                 Login, Dashboard, Projects, Workspace, Versions, Activity, ...
│   │   ├── components/            File table, version/share/invite/snapshot modals, ...
│   │   └── services/
│   │       ├── auth.js            Cognito sign-in (USER_PASSWORD_AUTH), token storage
│   │       └── api.js             Axios client; sends the ID token to API Gateway
│   └── .env.example               VITE_API_URL, VITE_USER_POOL_ID, VITE_CLIENT_ID, VITE_AWS_REGION
├── backend/
│   ├── api_handler/main.py        REST API Lambda (FastAPI + Mangum)
│   └── event_worker/worker.py     SQS-triggered worker Lambda
├── infrastructure/
│   ├── template.yaml              AWS SAM template: the whole backend + monitoring
│   ├── frontend-hosting.yaml      CloudFormation: private S3 bucket + CloudFront (OAC)
│   ├── deploy_frontend.sh / .ps1  Build the React app, upload to S3, invalidate CloudFront
│   ├── iam-policy.json            Reference least-privilege policy (not deployed in the lab)
│   └── aws_backup_plan.json       Reference AWS Backup plan (not deployed)
└── docs/                          Proposal, report, presentation, deployment guide
```

---

## 7. Deployment (summary)

Full click-by-click instructions are in **[AWS_DEPLOY_GUIDE.md](AWS_DEPLOY_GUIDE.md)**. Everything is done from **AWS CloudShell** in `us-east-1`:

1. Upload `CloudForge-ready.zip` to CloudShell and unzip it.
2. Create the frontend hosting and note its URL: `STACK_ONLY=1 bash infrastructure/deploy_frontend.sh`.
3. Install Python 3.11 (`sudo dnf install -y python3.11`), then:
   ```bash
   sam build --template-file infrastructure/template.yaml
   sam deploy --guided   # stack: cloudforge; give pool ID, client ID, LabRole ARN, CloudFront URL
   ```
4. Create test users in Cognito.
5. Build and upload the frontend (the script reads `VITE_API_URL` from the backend stack):
   `BACKEND_STACK=cloudforge SKIP_STACK=1 VITE_USER_POOL_ID=... VITE_CLIENT_ID=... bash infrastructure/deploy_frontend.sh`
6. When done: empty the buckets, then `sam delete --stack-name cloudforge` and delete the `cloudforge-frontend` stack.

**Template parameters**

| Parameter | Meaning |
| :--- | :--- |
| `ExistingUserPoolId` | Cognito user pool ID, e.g. `us-east-1_AbC123` |
| `ExistingClientId` | Cognito app client ID (public, no secret) |
| `LabRoleArn` | `arn:aws:iam::<account-id>:role/LabRole` |
| `FrontendOrigin` | Exact frontend origin, e.g. `https://d123.cloudfront.net` (no trailing slash) |
| `AlarmEmail` | Optional email for alarm notifications (confirm the SNS email) |
| `LogRetentionDays` | Days to keep Lambda logs (default 14) |
| `CreateDashboard` | `true` to create the CloudWatch dashboard (default) |

**Frontend build variables** (baked in at build time; the deploy script sets them)

| Variable | Value |
| :--- | :--- |
| `VITE_API_URL` | `ApiEndpoint` stack output |
| `VITE_USER_POOL_ID` | Cognito user pool ID |
| `VITE_CLIENT_ID` | Cognito app client ID |
| `VITE_AWS_REGION` | `us-east-1` |

---

## 8. Security notes

* No AWS keys are stored in the code, the frontend or the repository. Lambda uses its execution role; the browser only ever holds a Cognito token and short-lived pre-signed URLs.
* Both S3 buckets block all public access. The workspace bucket is encrypted at rest (SSE-S3).
* CORS on the API and the workspace bucket allows only the exact frontend origin.
* CloudFront reads the private website bucket through Origin Access Control and adds security headers (HSTS and others).
* `.env` files are not committed.

---

## 9. Cost

All services are pay-per-use and, at student-project traffic, fall within or close to the AWS Free Tier (6 alarms and 1 dashboard are within the CloudWatch free tier of 10 alarms and 3 dashboards). The main costs if anything is left running are S3 storage (including old versions), DynamoDB point-in-time recovery and CloudWatch log storage, each a few cents at this size. Tear the stacks down after demos (see the deployment guide, Part 8).

---

## 10. Current limitations

* New-account sign-up and password reset from the website depend on the Cognito configuration; test accounts are created by an administrator in the lab.
* Share links are pre-signed URLs and cannot be revoked individually; in the lab they may expire early because the lab's credentials are temporary.
* Snapshots are versioned copies, not legally immutable (S3 Object Lock is not enabled).
* Renaming files is not implemented yet.
* AWS Backup is not provisioned (DynamoDB point-in-time recovery and S3 versioning are used instead); `aws_backup_plan.json` is a reference only.
* Event processing is at-least-once, so a duplicate activity entry is possible.

---

## 11. License

Developed for **Cloud Computing (UCS531)** at **Thapar Institute of Engineering and Technology**. Licensed under the MIT License.
