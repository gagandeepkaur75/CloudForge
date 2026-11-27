# CloudForge: Advanced Cloud-Based Collaborative Project Workspace
### A Serverless, Event-Driven Architecture for Academic Software Engineering Teams
**Course:** Cloud Computing - UCS531  
**Department:** Computer Science & Engineering, Thapar Institute of Engineering & Technology  

> **Deployment status:** This document currently describes the intended architecture and local implementation. No AWS deployment was performed as part of this work; existing resource state is unverified. Do not present AWS integration, performance measurements, or test outcomes below as verified results until reproduced in the approved sandbox.

**Team Details:**
* **Gagandeep Kaur** (Roll No: 1024170063, Email: `gkaur10_be24@thapar.edu`)
* **Puneet Singh** (Roll No: 1024170066, Email: `psingh18_be24@thapar.edu`)
* **Aditya Gupta** (Roll No: 1024170204, Email: `agupta5_be24@thapar.edu`)

---

## Abstract
Modern university computer science curricula increasingly center around multi-member team development projects spanning software design, machine learning models, distributed data processing, and technical reporting. However, academic teams encounter recurrent operational failure modes: destructive overwriting of shared files, loss of critical dataset iterations, absence of role-based authorization, insecure ad-hoc file sharing, and chaotic eleventh-hour project submission compilation. 

This report describes the intended design and local implementation of **CloudForge**, a collaborative workspace designed around AWS serverless services. The repository contains a React frontend, a FastAPI backend, and infrastructure definitions for Cognito, API Gateway, Lambda, DynamoDB, and S3. AWS authentication, database persistence, file storage, event processing, performance, and end-to-end behavior were not verified in this work. The backend code includes pre-signed file operations, version recovery, and timestamped ZIP snapshots; snapshots are not immutable because S3 Object Lock is not configured.

---

## 1. Introduction & Problem Justification
Collaborative software engineering in an academic environment involves diverse digital artifacts, including source code files, model weights, exploratory data analysis notebooks, multi-gigabyte training corpora, formal IEEE technical reports, and presentation slide decks. While Git and GitHub effectively address textual source code version control, they are ill-suited for non-textual, binary, or large-scale assets such as compiled weights (`.pt`, `.h5`), large tabular datasets (`.csv`, `.parquet`), and slide decks (`.pptx`).

Consequently, student development teams resort to generic personal cloud storage drives (e.g., Google Drive, Dropbox, OneDrive) or instant messaging attachments. This ad-hoc approach introduces five severe technical vulnerabilities:
1. **Destructive Version Overwriting:** Simultaneous uploads overwrite previous states without preserving granular delta records or historical rollbacks.
2. **Lack of Granular Role-Based Access Control (RBAC):** All project collaborators possess identical destructive capabilities, preventing project leads from enforcing submission lockdowns or governing membership.
3. **Security Vulnerabilities in External Sharing:** Sharing project artifacts with external evaluators or peer teams typically requires making URLs public without time-bound expiration, violating least-privilege principles.
4. **Absence of Audit Observability:** Team leads cannot inspect when modifications occurred, which member initiated a change, or which file versions contributed to a benchmark.
5. **Final Submission Integrity Failure:** The process of manually synthesizing disparate deliverables into a single submission folder often yields corrupted archives, missing configuration files, or submission of obsolete drafts.

CloudForge resolves these challenges by combining cloud-native object versioning, serverless compute, event queues, and NoSQL metadata management into a cohesive, user-friendly platform.

---

## 2. Cloud Architecture & System Design

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLOUDFORGE ARCHITECTURE                              │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ 1. CLIENT LAYER ]
  Student Web Browsers (project roles: Admin / Editor / Contributor / Viewer)
          │
          │ HTTPS
          ▼
  [ 2. PRESENTATION LAYER ]
  Vercel (current React.js + Tailwind CSS frontend)
          │
          ├── (1) Authenticate User / Obtain JWT Token
          ▼
  [ 3. AUTH & API LAYER ]
  Planned Amazon Cognito User Pool
          │
          ├── (2) HTTPS API Requests + Bearer JWT Token
          ▼
  Amazon API Gateway (HTTP REST API with Cognito JWT Authorizer)
          │
          ▼
  AWS Lambda: REST API Handler (Python 3.11 + FastAPI + Mangum)
          │
          ├── (3) Generate Pre-Signed S3 URLs ───────┐
          ├── (4) Read/Write Project Metadata        │
          │                                          │
          ▼                                          ▼
  [ 4. STORAGE & DATA LAYER ]               [ DIRECT TRANSFER ]
  Amazon DynamoDB                          Client Browser ◄──► Amazon S3 Storage Bucket
   ├── CloudForge_Projects                                     ├── S3 Object Versioning: ON
   ├── CloudForge_FileVersions                                 ├── S3 EventBridge: ON
   └── CloudForge_ActivityLogs                                 └── S3 CORS: Defined in template
          ▲                                                           │
          │                                                           │ Object Created/Deleted
          │                                                           ▼
  [ 5. EVENT PROCESSING LAYER ]                              Amazon EventBridge
  AWS Lambda: Event Worker                                            │
   ├── Reads S3 VersionId & Size                                      ▼
   ├── Updates DynamoDB FileVersions                         Amazon SQS Queue
   └── Inserts FILE_UPLOADED Log                             (cloudforge-file-events-queue)
          │
          ▼
  Amazon CloudWatch (Centralized Metrics, Invocations, Latency & Logs)
```

The target CloudForge architecture is structured into five distinct, loosely coupled layers:

### 2.1 Layer 1: Client & User Tier
Users interact with CloudForge via modern web browsers. Project roles are stored with project membership and checked by the API:
* **Admin:** Project owner; can invite members and create snapshots.
* **Editor / Contributor:** Can perform the file operations allowed by the API.
* **Viewer:** Can read project data and files.

### 2.2 Layer 2: Frontend Single Page Application (SPA)
The user interface is built with React 18, Tailwind CSS, and Lucide icons. The current frontend is hosted on Vercel. When connected to a deployed backend, it is designed to provide:
* Real-time metrics overview (projects count, storage consumed, contributors, submission status).
* Drag-and-drop file uploader with dynamic S3 upload progress tracking.
* Filterable multi-category file explorer (Source Code, Dataset, Report & Docs, Presentation).
* Version history inspection modal and atomic version recovery button.
* Configurable pre-signed sharing modal (15 min, 1 hour, 24 hours).
* Chronological event timeline streaming real-time background audit logs.

### 2.3 Layer 3: Authentication and API Gateway Layer
* **Amazon Cognito User Pool:** The SAM template defines user registration, email verification, password reset, and token flows; the pool has not been deployed or tested.
* **Amazon API Gateway:** The SAM template defines a Cognito-compatible JWT authorizer. Authorization has not been tested against a deployed API.
* **AWS Lambda (REST API Handler):** The repository contains a FastAPI application wrapped with Mangum; deployment and runtime behavior are unverified.

### 2.4 Layer 4: Storage & Data Tier
* **Amazon S3:** The SAM template defines project file and snapshot storage with:
  1. **Object Versioning:** Intended to retain object revisions under S3 version IDs.
  2. **EventBridge Notifications:** Emits state-change notifications directly to the default event bus.
  3. **CORS Configuration:** Enables secure direct browser `PUT` and `GET` requests from authorized web origins.
* **Amazon DynamoDB:** Three schemaless, on-demand tables:
  * `CloudForge_Projects`: Partition key `projectId` (String). Stores title, description, owner, member email lists, cumulative storage bytes, and snapshot status.
  * `CloudForge_FileVersions`: Partition key `fileId` (String: `{projectId}/{fileName}`), Sort key `versionId` (String). Stores object size, uploader identity, timestamp, S3 key, and category.
  * `CloudForge_ActivityLogs`: Partition key `projectId` (String), Sort key `timestamp` (String ISO-8601). Stores action codes (`FILE_UPLOADED`, `VERSION_RECOVERED`, `LINK_SHARED`, `SNAPSHOT_CREATED`), actor, and contextual details.
* **AWS Backup:** Not configured or deployed by the SAM template.

### 2.5 Layer 5: Asynchronous Event Processing & Monitoring
The repository includes code and infrastructure definitions for an asynchronous event pipeline. Its deployed behavior has not been verified:
1. S3 emits an `Object Created` event upon successful client upload.
2. Amazon EventBridge evaluates a rule matching `source: ["aws.s3"]` and routes the event payload to an Amazon SQS FIFO/Standard queue (`cloudforge-file-events-queue`).
3. An SQS-triggered AWS Lambda function (`event_worker/worker.py`) consumes batches of up to 10 events.
4. The worker extracts the S3 `versionId` and object size, updates `CloudForge_FileVersions`, recalculates project storage in `CloudForge_Projects`, and writes a `FILE_UPLOADED` entry into `CloudForge_ActivityLogs`.
5. Events matching `/snapshots/` prefixes are explicitly filtered out to eliminate recursive processing loops.

---

## 3. Justification of AWS Cloud Services

| AWS Service | Architectural Role | Technical Justification |
| :--- | :--- | :--- |
| **AWS Lambda** | Compute | Serverless compute for the API and event worker. Costs and sandbox limits must be confirmed before deployment. |
| **Amazon S3** | Object Storage | 99.999999999% (11 9's) durability; native object versioning; direct client-to-storage transfer via pre-signed URLs. |
| **Amazon DynamoDB** | NoSQL Database | On-demand NoSQL storage for project and activity records; charges may apply and limits are unverified. |
| **Amazon API Gateway** | API Management | The template defines Cognito JWT validation and CORS; deployed behavior is unverified. |
| **Amazon Cognito** | Identity & Auth | Planned managed identity provider for registration and password authentication; project authorization is checked separately by the backend. |
| **Amazon EventBridge** | Event Routing | Native integration with S3; rule-based filtering; seamless routing to queues without glue code. |
| **Amazon SQS** | Message Queue | Decouples event generation from background processing; buffers bursts during team submission deadlines. |
| **Amazon CloudWatch** | Monitoring | Unified aggregation of Lambda execution logs, error metrics, API latencies, and invocation counts. |
| **AWS Backup** | Disaster Recovery | Not configured or deployed; do not assume recovery plans exist. |

---

## 4. Key Implementation Details

### 4.1 Zero-Bottleneck File Uploads (Pre-Signed PUT URLs)
Traditional web architectures route multi-megabyte file uploads through application server memory, saturating bandwidth and risking Lambda 29-second payload timeout limits. CloudForge implements a three-step out-of-band upload workflow:
1. The frontend invokes `POST /projects/{projectId}/upload-url` with filename and MIME type.
2. The Lambda REST API calls `boto3.client('s3').generate_presigned_url('put_object', ...)` with an expiration of 300 seconds.
3. The React frontend transmits the raw file binary directly to S3 via an HTTP `PUT` request with upload progress tracked via Axios `onUploadProgress`.

### 4.2 Atomic Version Recovery (`s3:CopyObject`)
When a student initiates version recovery in the UI:
1. The frontend submits `POST /projects/{projectId}/files/{fileName}/recover` with the target `versionId`.
2. The backend Lambda invokes:
   ```python
   s3_client.copy_object(
       Bucket=S3_BUCKET,
       Key=s3_key,
       CopySource={'Bucket': S3_BUCKET, 'Key': s3_key, 'VersionId': req.versionId},
       MetadataDirective='COPY'
   )
   ```
3. S3 creates a new current version mirroring the historical state without destroying or modifying intervening versions, preserving complete audit immutability.

### 4.3 Time-Limited External Sharing (Pre-Signed GET URLs)
To allow external evaluators to review specific deliverables without compromising workspace security:
1. The user specifies a duration (15 minutes, 1 hour, or 24 hours).
2. The backend generates an S3 pre-signed `get_object` URL embedding signature parameters and expiration timestamps.
3. An audit record `LINK_SHARED` is recorded in `CloudForge_ActivityLogs`.

### 4.4 Automated Submission Snapshots & Archival
When a project admin creates a snapshot:
1. `POST /projects/{projectId}/snapshot` iterates over all active files under `projects/{projectId}/`.
2. Each file is copied into a timestamped S3 prefix: `snapshots/{projectId}/{timestamp}/`.
3. In-memory zip compilation (`zipfile.ZipFile`) aggregates all assets into a compressed archive `final_submission_{projectId}_{timestamp}.zip` uploaded to S3.
4. The project record is updated with snapshot metadata and a temporary download URL is generated. This does not lock the project or provide immutable retention.

---

## 5. Verification, Testing & Experimental Results

### 5.1 Test Plan & Validation Status

| Test Case ID | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | User registration, confirmation, and login | Cognito accepts valid user and rejects invalid password | Not run; Cognito configuration and availability are unverified | **NOT RUN** |
| **TC-02** | Project membership authorization | Non-members receive HTTP 403 | Not run against a deployed API | **NOT RUN** |
| **TC-03** | File upload/download | File is persisted in S3 and downloadable by an authorized member | Not run; S3 configuration and availability are unverified | **NOT RUN** |
| **TC-04** | File version listing and recovery | Historical version is available and can be restored | Not run against S3 | **NOT RUN** |
| **TC-05** | Expiring share URL | URL expires after configured window | Not run against S3 | **NOT RUN** |
| **TC-06** | Snapshot creation | Timestamped S3 files and ZIP can be downloaded | Not run; S3 and DynamoDB configuration and availability are unverified | **NOT RUN** |
| **TC-07** | Frontend production build | Vite creates a production bundle | `npm run build` completed locally | **PASS (local build only)** |

### 5.2 Performance & Scalability Benchmarks
No cloud performance benchmarks have been run. API latency, upload throughput, event delivery, and AWS costs must be measured after deployment in an approved environment.

---

## 6. Conclusion & Future Work
CloudForge contains a local frontend and backend implementation plus AWS infrastructure definitions. It is not yet a deployed cloud service. Authentication, DynamoDB persistence, S3 storage, permissions, activity processing, security, and cost behavior require deployment and verification before they can be described as working.

**Future Enhancements:**
1. Integration of Amazon Rekognition or AWS Lambda container tasks for automated code security scanning and anti-plagiarism checks on uploaded codebases.
2. Embedding Amazon Athena over S3 parquet datasets for direct in-browser SQL analytics.
3. Automated integration with university grading portals via webhooks upon submission snapshot creation.

---

## 7. References
1. Amazon Web Services, "Building Serverless Applications with Amazon API Gateway and AWS Lambda," AWS Whitepapers, 2024.
2. Amazon Web Services, "Using Amazon S3 Object Versioning and Lifecycle Policies," AWS Documentation, 2024.
3. Thapar Institute of Engineering and Technology, "UCS531: Cloud Computing Course Curriculum," Department of Computer Science & Engineering, 2026.
4. Martin Fowler, "Event-Driven Architecture and Decoupled Cloud Systems," IEEE Software, 2022.
