# CloudForge: 10-Slide Academic Presentation & Live Demonstration Script
**Course:** Cloud Computing (UCS531)  
**Academic Institution:** Thapar Institute of Engineering and Technology  
**Faculty Advisor:** Dr. Anil Singh  

**Student Presenters:**
1. **Gagandeep Kaur** (1024170063) — Project Architecture & Backend Systems
2. **Puneet Singh** (1024170066) — Storage, S3 Versioning & Event-Driven Processing
3. **Aditya Gupta** (1024170204) — Frontend Dashboard & Security / RBAC Integration

---

## Part 1: Slide-by-Slide Presentation Content (10 Slides)

### Slide 1: Title & Project Identification
* **Title:** CloudForge — Advanced Cloud-Based Collaborative Project Workspace
* **Subtitle:** An Event-Driven, Serverless AWS Cloud Infrastructure for Student Engineering Teams
* **Course:** Cloud Computing (UCS531)
* **Team Members:** Gagandeep Kaur, Puneet Singh, Aditya Gupta
* **Faculty Advisor:** Dr. Anil Singh

---

### Slide 2: Problem Statement & Motivation
* **The Reality of Academic Team Projects:**
  * Multi-disciplinary deliverables: Source code (`.py`, `.js`), datasets (`.csv`), reports (`.pdf`, `.docx`), and presentations (`.pptx`).
  * Fragile workflows: Google Drive overwrites, lost file iterations, and missing dependencies.
  * Insecure sharing: Indefinite public link sharing without expiration or revocation.
  * Eleventh-hour submission panic: Manually bundling outdated file copies for final grading.
* **Our Core Question:** How can university development teams collaborate with enterprise-grade version control, role-based authorization, and immutable submission sealing without running expensive dedicated servers?

---

### Slide 3: CloudForge Solution Overview
* **What CloudForge Is:** A 100% serverless, event-driven AWS cloud platform providing:
  * **Unified Workspace:** Centralized project hubs for source code, datasets, and documentation.
  * **Automatic S3 Versioning:** Every upload is version-controlled with point-in-time recovery.
  * **Asynchronous Event Pipeline:** EventBridge + SQS decouples background metadata processing from user interactions.
  * **Time-Limited Sharing:** On-demand S3 pre-signed URLs with auto-expiration (15m, 1h, 24h).
  * **Final Submission Snapshots:** One-click packaging into immutable S3 archives with bundled `.zip` generation.

---

### Slide 4: High-Level System Architecture (5-Layer Model)
* **1. Client Tier:** Web browsers accessing the React.js SPA dashboard.
* **2. Presentation Tier:** React 18 + Tailwind CSS hosted on AWS Amplify / S3 Static Web Hosting.
* **3. Auth & API Layer:** Amazon Cognito User Pool (RBAC) + Amazon API Gateway + AWS Lambda (FastAPI/Mangum).
* **4. Storage & Data Layer:** Amazon S3 (Versioned) + Amazon DynamoDB (3 NoSQL tables) + AWS Backup.
* **5. Event Processing Layer:** Amazon EventBridge ➔ Amazon SQS (`cloudforge-file-events-queue`) ➔ AWS Lambda (Event Worker) ➔ Amazon CloudWatch.

---

### Slide 5: Serverless Compute & REST API Design
* **AWS Lambda + FastAPI:**
  * High-performance ASGI framework on Lambda using the Mangum adapter.
  * Sub-50ms warm invocation latency; scales to zero when idle (zero cost overnight).
* **Cognito JWT Validation:**
  * API Gateway Cognito Authorizer inspects tokens at the cloud edge.
  * RBAC claims (`ProjectLead`, `Contributor`) enforce least privilege on critical endpoints:
    * Only `ProjectLead` can invite team members and seal final submission snapshots.
    * `Contributors` manage files, initiate version recoveries, and generate share links.

---

### Slide 6: Storage Engine & S3 Versioning Mechanics
* **Direct-to-S3 Pre-Signed PUT Workflow:**
  * Eliminates server transfer bottlenecks: files stream directly from the browser to Amazon S3.
  * Overcomes API Gateway 10 MB payload limits and Lambda execution timeouts.
* **S3 Object Versioning & Atomic Recovery:**
  * Every file mutation retains its historical predecessor under a unique `versionId`.
  * Point-in-time recovery uses `s3:CopyObject` with source `VersionId`, generating a fresh latest version without deleting historical audit points.

---

### Slide 7: Decoupled Event-Driven Pipeline
* **Why Decouple with EventBridge & SQS?**
  * S3 file operations emit events instantly (`Object Created`, `Object Deleted`).
  * EventBridge rules match bucket actions and buffer payloads into Amazon SQS.
  * SQS absorbs deadline traffic spikes (e.g., 50 teams submitting simultaneously).
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

### Slide 9: Enterprise Security & Disaster Recovery
* **IAM Least-Privilege Policies:**
  * Lambda roles restricted to named DynamoDB tables, specific S3 bucket prefixes, and SQS queue ARNs.
* **Time-Bound Data Sharing:**
  * Pre-signed GET URLs expire automatically after 15 minutes, 1 hour, or 24 hours.
* **AWS Backup Protection:**
  * Policy-based automated backup vault protecting DynamoDB tables and S3 buckets with daily recovery points.
* **Immutable Submission Snapshots:**
  * Academic submissions are sealed in immutable S3 storage prefixes with bundled `.zip` archives.

---

### Slide 10: Conclusion, Results & Future Roadmap
* **Key Achievements:**
  * 100% serverless, zero-maintenance AWS infrastructure with instant auto-scaling.
  * Reliable version tracking and recovery for all project artifacts (code, datasets, reports).
  * Verified sub-second event pipeline and zero server memory overhead during large file transfers.
* **Future Enhancements:**
  * Automated code plagiarism checks and static security analysis via containerized Lambda tasks.
  * Athena-powered in-browser SQL queries over S3 parquet datasets.
  * Webhook integrations with university LMS grading portals.

---

## Part 2: Step-by-Step Live Demonstration Script

### Demo Checklist & Sequence for Academic Evaluation:

```text
[ Step 1: Authentication & Role-Based Access ]
  Action: Open the CloudForge web dashboard.
  Demonstrate:
    1. Sign in as Gagandeep Kaur (ProjectLead).
    2. Point out the "ProjectLead" role badge and active project metrics.
    3. Use the top persona switcher to toggle to Puneet Singh (Contributor) to show RBAC in action.

[ Step 2: Workspace Creation & Overview ]
  Action: Click "New Project Workspace".
  Demonstrate:
    1. Create a project titled "UCS531 Cloud Performance Benchmarking".
    2. Enter description and submit.
    3. Observe instant creation in DynamoDB and navigation into the project dashboard.

[ Step 3: Direct-to-S3 File Upload with Versioning ]
  Action: Upload a project file (e.g., 'pipeline.py' or 'dataset.csv').
  Demonstrate:
    1. Drag-and-drop the file into the upload zone.
    2. Observe the upload progress bar (S3 Pre-Signed PUT URL flow).
    3. Notice the newly added file with category badge and 'v1' version tag.
    4. Highlight the Real-Time Event Stream on the right updating with a 'FILE_UPLOADED' event.

[ Step 4: Overwrite Simulation & Multi-Version History ]
  Action: Upload an updated copy of the same file.
  Demonstrate:
    1. Upload the revised 'pipeline.py'.
    2. Observe the version badge update to '2 versions'.
    3. Click the version badge to open the S3 Object Version History drawer.
    4. Display both Version IDs, sizes, and timestamps retrieved from S3 and DynamoDB.

[ Step 5: Point-in-Time Version Recovery ]
  Action: Restore historical version v1.
  Demonstrate:
    1. Click "Recover Version" on historical v1 in the drawer.
    2. Confirm prompt.
    3. Observe success alert: S3 executes 's3:CopyObject' creating an active v3 cloned from v1.
    4. Verify the activity feed immediately records a 'VERSION_RECOVERED' audit log.

[ Step 6: Time-Limited Secure External Sharing ]
  Action: Click the Share icon on a dataset or report.
  Demonstrate:
    1. Select expiration duration (e.g., 15 Minutes).
    2. Click "Generate Pre-Signed S3 Link".
    3. Copy the URL and click "Test Download" to demonstrate direct S3 signed retrieval.
    4. Show the activity feed recording a 'LINK_SHARED' entry.

[ Step 7: Team Collaboration & Member Invitation ]
  Action: Click "Invite Collaborator".
  Demonstrate:
    1. Invite 'aditya.gupta@thapar.edu' with Contributor role.
    2. Show member avatar addition and activity audit entry.

[ Step 8: Final Submission Snapshot & Archival ]
  Action: Click "Submit Final Snapshot".
  Demonstrate:
    1. Review the snapshot actions (immutable S3 copy, .zip bundling, status lock).
    2. Click "Confirm & Generate Immutable Snapshot".
    3. Observe the project status transition to 'SUBMITTED' and 'Submission Sealed'.
    4. Download the generated 'final_submission.zip' containing all project files.
```
