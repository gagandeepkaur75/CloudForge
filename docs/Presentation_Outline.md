# CloudForge: 10-Slide Academic Presentation & Deployment-Test Plan
**Course:** Cloud Computing (UCS531)  
**Academic Institution:** Thapar Institute of Engineering and Technology  

> **Status:** This outline describes the intended architecture. No AWS deployment was performed as part of this work; existing resource state is unverified. Do not present cloud functionality, performance figures, or demo outcomes as verified until tested in the approved sandbox.

**Student Presenters:**
1. **Gagandeep Kaur** (1024170063) — Project Architecture & Backend Systems
2. **Puneet Singh** (1024170066) — Storage, S3 Versioning & Event-Driven Processing
3. **Aditya Gupta** (1024170204) — Frontend Dashboard & Security / RBAC Integration

---

## Part 1: Slide-by-Slide Presentation Content (10 Slides)

### Slide 1: Title & Project Identification
* **Title:** CloudForge — Advanced Cloud-Based Collaborative Project Workspace
* **Subtitle:** A Serverless AWS Architecture Design for Student Engineering Teams
* **Course:** Cloud Computing (UCS531)
* **Team Members:** Gagandeep Kaur, Puneet Singh, Aditya Gupta

---

### Slide 2: Problem Statement & Motivation
* **The Reality of Academic Team Projects:**
  * Multi-disciplinary deliverables: Source code (`.py`, `.js`), datasets (`.csv`), reports (`.pdf`, `.docx`), and presentations (`.pptx`).
  * Fragile workflows: Google Drive overwrites, lost file iterations, and missing dependencies.
  * Insecure sharing: Indefinite public link sharing without expiration or revocation.
  * Eleventh-hour submission panic: Manually bundling outdated file copies for final grading.
* **Our Core Question:** How can university development teams collaborate with file history and project-level authorization without running expensive dedicated servers?

---

### Slide 3: CloudForge Solution Overview
* **What CloudForge Is Designed to Become:** A serverless, event-driven AWS workspace designed to provide:
  * **Unified Workspace:** Centralized project hubs for source code, datasets, and documentation.
  * **Automatic S3 Versioning:** Every upload is version-controlled with point-in-time recovery.
  * **Asynchronous Event Pipeline:** EventBridge + SQS decouples background metadata processing from user interactions.
  * **Time-Limited Sharing:** On-demand S3 pre-signed URLs with auto-expiration (15m, 1h, 24h).
  * **Final Submission Snapshots:** Timestamped S3 copies and `.zip` generation; Object Lock is not configured.

---

### Slide 4: High-Level System Architecture (5-Layer Model)
* **1. Client Tier:** Web browsers accessing the React.js SPA dashboard.
* **2. Presentation Tier:** React 18 + Tailwind CSS; the current frontend is hosted on Vercel.
* **3. Auth & API Layer:** Planned Amazon Cognito User Pool + API Gateway + AWS Lambda (FastAPI/Mangum).
* **4. Storage & Data Layer:** Planned Amazon S3 and DynamoDB; AWS Backup is not configured.
* **5. Event Processing Layer:** Target design: Amazon EventBridge ➔ Amazon SQS ➔ AWS Lambda worker ➔ Amazon CloudWatch.

---

### Slide 5: Serverless Compute & REST API Design
* **AWS Lambda + FastAPI:**
  * High-performance ASGI framework on Lambda using the Mangum adapter.
  * No AWS latency or cost measurements have been taken; deployment and runtime behavior are unverified.
* **Cognito JWT Validation:**
  * The SAM template defines a Cognito JWT authorizer; it has not been deployed or tested.
  * The API checks project membership and roles (`Admin`, `Editor`, `Contributor`, `Viewer`):
    * Project Admins can invite team members and create snapshots.
    * File actions are restricted by project role.

---

### Slide 6: Storage Engine & S3 Versioning Mechanics
* **Direct-to-S3 Pre-Signed PUT Workflow:**
  * Eliminates server transfer bottlenecks: files stream directly from the browser to Amazon S3.
  * Overcomes API Gateway 10 MB payload limits and Lambda execution timeouts.
* **S3 Object Versioning & Recovery (planned):**
  * When configured, S3 can retain historical object versions under unique `versionId` values.
  * Point-in-time recovery uses `s3:CopyObject` with source `VersionId`, generating a fresh latest version without deleting historical audit points.

---

### Slide 7: Decoupled Event-Driven Pipeline
* **Why Decouple with EventBridge & SQS?**
  * S3 file operations emit events instantly (`Object Created`, `Object Deleted`).
  * EventBridge rules match bucket actions and buffer payloads into Amazon SQS.
  * Queue capacity and throughput have not been measured.
  * Background Lambda worker processes batches, updates `CloudForge_FileVersions`, recalculates project storage, and logs audit events to `CloudForge_ActivityLogs`.
  * **Loop Prevention:** S3 `/snapshots/` prefixes are ignored by the worker to prevent infinite event cascades.

---

### Slide 8: Data Modeling: Amazon DynamoDB
* **1. `CloudForge_Projects` (Partition Key: `projectId`):**
  * Stores project titles, descriptions, owner emails, member lists, total storage bytes, and snapshot statuses (`NONE` or `SUBMITTED`).
* **2. `CloudForge_FileVersions` (PK: `fileId`, Sort Key: `versionId`):**
  * Tracks filename, object byte size, uploader identity, upload timestamp, S3 key, and category.
* **3. `CloudForge_ActivityLogs` (PK: `projectId`, Sort Key: `timestamp`):**
  * Chronological audit log of all workspace events (`FILE_UPLOADED`, `VERSION_RECOVERED`, `LINK_SHARED`, `SNAPSHOT_CREATED`).

---

### Slide 9: Security Design & Remaining Configuration
* **IAM Least-Privilege Policies:**
  * Lambda roles restricted to named DynamoDB tables, specific S3 bucket prefixes, and SQS queue ARNs.
* **Time-Bound Data Sharing:**
  * Pre-signed GET URLs expire automatically after 15 minutes, 1 hour, or 24 hours.
* **AWS Backup:** Not configured in this project; recovery plans must be approved and deployed separately.
* **Submission Snapshots:** Timestamped S3 copies and ZIP archives are implemented in code; Object Lock and immutability are not configured.

---

### Slide 10: Implementation Status & Next Steps
* **Current Status:**
  * Frontend production build passes locally.
  * AWS resources and credentials were not configured or deployed as part of this work; existing account state is unverified.
  * Cognito authentication, DynamoDB persistence, S3 operations, and API authorization still require end-to-end testing.
* **Future Enhancements:**
  * Automated code plagiarism checks and static security analysis via containerized Lambda tasks.
  * Athena-powered in-browser SQL queries over S3 parquet datasets.
  * Webhook integrations with university LMS grading portals.

---

## Part 2: Post-Deployment Verification Checklist

Do not present these as completed demonstrations until the backend is deployed and each result is observed in the approved AWS account:

1. Register and confirm a Cognito user; verify correct and incorrect password behavior and logout.
2. Confirm unauthenticated API requests are rejected and a non-member cannot read a project.
3. Create a project and verify it persists after reload and a new sign-in.
4. Upload, download, delete, and restore an S3 file using authorized roles.
5. Invite a project member and verify their permitted actions and denied actions.
6. Create a timestamped snapshot and download its ZIP archive. Do not describe it as immutable unless S3 Object Lock is configured and verified.
7. Record actual AWS resource identifiers, costs/limits, and test evidence for the final presentation.
