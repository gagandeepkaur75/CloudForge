# Project Proposal: CloudForge
## Advanced Cloud-Based Collaborative Project Workspace
**Course:** Cloud Computing (UCS531)  
**Academic Institution:** Thapar Institute of Engineering and Technology  

---

### Project Team Members
| Name | Roll No. | Email | Phone Number |
| :--- | :--- | :--- | :--- |
| **Gagandeep Kaur** | 1024170063 | `gkaur10_be24@thapar.edu` | 9478402714 |
| **Puneet Singh** | 1024170066 | `psingh18_be24@thapar.edu` | 7340983346 |
| **Aditya Gupta** | 1024170204 | `agupta5_be24@thapar.edu` | 9582159039 |

---

## 1. Executive Summary
University student engineering teams collaborating on multi-disciplinary software projects frequently suffer from fragmented project files, overwritten source code, lost datasets, lack of role-based permissions, unmonitored file sharing, and chaotic final project submissions. 

**CloudForge** is an enterprise-grade, serverless, and event-driven cloud collaborative workspace tailored specifically for academic development teams. Operating entirely on Amazon Web Services (AWS), CloudForge empowers student teams to manage project resources (source code, datasets, technical reports, and slide decks) with automatic multi-versioning, real-time activity auditing via asynchronous event queues, time-limited secure external sharing via pre-signed URLs, one-click version recovery, and immutable final academic submission snapshots.

---

## 2. Problem Statement
In traditional university engineering courses:
1. **Version Overwrites & Asset Loss:** Students frequently overwrite team members' code, reports, or research datasets across cloud drives (e.g., Google Drive, WhatsApp, zip attachments), with no automated version control for non-Git binary assets (large CSVs, HDF5 datasets, compiled models, presentation decks).
2. **Access Control Deficiencies:** Generic storage lacks fine-grained Role-Based Access Control (RBAC) distinguishing project leads from team contributors.
3. **Insecure Sharing:** Sharing files with external evaluators or peer reviewers often involves making files publicly accessible indefinitely without expiration limits.
4. **Lack of Auditability:** Team leads cannot track who uploaded or modified files, when changes occurred, or who accessed specific assets.
5. **Chaotic Final Submissions:** Generating the final project submission package requires manually assembling files from various sources, frequently resulting in missing dependencies, mismatched versions, and grading disputes.

---

## 3. Project Objectives
* **Serverless Architecture:** Eliminate infrastructure provisioning and idle operational costs by utilizing 100% AWS serverless technologies (AWS Lambda, Amazon API Gateway, Amazon DynamoDB, Amazon S3).
* **Automatic Version Tracking & Recovery:** Leverage S3 Object Versioning coupled with DynamoDB metadata indexing to record every object mutation and provide one-click point-in-time recovery.
* **Decoupled Asynchronous Event Pipeline:** Implement an EventBridge-to-SQS-to-Lambda pipeline to handle background version indexing, storage recalculation, and activity logging without bottlenecking user API latency.
* **Direct High-Throughput Storage Transfers:** Implement S3 Pre-Signed PUT and GET URLs to bypass backend servers during file transfers, enabling rapid uploads and time-limited external access (15 min, 1 hour, 24 hours).
* **Immutable Submission Snapshots:** Provide a one-click automated packaging mechanism that bundles all active project assets into an immutable S3 prefix (`/snapshots/{projectId}/{timestamp}/`) and generates a sealed `.zip` archive for faculty evaluation.

---

## 4. System Architecture
CloudForge implements a modern 5-layer serverless architecture:

```text
[ 1. USERS ]
Student Development Teams (ProjectLead & Contributor Roles)
      │
      ▼
[ 2. FRONTEND LAYER ]
React.js + Tailwind CSS Single Page Application (AWS Amplify / S3 Static Hosting)
      │
      ├── Authentication ──► [ Amazon Cognito User Pool + RBAC Groups ]
      │
      ├── REST API Calls ──► [ Amazon API Gateway (Cognito JWT Authorizer) ]
      │                            │
      │                            ▼
      │                      [ AWS Lambda (FastAPI + Mangum REST API) ]
      │                            │
      │                            ├── Metadata Read/Write ──► [ Amazon DynamoDB (3 Tables) ]
      │                            └── Pre-Signed URL Gen  ──► [ Amazon S3 Bucket ]
      │
      └── Direct Data Transfer ──────────────────────────────► [ Amazon S3 (Versioned) ]
                                                                   │
                                                            Object Events
                                                                   │
                                                                   ▼
[ 5. EVENT PROCESSING LAYER ]                                [ Amazon EventBridge ]
AWS CloudWatch Monitoring ◄── [ AWS Lambda (Event Worker) ] ◄── [ Amazon SQS Queue ]
```

### Architectural Layers:
1. **User Tier:** Student developers accessing the dashboard via modern web browsers with role-based identities (`ProjectLead`, `Contributor`).
2. **Presentation Tier:** Responsive React.js dashboard featuring metrics widgets, drag-and-drop uploader, version history drawer, temporary sharing modal, and activity timeline.
3. **Authentication & API Tier:** Amazon Cognito User Pool managing user authentication and JWT token issuance; Amazon API Gateway validating tokens via a Cognito Authorizer and routing traffic to a Python 3.11 FastAPI backend running on AWS Lambda.
4. **Data & Storage Tier:**
   * **Amazon S3:** Object storage configured with **Object Versioning**, **EventBridge notifications**, and **CORS**.
   * **Amazon DynamoDB:** Three on-demand NoSQL tables (`CloudForge_Projects`, `CloudForge_FileVersions`, `CloudForge_ActivityLogs`).
   * **AWS Backup:** Centralized backup plan protecting DynamoDB tables and S3 buckets with daily recovery points.
5. **Event Processing & Observability Tier:** Amazon EventBridge capturing S3 object creation/deletion events, buffering them into Amazon SQS (`cloudforge-file-events-queue`), and triggering a background Lambda worker that updates metadata and records audit logs. Amazon CloudWatch collects execution logs and API metrics.

---

## 5. Technology Stack Summary
* **Cloud Platform:** Amazon Web Services (AWS)
* **Frontend:** React.js, Tailwind CSS, Lucide Icons, Axios, Vite
* **Backend:** Python 3.11, FastAPI, Mangum, Boto3 (AWS SDK)
* **Auth & Security:** Amazon Cognito User Pools, JWT Tokens, IAM Least-Privilege Policies
* **Database:** Amazon DynamoDB (On-Demand / Pay-Per-Request)
* **Storage:** Amazon S3 (Object Versioning enabled)
* **Event Stream:** Amazon EventBridge, Amazon SQS
* **Monitoring & Backup:** Amazon CloudWatch, AWS Backup
* **Infrastructure as Code:** AWS CLI Automation (`setup_aws.sh`, `setup_aws.ps1`), AWS SAM (`template.yaml`)

---

## 6. Project Timeline & Milestones
* **Phase 1 (Week 1–2):** Architecture definition, database schema design, and AWS IAM security policy formulation.
* **Phase 2 (Week 3–4):** Provisioning of AWS core services (Cognito, S3, DynamoDB, SQS, EventBridge) and backend REST API implementation using FastAPI.
* **Phase 3 (Week 5–6):** Event worker Lambda development for SQS processing; S3 Pre-signed URL integration for direct client uploads/downloads.
* **Phase 4 (Week 7–8):** React.js frontend development with responsive UI components, version modal, share drawer, and activity feed.
* **Phase 5 (Week 9–10):** System integration testing, end-to-end cloud deployment on AWS, performance benchmarking, and technical report finalization.
